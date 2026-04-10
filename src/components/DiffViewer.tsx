type DiffViewerProps = {
  original: string
  fixed: string
}

export function DiffViewer({ original, fixed }: DiffViewerProps) {
  return (
    <div className="grid grid-cols-2 gap-2 text-xs">
      <div>
        <p className="mb-1 font-semibold text-red-600">Original</p>
        <pre className="overflow-auto rounded border border-red-200 bg-red-50 p-3 text-slate-800">
          {original}
        </pre>
      </div>
      <div>
        <p className="mb-1 font-semibold text-green-600">Fixed</p>
        <pre className="overflow-auto rounded border border-green-200 bg-green-50 p-3 text-slate-800">
          {fixed}
        </pre>
      </div>
    </div>
  )
}
