import { ChevronDown, ChevronRight } from 'lucide-react'
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from 'react'

export type TreeData = {
  id: string
  children?: TreeData[]
  [key: string]: unknown
}

export type TreeColumn = {
  key: string
  header: string
  width?: string | number
  render?: (value: unknown, data: TreeData, index: number, level: number) => ReactNode
}

export type TreeTableProps = {
  data: TreeData[] | undefined
  columns: TreeColumn[]
  className?: string
  expandSignal?: number
  collapseSignal?: number
  selectedRowId?: string | null
  onRowSelect?: (item: TreeData) => void
  /**
   * Checked row ids. Passing this enables the checkbox column; an empty set still
   * enables it. Toggling a row applies the same state to its whole subtree, while
   * the header checkbox covers the selectable rows of `data` alone, so callers can
   * accumulate a selection across several filtered views without hidden rows being
   * touched.
   */
  checkedIds?: ReadonlySet<string>
  onCheckedIdsChange?: (ids: Set<string>) => void
  /**
   * Which rows may join the selection. Defaults to all of them. A rejected row gets
   * a disabled checkbox and is left out of select-all and of ancestor promotion, so
   * nothing ends up selected that the caller would refuse to act on.
   */
  isSelectable?: (item: TreeData) => boolean
}

function alwaysSelectable() {
  return true
}

function TriStateCheckbox({
  ariaLabel,
  checked,
  disabled,
  indeterminate,
  onChange,
}: {
  ariaLabel: string
  checked: boolean
  disabled?: boolean
  indeterminate: boolean
  onChange: (checked: boolean) => void
}) {
  const ref = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (ref.current) {
      ref.current.indeterminate = indeterminate
    }
  }, [indeterminate])

  return (
    <input
      ref={ref}
      type="checkbox"
      aria-label={ariaLabel}
      checked={checked}
      disabled={disabled}
      onChange={(event) => onChange(event.target.checked)}
      className="size-3.5 shrink-0 cursor-pointer accent-slate-900 disabled:cursor-not-allowed disabled:opacity-40"
    />
  )
}

function renderCell(
  column: TreeColumn,
  item: TreeData,
  index: number,
  level: number,
) {
  const value = item[column.key]
  return column.render ? column.render(value, item, index, level) : String(value ?? '')
}

