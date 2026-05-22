import { TriangleAlert } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import type { PipelineResult } from '@/lib/text-preview/parser/types'

type WorkspaceWarningProps = {
  message: string
}

export function WorkspaceWarning({ message }: WorkspaceWarningProps) {
  return (
    <Alert
      className="border-x-0 border-b-0 border-[var(--warning-border)] bg-[var(--warning-surface)] px-3 py-2.5 text-[var(--warning)]"
      role="status"
    >
      <TriangleAlert aria-hidden="true" />
      <AlertTitle>本机保存提示</AlertTitle>
      <AlertDescription>{message}</AlertDescription>
    </Alert>
  )
}

type WarningsProps = {
  result: PipelineResult
}

export function Warnings({ result }: WarningsProps) {
  if (result.warnings.length === 0) {
    return null
  }

  return (
    <section
      className="grid gap-2 border-t border-[var(--border)] px-3 py-2.5"
      aria-label="状态提示"
    >
      {result.warnings.map((warning, index) => (
        <Alert
          className="border-[var(--warning-border)] bg-[var(--warning-surface)] px-2.5 py-2 text-[var(--warning)]"
          key={`${warning.code}-${warning.parserName ?? index}`}
        >
          <TriangleAlert aria-hidden="true" />
          <AlertTitle>
            {warning.parserName ? `${warning.parserName} 提示` : '解析提示'}
          </AlertTitle>
          <AlertDescription>{warning.message}</AlertDescription>
        </Alert>
      ))}
    </section>
  )
}
