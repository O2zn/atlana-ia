import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { VulnerabilityCard } from '@/components/VulnerabilityCard'
import { Button } from '@/components/ui/button'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const vulnerabilities = await prisma.vulnerability.findMany({
    include: {
      auditLogs: {
        orderBy: { timestamp: 'desc' },
        take: 1,
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  const pending = vulnerabilities.filter(v => v.status === 'AWAITING_APPROVAL')
  const others = vulnerabilities.filter(v => v.status !== 'AWAITING_APPROVAL')

  return (
    <main className="container mx-auto max-w-4xl py-10">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Atlana</h1>
          <p className="text-sm text-slate-500">IaC Security Remediation — HITL Dashboard</p>
        </div>
        <Link href="/scan">
          <Button>New Scan</Button>
        </Link>
      </div>

      {pending.length > 0 && (
        <section className="mb-8">
          <h2 className="mb-3 text-lg font-semibold text-amber-700">
            Awaiting Approval ({pending.length})
          </h2>
          {pending.map(v => (
            <VulnerabilityCard
              key={v.id}
              vulnerability={v}
              auditLog={v.auditLogs[0] ?? null}
            />
          ))}
        </section>
      )}

      {others.length > 0 && (
        <section>
          <h2 className="mb-3 text-lg font-semibold text-slate-700">History</h2>
          {others.map(v => (
            <VulnerabilityCard
              key={v.id}
              vulnerability={v}
              auditLog={v.auditLogs[0] ?? null}
            />
          ))}
        </section>
      )}

      {vulnerabilities.length === 0 && (
        <div className="rounded-lg border-2 border-dashed border-slate-200 py-20 text-center">
          <p className="text-slate-500">No scans yet.</p>
          <Link href="/scan">
            <Button variant="outline" className="mt-4">Run your first scan</Button>
          </Link>
        </div>
      )}
    </main>
  )
}
