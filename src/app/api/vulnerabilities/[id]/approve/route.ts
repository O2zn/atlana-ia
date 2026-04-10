import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'

const ApproveSchema = z.object({
  reviewedBy: z.string().min(1).max(100),
})

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = ApproveSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'reviewedBy is required' }, { status: 400 })
  }

  const vulnerability = await prisma.vulnerability.findUnique({ where: { id } })
  if (!vulnerability || vulnerability.status !== 'AWAITING_APPROVAL') {
    return NextResponse.json({ error: 'Not found or not pending approval' }, { status: 404 })
  }

  await prisma.$transaction([
    prisma.vulnerability.update({
      where: { id },
      data: { status: 'APPROVED' },
    }),
    prisma.agentAuditLog.updateMany({
      where: { vulnerabilityId: id, humanDecision: 'PENDING' },
      data: { humanDecision: 'APPROVED', reviewedBy: parsed.data.reviewedBy },
    }),
  ])

  return NextResponse.json({ success: true })
}
