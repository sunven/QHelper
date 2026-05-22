import { FileText } from 'lucide-react'
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty'
import {
  GROUP_LABELS,
  GROUP_ORDER,
  type ExtractedItem,
  type ExtractedItemType,
  type PipelineResult,
} from '@/lib/text-preview/parser/types'
import type { CopyButtonState } from './CopyButton'
import { CopyButton } from './CopyButton'
import { FallbackValue } from './FallbackValue'

type ResultListProps = {
  copyState: Record<string, CopyButtonState>
  hasInput: boolean
  onCopy: (key: string, value: string) => void
  result: PipelineResult
  tabId: string
}

export function ResultList({
  result,
  copyState,
  onCopy,
  hasInput,
  tabId,
}: ResultListProps) {
  if (!hasInput) {
    return (
      <Empty className="m-3 min-h-52 flex-none border border-dashed border-[var(--border-strong)] bg-[var(--surface-muted)] p-4 text-[var(--text)]">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <FileText aria-hidden="true" />
          </EmptyMedia>
          <EmptyTitle>粘贴文本后会在本地提取可复制对象。</EmptyTitle>
          <EmptyDescription>
            支持 IP、URL、Unix 路径、shell 命令；内容会保存在本机浏览器。
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    )
  }

  if (result.items.length === 0) {
    return (
      <Empty className="m-3 min-h-52 flex-none border border-dashed border-[var(--border-strong)] bg-[var(--surface-muted)] p-4 text-[var(--text)]">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <FileText aria-hidden="true" />
          </EmptyMedia>
          <EmptyTitle>没有识别到可复制对象。</EmptyTitle>
          <EmptyDescription>
            支持 IP、URL、Unix 路径、shell 命令。
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    )
  }

  const lineGroups = groupItemsByLine(result.items)
  const typeCounts = countItemsByType(result.items)
  const allCopyKey = `${tabId}:all`
  const allCopyValue = result.items.map((item) => item.copyValue).join('\n')
  const allCopyState = copyState[allCopyKey]

  return (
    <div className="grid content-start">
      <div className="sticky top-0 z-10 grid gap-2 border-b border-[var(--border)] bg-[var(--surface)] px-3 py-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="m-0 text-xs font-medium text-[var(--text-muted)]">
            {result.items.length} 个可复制对象
          </p>
          <CopyButton
            label="复制全部对象"
            state={allCopyState}
            onClick={() => onCopy(allCopyKey, allCopyValue)}
          />
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          {GROUP_ORDER.map((type) => (
            <span
              key={type}
              className="inline-flex items-center gap-1 border border-[var(--border)] bg-[var(--surface-soft)] px-1.5 py-0.5 text-xs text-[var(--text-muted)]"
            >
              <span>{GROUP_LABELS[type]}</span>
              <span className="font-mono text-[var(--text)]">
                {typeCounts[type] ?? 0}
              </span>
            </span>
          ))}
        </div>
        {allCopyState === 'failed' ? (
          <FallbackValue className="basis-full" value={allCopyValue} />
        ) : null}
      </div>
      {lineGroups.map((group) => (
        <ResultLineRow
          group={group}
          copyState={copyState}
          key={group.lineNumber}
          onCopy={onCopy}
          tabId={tabId}
        />
      ))}
    </div>
  )
}

type ResultLineGroup = {
  itemsByType: Partial<Record<ExtractedItemType, ExtractedItem[]>>
  lineNumber: number
}

function groupItemsByLine(items: ExtractedItem[]): ResultLineGroup[] {
  const groupsByLine = new Map<number, ResultLineGroup>()

  for (const item of items) {
    const group =
      groupsByLine.get(item.lineNumber) ??
      ({
        lineNumber: item.lineNumber,
        itemsByType: {},
      } satisfies ResultLineGroup)
    const itemsByType = group.itemsByType[item.type] ?? []
    itemsByType.push(item)
    group.itemsByType[item.type] = itemsByType
    groupsByLine.set(item.lineNumber, group)
  }

  return Array.from(groupsByLine.values()).sort(
    (left, right) => left.lineNumber - right.lineNumber,
  )
}

function countItemsByType(items: ExtractedItem[]) {
  return items.reduce<Partial<Record<ExtractedItemType, number>>>(
    (counts, item) => ({
      ...counts,
      [item.type]: (counts[item.type] ?? 0) + 1,
    }),
    {},
  )
}

type ResultLineRowProps = {
  copyState: Record<string, CopyButtonState>
  group: ResultLineGroup
  onCopy: (key: string, value: string) => void
  tabId: string
}

function ResultLineRow({
  group,
  copyState,
  onCopy,
  tabId,
}: ResultLineRowProps) {
  return (
    <fieldset
      data-line-number={group.lineNumber}
      className="m-0 grid min-w-0 grid-cols-[3.25rem_minmax(0,1fr)] gap-3 border-0 border-b border-[var(--border)] px-3 py-2 last:border-b-0 hover:bg-[var(--surface-soft)]"
    >
      <legend className="sr-only">{`第 ${group.lineNumber} 行提取结果`}</legend>
      <div className="pt-1 font-mono text-xs text-[var(--text-muted)]">
        {group.lineNumber}
      </div>
      <div className="grid min-w-0 gap-2">
        {GROUP_ORDER.map((type) => {
          const items = group.itemsByType[type] ?? []
          if (items.length === 0) {
            return null
          }

          return (
            <section className="grid min-w-0 gap-1" key={type}>
              <h3 className="m-0 text-xs font-medium text-[var(--text-muted)]">
                {GROUP_LABELS[type]}
              </h3>
              <div className="flex min-w-0 flex-wrap items-start gap-x-3 gap-y-2">
                {items.map((item) => {
                  const copyKey = `${tabId}:${item.id}`
                  const state = copyState[copyKey]
                  return (
                    <div
                      className="grid min-w-0 max-w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-1.5 py-0.5"
                      key={item.id}
                    >
                      <code
                        className="min-w-0 max-w-full break-all font-mono text-[13px] leading-[1.35]"
                        title={item.value}
                      >
                        {item.value}
                      </code>
                      <CopyButton
                        label={`复制 ${item.value}`}
                        state={state}
                        onClick={() => onCopy(copyKey, item.copyValue)}
                      />
                      {state === 'failed' ? (
                        <FallbackValue
                          className="col-span-2 mt-1 min-w-80 max-w-96"
                          value={item.copyValue}
                        />
                      ) : null}
                    </div>
                  )
                })}
              </div>
            </section>
          )
        })}
      </div>
    </fieldset>
  )
}
