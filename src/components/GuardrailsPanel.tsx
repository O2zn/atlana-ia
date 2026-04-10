type GuardrailsPanelProps = {
  promptHash: string
  validationPassed: boolean
  confidenceScore: number | null
}

export function GuardrailsPanel({ promptHash, validationPassed, confidenceScore }: GuardrailsPanelProps) {
  return (
    <div className="rounded-md border border-slate-200 bg-slate-50 p-4 font-mono text-xs">
      <p className="mb-2 font-sans text-sm font-semibold text-slate-700">Guardrails</p>
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <span className="text-slate-500">prompt_hash:</span>
          <span className="truncate text-slate-800">{promptHash.slice(0, 16)}…</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-slate-500">schema_valid:</span>
          <span className={validationPassed ? 'text-green-600' : 'text-red-600'}>
            {validationPassed ? '✓ true' : '✗ false'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-slate-500">confidence:</span>
          <span className="text-slate-800">
            {confidenceScore !== null ? `${(confidenceScore * 100).toFixed(0)}%` : '—'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-slate-500">hitl_required:</span>
          <span className="text-green-600">✓ true</span>
        </div>
      </div>
    </div>
  )
}
