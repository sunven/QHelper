import { useId, useState } from 'react'
import { CopyButton } from '@/components/tool/CopyButton'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts'
import { getErrorMessage } from '@/lib/utils'
import {
  DIFF_LABELS,
  type DiffChange,
  type DiffResult,
  type DiffType,
  diffValues,
  formatChangeReport,
  generateDiffReport,
  getJsonValueType,
} from '@/lib/utils/jsonDiff'

const CHANGE_TYPES = ['added', 'removed', 'modified', 'type-changed'] as const
const CHANGE_STYLES: Record<DiffType, string> = {
  added: 'border-green-500/40 bg-green-500/5',
  removed: 'border-red-500/40 bg-red-500/5',
  modified: 'border-amber-500/40 bg-amber-500/5',
  'type-changed': 'border-violet-500/40 bg-violet-500/5',
  unchanged: 'border-border',
}

function DiffValue({
  label,
  missing,
  value,
}: {
  label: string
  missing: boolean
  value: unknown
}) {
  return (
    <div className="min-w-0">
      <span className="text-xs text-muted-foreground">{label}</span>
      <pre className="mt-1 whitespace-pre-wrap break-all font-mono text-xs">
        {missing ? '字段不存在' : JSON.stringify(value, null, 2)}
      </pre>
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
        <CopyButton
          content={formatChangeReport(change)}
          label="复制此项"
          size="sm"
          showFailureHint
        />
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <DiffValue
          label="基准值"
          missing={change.type === 'added'}
          value={change.oldValue}
        />
        <DiffValue
          label="待比较值"
          missing={change.type === 'removed'}
          value={change.newValue}
        />
      </div>
    </li>
  )
}

function DiffInput({
  id,
  label,
  testId,
  value,
  onChange,
  placeholder,
  error,
}: {
  id: string
  label: string
  testId: string
  value: string
  onChange: (value: string) => void
  placeholder: string
  error: string
}) {
  return (
    <div className="min-w-0">
      <label htmlFor={id} className="mb-2 block text-sm font-medium">
        {label}
      </label>
      <Textarea
        id={id}
        data-testid={testId}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-error` : undefined}
        className="min-h-56 w-full resize-y font-mono text-sm"
      />
      {error && (
        <p
          id={`${id}-error`}
          role="alert"
          className="mt-2 break-all text-sm text-destructive"
        >
          {error}
        </p>
      )}
    </div>
  )
}

function parseJsonInput(
  text: string,
  label: string,
): { error: string; value?: unknown } {
  if (!text.trim()) return { error: `请输入${label}` }
  try {
    return { error: '', value: JSON.parse(text) }
  } catch (error) {
    return { error: `${label} JSON 无效：${getErrorMessage(error)}` }
  }
}

type JsonDiffPanelProps = {
  original: string
  modified: string
  onOriginalChange: (value: string) => void
  onModifiedChange: (value: string) => void
}

// 比较结果连同产生它的输入一起保存，输入变化即失效。
type Outcome = {
  original: string
  modified: string
  result: DiffResult | null
  errors: { original: string; modified: string }
}

export function JsonDiffPanel({
  original,
  modified,
  onOriginalChange,
  onModifiedChange,
}: JsonDiffPanelProps) {
  const [outcome, setOutcome] = useState<Outcome | null>(null)
  const inputId = useId()

  // Invalidate the outcome when inputs change, including history restores outside this panel.
  const stale =
    outcome !== null &&
    (outcome.original !== original || outcome.modified !== modified)
  if (stale) setOutcome(null)
  const current = stale ? null : outcome

  function compare() {
    const before = parseJsonInput(original, '基准响应')
    const after = parseJsonInput(modified, '待比较响应')
    if (before.error || after.error) {
      setOutcome({
        original,
        modified,
        result: null,
        errors: { original: before.error, modified: after.error },
      })
      return
    }
    // Pass already-parsed values so each side is parsed exactly once.
    setOutcome({
      original,
      modified,
      result: diffValues(before.value, after.value),
      errors: { original: '', modified: '' },
    })
  }

  const shortcuts = [
    { key: 'Enter', ctrlKey: true, description: '执行 Diff', action: compare },
    { key: 'Enter', metaKey: true, description: '执行 Diff', action: compare },
  ]
  useKeyboardShortcuts({ shortcuts })

  function replaceInputs(before: string, after: string) {
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
        <DiffInput
          id={`${inputId}-original`}
          label="基准响应"
          testId="json-input"
          value={original}
          onChange={onOriginalChange}
          placeholder="请输入 JSON 字符串"
          error={current?.errors.original ?? ''}
        />
        <DiffInput
          id={`${inputId}-modified`}
          label="待比较响应"
          testId="json-diff-modified-input"
          value={modified}
          onChange={onModifiedChange}
          placeholder="请输入新的 JSON 字符串用于对比"
          error={current?.errors.modified ?? ''}
        />
      </div>
      {current?.result && <ResultView result={current.result} />}
    </section>
  )
}

function ResultView({ result }: { result: DiffResult }) {
  return (
    <div data-testid="json-diff-result" className="min-w-0 border-t p-3">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-semibold">
          Diff 结果（{result.changes.length} 处变更）
        </h3>
        <CopyButton
          content={generateDiffReport(result)}
          label="复制全部差异"
          size="sm"
          showFailureHint
        />
      </div>
      <div className="mb-3 flex flex-wrap gap-3 text-xs" aria-label="差异统计">
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
  )
}
