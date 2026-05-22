import { Check, Copy } from 'lucide-react'
import { Button } from '@/components/ui/button'

export type CopyButtonState = 'copied' | 'failed'

type CopyButtonProps = {
  label: string
  onClick: () => void
  state?: CopyButtonState
}

export function CopyButton({ label, state, onClick }: CopyButtonProps) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      aria-label={label}
      title={label}
      onClick={onClick}
    >
      {state === 'copied' ? (
        <Check data-icon="inline-start" aria-hidden="true" />
      ) : (
        <Copy data-icon="inline-start" aria-hidden="true" />
      )}
      <span>{state === 'copied' ? '已复制' : '复制'}</span>
    </Button>
  )
}
