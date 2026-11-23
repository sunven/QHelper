import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { formatIntervalSeconds } from '@/lib/auto-refresh/url'
import { cn } from '@/lib/utils'

type IntervalInputProps = {
  valueSeconds: number
  onChange: (seconds: number) => void
  presets: readonly number[]
  minSeconds: number
  maxSeconds: number
  disabled?: boolean
  compact?: boolean
  id?: string
}

export function IntervalInput({
  valueSeconds,
  onChange,
  presets,
  minSeconds,
  maxSeconds,
  disabled = false,
  compact = false,
  id,
}: IntervalInputProps) {
  const [draft, setDraft] = useState(String(valueSeconds))
  const [lastValueSeconds, setLastValueSeconds] = useState(valueSeconds)

  // 外部值变化时在渲染期同步草稿，替代 prop→state 的 effect。
  if (lastValueSeconds !== valueSeconds) {
    setLastValueSeconds(valueSeconds)
    setDraft(String(valueSeconds))
  }

  const commitDraft = (raw: string) => {
    setDraft(raw)
    const parsed = Number.parseInt(raw, 10)
    if (Number.isFinite(parsed)) {
      onChange(parsed)
    }
  }

  return (
    <div
      className={cn(
        'flex flex-col gap-2',
        compact &&
          'flex-row flex-wrap items-center gap-x-3 gap-y-1 font-mono tabular-nums',
      )}
    >
      <div className="flex flex-wrap items-center gap-1">
        {presets.map((preset) => (
          <Button
            key={preset}
            type="button"
            size={compact ? 'xs' : 'sm'}
            variant={
              !compact && valueSeconds === preset ? 'default' : 'outline'
            }
            aria-pressed={valueSeconds === preset}
            className={
              compact
                ? 'aria-pressed:border-primary aria-pressed:text-primary'
                : undefined
            }
            disabled={disabled}
            onClick={() => onChange(preset)}
          >
            {formatIntervalSeconds(preset)}
          </Button>
        ))}
      </div>
      <div className="flex items-center gap-2">
        <Input
          id={id}
          type="number"
          min={minSeconds}
          max={maxSeconds}
          step={1}
          inputMode="numeric"
          value={draft}
          disabled={disabled}
          onChange={(event) => commitDraft(event.target.value)}
          onBlur={() => {
            const parsed = Number.parseInt(draft, 10)
            if (
              !Number.isFinite(parsed) ||
              parsed < minSeconds ||
              parsed > maxSeconds
            ) {
              setDraft(String(valueSeconds))
            }
          }}
          className={compact ? 'h-6 w-16 px-2' : 'w-28'}
          aria-label="自定义刷新间隔（秒）"
        />
        <span className="text-xs text-muted-foreground">
          {compact
            ? '秒'
            : `秒（${formatIntervalSeconds(minSeconds)} – ${formatIntervalSeconds(maxSeconds)}）`}
        </span>
      </div>
    </div>
  )
}
