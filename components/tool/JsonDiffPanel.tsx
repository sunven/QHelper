import { useCallback, useId, useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts'
import {
  DIFF_LABELS,
  type DiffChange,
  type DiffResult,
  formatDiffChange,
  generateDiffReport,
  getJsonValueType,
  jsonDiff,
} from '@/lib/utils/jsonDiff'

const CHANGE_TYPES = ['added', 'removed', 'modified', 'type-changed'] as const
const CHANGE_STYLES = {
  added: 'border-green-500/40 bg-green-500/5',
  removed: 'border-red-500/40 bg-red-500/5',
  modified: 'border-amber-500/40 bg-amber-500/5',
  'type-changed': 'border-violet-500/40 bg-violet-500/5',
  unchanged: 'border-border',
}

function CopyDiffButton({
  content,
  label,
}: {
  content: string
  label: string
}) {
  const [status, setStatus] = useState<
    'idle' | 'copying' | 'copied' | 'failed'
  >('idle')

  async function copy() {
    setStatus('copying')
    try {
      await navigator.clipboard.writeText(content)
      setStatus('copied')
    } catch {
      setStatus('failed')
    }
  }

  return (
    <div className="shrink-0">
      <Button
        size="sm"
        variant="outline"
        onClick={copy}
        disabled={status === 'copying'}
      >
        {status === 'copied' ? '已复制' : label}
      </Button>
      {status === 'failed' && (
        <p role="alert" className="mt-1 text-xs text-destructive">
          复制失败，请重试
        </p>
      )}
    </div>
  )
}

function ChangeItem({ change }: { change: DiffChange }) {
  return (
    <li className={`min-w-0 border p-3 ${CHANGE_STYLES[change.type]}`}>
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <div className="min-w-0 text-sm">
          <span className="mr-2 font-medium">{DIFF_LABELS[change.type]}</span>
          <code className="break-all">{change.path || '(根)'}</code>
          {change.type === 'type-changed' && (
            <span className="ml-2 text-xs text-muted-foreground">
              {getJsonValueType(change.oldValue)} →{' '}
              {getJsonValueType(change.newValue)}
            </span>
          )}
        </div>
        <CopyDiffButton
          content={`基准响应 → 待比较响应\n${formatDiffChange(change)}`}
          label="复制此项"
        />
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        {(
          [
            ['基准值', change.type === 'added', change.oldValue],
            ['待比较值', change.type === 'removed', change.newValue],
          ] as const
        ).map(([label, missing, value]) => (
          <div key={label} className="min-w-0">
            <span className="text-xs text-muted-foreground">{label}</span>
            <pre className="mt-1 whitespace-pre-wrap break-all font-mono text-xs">
              {missing ? '字段不存在' : JSON.stringify(value, null, 2)}
            </pre>
          </div>
        ))}
      </div>
    </li>
  )
}

function validate(text: string, label: string): string {
  if (!text.trim()) return `请输入${label}`
  try {
    JSON.parse(text)
    return ''
  } catch (error) {
    return `${label} JSON 无效：${error instanceof Error ? error.message : String(error)}`
  }
}

type JsonDiffPanelProps = {
  original: string
  modified: string
  onOriginalChange: (value: string) => void
  onModifiedChange: (value: string) => void
}

export function JsonDiffPanel({
  original,
  modified,
  onOriginalChange,
  onModifiedChange,
}: JsonDiffPanelProps) {
  const [result, setResult] = useState<DiffResult | null>(null)
  const [errors, setErrors] = useState({
    original: '',
    modified: '',
    comparison: '',
  })
  const [revision, setRevision] = useState(0)
  const [inputs, setInputs] = useState({ original, modified })
  const inputId = useId()

  // Reset before rendering new inputs, including history restores outside this panel.
  if (inputs.original !== original || inputs.modified !== modified) {
    setInputs({ original, modified })
    setResult(null)
    setErrors({ original: '', modified: '', comparison: '' })
  }

  const compare = useCallback(() => {
    const originalError = validate(original, '基准响应')
    const modifiedError = validate(modified, '待比较响应')
    setResult(null)
    setErrors({
      original: originalError,
      modified: modifiedError,
      comparison: '',
    })
    if (originalError || modifiedError) return
    try {
      // Pass the original text so root JSON strings are parsed exactly once by jsonDiff.
      setResult(jsonDiff(original, modified))
      setRevision((previous) => previous + 1)
    } catch (error) {
      setErrors({
        original: '',
        modified: '',
        comparison: `比较失败：${error instanceof Error ? error.message : String(error)}`,
      })
    }
  }, [original, modified])

  const shortcuts = useMemo(
    () => [
      {
        key: 'Enter',
        ctrlKey: true,
        description: '执行 Diff',
        action: compare,
      },
      {
        key: 'Enter',
        metaKey: true,
        description: '执行 Diff',
        action: compare,
      },
    ],
    [compare],
  )
  useKeyboardShortcuts({ shortcuts })

  function replaceInputs(before: string, after: string) {
    setResult(null)
    setErrors({ original: '', modified: '', comparison: '' })
    onOriginalChange(before)
    onModifiedChange(after)
  }

  return (
    <section className="min-w-0 flex-1" aria-label="接口响应差异排查">
      <div className="flex flex-wrap items-center gap-2 border-b p-2">
        <Button size="sm" onClick={compare}>
          执行 Diff
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => replaceInputs(modified, original)}
        >
          交换输入
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => replaceInputs('', '')}
        >
          清空输入
        </Button>
        <p className="text-xs text-muted-foreground">
          本地比较；忽略对象字段顺序，数组按位置比较。
        </p>
      </div>
      <div className="grid min-w-0 gap-3 p-3 md:grid-cols-2">
        {(
          [
            [
              'original',
              '基准响应',
              original,
              onOriginalChange,
              'json-input',
              '请输入 JSON 字符串',
            ],
            [
              'modified',
              '待比较响应',
              modified,
              onModifiedChange,
              'json-diff-modified-input',
              '请输入新的 JSON 字符串用于对比',
            ],
          ] as const
        ).map(([side, label, value, onChange, testId, placeholder]) => (
          <div key={side} className="min-w-0">
            <label
              htmlFor={`${inputId}-${side}`}
              className="mb-2 block text-sm font-medium"
            >
              {label}
            </label>
            <Textarea
              id={`${inputId}-${side}`}
              data-testid={testId}
              value={value}
              onChange={(event) => onChange(event.target.value)}
              placeholder={placeholder}
              aria-invalid={!!errors[side]}
              aria-describedby={
                errors[side] ? `${inputId}-${side}-error` : undefined
              }
              className="min-h-56 w-full resize-y font-mono text-sm"
            />
            {errors[side] && (
              <p
                id={`${inputId}-${side}-error`}
                role="alert"
                className="mt-2 break-all text-sm text-destructive"
              >
                {errors[side]}
              </p>
            )}
          </div>
        ))}
      </div>
      {errors.comparison && (
        <p role="alert" className="p-3 text-sm text-destructive">
          {errors.comparison}
        </p>
      )}
      {result && (
        <div
          key={revision}
          data-testid="json-diff-result"
          className="min-w-0 border-t p-3"
        >
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-sm font-semibold">
              Diff 结果（{result.changes.length} 处变更）
            </h3>
            <CopyDiffButton
              content={generateDiffReport(result)}
              label="复制全部差异"
            />
          </div>
          <div
            className="mb-3 flex flex-wrap gap-3 text-xs"
            aria-label="差异统计"
          >
            {CHANGE_TYPES.map((type) => (
              <span key={type}>
                {DIFF_LABELS[type]}{' '}
                {result.changes.filter((change) => change.type === type).length}
              </span>
            ))}
          </div>
          {result.isModified ? (
            <ul className="space-y-2">
              {result.changes.map((change) => (
                <ChangeItem key={change.path} change={change} />
              ))}
            </ul>
          ) : (
            <p className="py-4 text-center text-sm text-muted-foreground">
              两个 JSON 内容相同，没有发现差异
            </p>
          )}
        </div>
      )}
    </section>
  )
}