function TreeNode({
  item,
  columns,
  level,
  expandedRows,
  setExpandedRows,
  selectedRowId,
  onRowSelect,
  checkedIds,
  selectableIds,
  subtreeIdsByNode,
  onToggleChecked,
}: {
  item: TreeData
  columns: TreeColumn[]
  level: number
  expandedRows: Record<string, boolean>
  setExpandedRows: Dispatch<SetStateAction<Record<string, boolean>>>
  selectedRowId?: string | null
  onRowSelect?: (item: TreeData) => void
  checkedIds?: ReadonlySet<string>
  selectableIds: ReadonlySet<string>
  subtreeIdsByNode: Map<string, string[]>
  onToggleChecked: (id: string, checked: boolean) => void
}) {
  const hasChildren = Boolean(item.children?.length)
  const isExpanded = expandedRows[item.id] ?? true
  const isSelected = selectedRowId === item.id
  const rowLabel = String(item[columns[0]?.key] ?? item.id)
  const isSelectable = selectableIds.has(item.id)
  const subtreeIds = subtreeIdsByNode.get(item.id) ?? [item.id]
  const checkedCount = subtreeIds.filter((id) => checkedIds?.has(id)).length
  const isChecked = checkedCount === subtreeIds.length
  const isIndeterminate = checkedCount > 0 && !isChecked

  return (
    <>
      <tr
        className={`border-b border-slate-200 hover:bg-slate-50 ${isSelected ? 'bg-blue-50 hover:bg-blue-50' : ''}`}
        data-selected={isSelected || undefined}
        onClick={() => onRowSelect?.(item)}
      >
        {checkedIds && (
          <td
            className="w-9 px-2.5 py-1.5"
            onClick={(event) => event.stopPropagation()}
          >
            <TriStateCheckbox
              ariaLabel={`Select ${rowLabel}`}
              checked={isSelectable && isChecked}
              disabled={!isSelectable}
              indeterminate={isSelectable && isIndeterminate}
              onChange={(checked) => onToggleChecked(item.id, checked)}
            />
          </td>
        )}
        {columns.map((column, index) => (
          <td key={column.key} className="px-2.5 py-1.5 text-xs text-slate-600">
            <div className="flex min-w-0 items-center">
              {index === 0 && (
                <>
                  <div className="shrink-0" style={{ width: `${level * 18}px` }} />
                  {hasChildren && (
                    <button
                      type="button"
                      aria-label={isExpanded ? 'Collapse row' : 'Expand row'}
                      onClick={() =>
                        setExpandedRows((current) => ({
                          ...current,
                          [item.id]: !isExpanded,
                        }))
                      }
                      className="mr-1 flex h-5 w-5 cursor-pointer items-center justify-center rounded-none text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                    >
                      {isExpanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                    </button>
                  )}
                </>
              )}
              <div className="truncate">{renderCell(column, item, index, level)}</div>
            </div>
          </td>
        ))}
      </tr>
      {isExpanded &&
        item.children?.map((child) => (
          <TreeNode
            key={child.id}
            item={child}
            columns={columns}
            level={level + 1}
            expandedRows={expandedRows}
            setExpandedRows={setExpandedRows}
            selectedRowId={selectedRowId}
            onRowSelect={onRowSelect}
            checkedIds={checkedIds}
            selectableIds={selectableIds}
            subtreeIdsByNode={subtreeIdsByNode}
            onToggleChecked={onToggleChecked}
          />
        ))}
    </>
  )
}

function collectExpansionState(items: TreeData[] | undefined, expanded: boolean): Record<string, boolean> {
  const state: Record<string, boolean> = {}

  function visit(nodes: TreeData[] | undefined) {
    for (const node of nodes ?? []) {
      if (node.children?.length) {
        state[node.id] = expanded
        visit(node.children)
      }
    }
  }

  visit(items)
  return state
}

function findNodePath(items: TreeData[] | undefined, id: string): TreeData[] {
  for (const item of items ?? []) {
    if (item.id === id) {
      return [item]
    }

    const childPath = findNodePath(item.children, id)

    if (childPath.length > 0) {
      return [item, ...childPath]
    }
  }

  return []
}

function indexSubtreeIds(
  items: TreeData[] | undefined,
  index: Map<string, string[]>,
) {
  for (const item of items ?? []) {
    indexSubtreeIds(item.children, index)

    const subtreeIds = [item.id]

    for (const child of item.children ?? []) {
      subtreeIds.push(...(index.get(child.id) ?? [child.id]))
    }

    index.set(item.id, subtreeIds)
  }
}

export function TreeTable({
  data,
  columns,
  className,
  expandSignal,
  collapseSignal,
  selectedRowId,
  onRowSelect,
  checkedIds,
  onCheckedIdsChange,
  isSelectable = alwaysSelectable,
}: TreeTableProps) {
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({})
  const subtreeIdsByNode = useMemo(() => {
    const index = new Map<string, string[]>()

    indexSubtreeIds(data, index)
    return index
  }, [data])
  const selectableIds = useMemo(() => {
    const ids = new Set<string>()

    function visit(nodes: TreeData[] | undefined) {
      for (const node of nodes ?? []) {
        if (isSelectable(node)) {
          ids.add(node.id)
        }

        visit(node.children)
      }
    }

    visit(data)
    return ids
  }, [data, isSelectable])
  const allChecked =
    checkedIds !== undefined &&
    selectableIds.size > 0 &&
    [...selectableIds].every((id) => checkedIds.has(id))
  const someChecked = [...selectableIds].some((id) => checkedIds?.has(id))

  /**
   * Whether every descendant of a node is checked. The node itself is left out,
   * so this stays true right before the node joins the selection.
   */
  function isFullyCovered(id: string, ids: ReadonlySet<string>) {
    return (subtreeIdsByNode.get(id) ?? []).every(
      (subtreeId) => subtreeId === id || ids.has(subtreeId),
    )
  }

  useEffect(() => {
    if (expandSignal) {
      setExpandedRows(collectExpansionState(data, true))
    }
  }, [data, expandSignal])

  useEffect(() => {
    if (collapseSignal) {
      setExpandedRows(collectExpansionState(data, false))
    }
  }, [data, collapseSignal])

  function applyChecked(
    ids: Set<string>,
    subtreeIds: string[],
    checked: boolean,
  ) {
    for (const subtreeId of subtreeIds) {
      if (checked) {
        ids.add(subtreeId)
      } else {
        ids.delete(subtreeId)
      }
    }
  }

  function handleToggleChecked(id: string, checked: boolean) {
    const nextIds = new Set(checkedIds)

    applyChecked(nextIds, subtreeIdsByNode.get(id) ?? [id], checked)

    // A checked row stands for its whole subtree, so both directions keep the
    // selection closed: an ancestor joins once every descendant is checked, and
    // leaves again as soon as one of them is unchecked. Innermost first, so a
    // folder that just joined can complete its own parent.
    for (const ancestor of findNodePath(data, id).slice(0, -1).reverse()) {
      if (selectableIds.has(ancestor.id) && isFullyCovered(ancestor.id, nextIds)) {
        nextIds.add(ancestor.id)
      } else {
        nextIds.delete(ancestor.id)
      }
    }

    onCheckedIdsChange?.(nextIds)
  }

  function handleToggleAllChecked(checked: boolean) {
    const nextIds = new Set(checkedIds)

    for (const id of selectableIds) {
      applyChecked(nextIds, subtreeIdsByNode.get(id) ?? [id], checked)
    }

    onCheckedIdsChange?.(nextIds)
  }

  return (
    <div className={`overflow-auto ${className ?? ''}`}>
      <table className="w-full table-fixed divide-y divide-slate-200">
        <thead className="sticky top-0 z-10 bg-slate-50">
          <tr>
            {checkedIds && (
              <th scope="col" className="w-9 px-2.5 py-1.5 text-left">
                <TriStateCheckbox
                  ariaLabel="Select all rows"
                  checked={allChecked}
                  indeterminate={someChecked && !allChecked}
                  onChange={handleToggleAllChecked}
                />
              </th>
            )}
            {columns.map((column) => (
              <th
                key={column.key}
                scope="col"
                className="px-2.5 py-1.5 text-left text-[11px] font-bold uppercase tracking-wider text-slate-600"
                style={{ width: column.width }}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200 bg-white">
          {data?.map((item) => (
            <TreeNode
              key={item.id}
              item={item}
              columns={columns}
              level={0}
              expandedRows={expandedRows}
              setExpandedRows={setExpandedRows}
              selectedRowId={selectedRowId}
              onRowSelect={onRowSelect}
              checkedIds={checkedIds}
              selectableIds={selectableIds}
              subtreeIdsByNode={subtreeIdsByNode}
              onToggleChecked={handleToggleChecked}
            />
          ))}
        </tbody>
      </table>
    </div>
  )
}
