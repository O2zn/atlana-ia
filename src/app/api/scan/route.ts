import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { analyzeIaC } from '@/lib/agent/analyzer'

const ScanRequestSchema = z.object({
  content: z.string().min(1).max(50000),
  resourcePath: z.string().min(1).max(100),
})

export async function POST(request: NextRequest) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = ScanRequestSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request', details: parsed.error.issues }, { status: 400 })
  }

  const { content, resourcePath } = parsed.data

  const vulnerability = await prisma.vulnerability.create({
    data: { content, resourcePath, status: 'PENDING' },
  })

  await prisma.vulnerability.update({
    where: { id: vulnerability.id },
    data: { status: 'ANALYZING' },
  })

  try {
    const { result, promptHash } = await analyzeIaC(content, resourcePath)

    const topVuln = result.vulnerabilities[0]

    await prisma.vulnerability.update({
      where: { id: vulnerability.id },
      data: {
        severity: topVuln?.severity ?? 'MEDIUM',
        description: topVuln?.description ?? result.reasoning,
        status: 'AWAITING_APPROVAL',
      },
    })

    await prisma.agentAuditLog.create({
      data: {
        vulnerabilityId: vulnerability.id,
        promptHash,
        generatedFix: result.fix,
        confidenceScore: result.confidenceScore,
        securityValidationPassed: true,
        humanDecision: 'PENDING',
      },
    })

    return NextResponse.json({ id: vulnerability.id }, { status: 201 })
  } catch (error) {
    await prisma.vulnerability.update({
      where: { id: vulnerability.id },
      data: { status: 'VALIDATION_FAILED' },
    })

    await prisma.agentAuditLog.create({
      data: {
        vulnerabilityId: vulnerability.id,
        promptHash: 'error',
        securityValidationPassed: false,
        humanDecision: 'REJECTED',
      },
    })

    return NextResponse.json(
      { error: 'Analysis failed', details: error instanceof Error ? error.message : 'Unknown' },
      { status: 500 }
    )
  }
}
