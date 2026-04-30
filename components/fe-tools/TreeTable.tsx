import { ChevronDown, ChevronRight } from 'lucide-react'
import { useState, type ReactNode } from 'react'

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
}: {
  item: TreeData
  columns: TreeColumn[]
  level: number
}) {
  const [isExpanded, setIsExpanded] = useState(true)
  const hasChildren = Boolean(item.children?.length)

  return (
    <>
      <tr className="border-b border-slate-200 hover:bg-slate-50">
        {columns.map((column, index) => (
          <td key={column.key} className="px-4 py-3 text-sm text-slate-600">
            <div className="flex min-w-0 items-center">
              {index === 0 && (
                <>
                  <div className="shrink-0" style={{ width: `${level * 30}px` }} />
                  {hasChildren && (
                    <button
                      type="button"
                      aria-label={isExpanded ? 'Collapse row' : 'Expand row'}
                      onClick={() => setIsExpanded((value) => !value)}
                      className="mr-2 flex h-6 w-6 cursor-pointer items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                    >
                      {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
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
          <TreeNode key={child.id} item={child} columns={columns} level={level + 1} />
        ))}
    </>
  )
}

export function TreeTable({ data, columns }: TreeTableProps) {
  return (
    <div className="overflow-auto">
      <table className="w-full table-fixed divide-y divide-slate-200">
        <thead className="bg-slate-50">
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                scope="col"
                className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-600"
                style={{ width: column.width }}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200 bg-white">
          {data?.map((item) => (
            <TreeNode key={item.id} item={item} columns={columns} level={0} />
          ))}
        </tbody>
      </table>
    </div>
  )
}
