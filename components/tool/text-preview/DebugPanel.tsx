import type { PipelineResult } from '@/lib/text-preview/parser/types'

type DebugPanelProps = {
  result: PipelineResult
}

export function DebugPanel({ result }: DebugPanelProps) {
  return (
    <details className="m-3 rounded-none border border-[var(--border)] bg-[var(--surface-muted)]">
      <summary className="cursor-pointer px-3 py-2.5 font-semibold">
        解析诊断
      </summary>
      <pre className="m-0 overflow-visible whitespace-pre-wrap break-all border-t border-[var(--border)] p-3 text-xs">
        {JSON.stringify(result.diagnostics, null, 2)}
      </pre>
    </details>
  )
}
