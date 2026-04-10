import { Badge } from '@/components/ui/badge'

const SEVERITY_COLORS: Record<string, string> = {
  CRITICAL: 'bg-red-600 text-white hover:bg-red-700',
  HIGH: 'bg-orange-500 text-white hover:bg-orange-600',
  MEDIUM: 'bg-yellow-500 text-white hover:bg-yellow-600',
  LOW: 'bg-blue-500 text-white hover:bg-blue-600',
}

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-slate-400 text-white',
  ANALYZING: 'bg-violet-500 text-white animate-pulse',
  AWAITING_APPROVAL: 'bg-amber-500 text-white',
  APPROVED: 'bg-green-600 text-white',
  REJECTED: 'bg-slate-600 text-white',
  VALIDATION_FAILED: 'bg-red-500 text-white',
}

export function SeverityBadge({ severity }: { severity: string | null }) {
  if (!severity) return null
  return (
    <Badge className={SEVERITY_COLORS[severity] ?? 'bg-slate-400 text-white'}>
      {severity}
    </Badge>
  )
}

export function StatusBadge({ status }: { status: string }) {
  return (
    <Badge className={STATUS_COLORS[status] ?? 'bg-slate-400 text-white'}>
      {status.replace(/_/g, ' ')}
    </Badge>
  )
}
