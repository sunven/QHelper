import { TriangleAlert } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'

type FallbackValueProps = {
  className?: string
  value: string
}

export function FallbackValue({ className, value }: FallbackValueProps) {
  return (
    <Alert
      className={cn(
        'border-[var(--danger-border)] bg-[var(--danger-surface)] p-2.5 text-[var(--danger)]',
        className,
      )}
      variant="destructive"
    >
      <TriangleAlert aria-hidden="true" />
      <AlertTitle>浏览器阻止了自动复制。</AlertTitle>
      <AlertDescription>
        <p className="mt-0 mb-2 text-xs text-[var(--danger)]">
          请手动复制下方完整内容；内部站点应使用 HTTPS。
        </p>
        <Textarea
          readOnly
          value={value}
          aria-label="手动复制内容"
          className="mt-2 min-h-[68px] w-full resize-y p-2 font-mono text-[13px] text-[var(--text)]"
          onFocus={(event) => event.currentTarget.select()}
        />
      </AlertDescription>
    </Alert>
  )
}
