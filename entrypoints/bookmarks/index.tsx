import {
  TreeTable,
  type TreeData,
  type TreeTableProps,
} from '@/components/fe-tools/TreeTable'
import { ChevronsDownUp, ChevronsUpDown, Search, X } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import ReactDOM from 'react-dom/client'
import '../../index.css'

function normalizeSearchQuery(value: string) {
  return value.trim().toLowerCase()
}

function bookmarkMatchesSearch(item: TreeData, query: string) {
  const title = typeof item.title === 'string' ? item.title.toLowerCase() : ''
  const url = typeof item.url === 'string' ? item.url.toLowerCase() : ''

  return title.includes(query) || url.includes(query)
}

function filterBookmarkTree(items: TreeData[], query: string): TreeData[] {
  const normalizedQuery = normalizeSearchQuery(query)

  if (!normalizedQuery) {
    return items
  }

  return items.flatMap((item) => {
    const filteredChildren = item.children
      ? filterBookmarkTree(item.children, normalizedQuery)
      : []
    const isMatch = bookmarkMatchesSearch(item, normalizedQuery)

    if (!isMatch && filteredChildren.length === 0) {
      return []
    }

    return [{ ...item, children: filteredChildren }]
  })
}

function countTreeNodes(items: TreeData[]): number {
  return items.reduce(
    (total, item) => total + 1 + countTreeNodes(item.children ?? []),
    0,
  )
}

function renderHighlightedText(value: string, query: string) {
  const normalizedQuery = normalizeSearchQuery(query)

  if (!normalizedQuery) {
    return value
  }

  const normalizedValue = value.toLowerCase()
  const parts = []
  let searchFrom = 0
  let matchIndex = normalizedValue.indexOf(normalizedQuery, searchFrom)

  while (matchIndex !== -1) {
    if (matchIndex > searchFrom) {
      parts.push(value.slice(searchFrom, matchIndex))
    }

    const matchEnd = matchIndex + normalizedQuery.length
    parts.push(
      <mark
        key={`${matchIndex}-${matchEnd}`}
        className="rounded bg-amber-200 px-0.5 text-slate-950"
      >
        {value.slice(matchIndex, matchEnd)}
      </mark>,
    )
    searchFrom = matchEnd
    matchIndex = normalizedValue.indexOf(normalizedQuery, searchFrom)
  }

  if (searchFrom < value.length) {
    parts.push(value.slice(searchFrom))
  }

  return parts
}

function renderDate(value: unknown) {
  if (typeof value !== 'number' && typeof value !== 'string') {
    return ''
  }

  return value ? new Date(value).toLocaleString() : ''
}

function buildColumns(searchQuery: string): TreeTableProps['columns'] {
  return [
    {
      key: 'title',
      header: 'Title',
      render(value) {
        return renderHighlightedText(String(value ?? ''), searchQuery)
      },
    },
    {
      key: 'url',
      header: 'URL',
      render(value) {
        if (!value) {
          return ''
        }

        const url = String(value)

        return (
          <a
            href={url}
            target="_blank"
            rel="noreferrer"
            className="text-blue-600 underline"
          >
            {renderHighlightedText(url, searchQuery)}
          </a>
        )
      },
    },
    {
      key: 'dateAdded',
      header: 'Date Added',
      width: '180px',
      render: renderDate,
    },
    {
      key: 'dateLastUsed',
      header: 'Date Last Used',
      width: '180px',
      render: renderDate,
    },
    {
      key: 'dateGroupModified',
      header: 'Date Group Modified',
      width: '200px',
      render: renderDate,
    },
  ]
}

function BookmarksTool() {
  const [bookmarks, setBookmarks] = useState<TreeData[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [expandSignal, setExpandSignal] = useState(0)
  const [collapseSignal, setCollapseSignal] = useState(0)
  const [error, setError] = useState('')
  const normalizedSearchQuery = normalizeSearchQuery(searchQuery)
  const filteredBookmarks = useMemo(
    () => filterBookmarkTree(bookmarks, searchQuery),
    [bookmarks, searchQuery],
  )
  const filteredNodeCount = useMemo(
    () => countTreeNodes(filteredBookmarks),
    [filteredBookmarks],
  )
  const totalNodeCount = useMemo(() => countTreeNodes(bookmarks), [bookmarks])
  const columns = useMemo(() => buildColumns(searchQuery), [searchQuery])
  const hasSearch = normalizedSearchQuery.length > 0

  useEffect(() => {
    let mounted = true

    chrome.bookmarks
      .getTree()
      .then((tree) => {
        if (mounted) {
          setBookmarks((tree[0]?.children ?? []) as unknown as TreeData[])
        }
      })
      .catch((err) => {
        if (mounted) {
          setError(
            err instanceof Error ? err.message : 'Failed to load bookmarks',
          )
        }
      })

    return () => {
      mounted = false
    }
  }, [])

  return (
    <main className="h-screen overflow-hidden bg-slate-50 p-2 text-slate-900">
      <section className="flex h-full min-h-0 flex-col rounded-lg bg-white">
        {error && (
          <div className="border-b border-red-200 bg-red-50 p-2 text-xs text-red-700">
            {error}
          </div>
        )}
        <div className="flex flex-col gap-2 border-b border-slate-200 p-2 md:flex-row md:items-center md:justify-between">
          <label className="relative block min-w-0 flex-1 sm:max-w-md">
            <span className="sr-only">Search bookmarks</span>
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search bookmarks"
              className="h-9 w-full rounded-md border border-slate-300 bg-white pl-8 pr-9 text-sm text-slate-900 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
            />
            {searchQuery && (
              <button
                type="button"
                aria-label="Clear bookmark search"
                onClick={() => setSearchQuery('')}
                className="absolute right-1.5 top-1/2 flex h-6 w-6 -translate-y-1/2 cursor-pointer items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-900"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </label>
          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              aria-label="Expand all bookmarks"
              title="Expand all"
              onClick={() => setExpandSignal((value) => value + 1)}
              className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-md border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900"
            >
              <ChevronsUpDown className="h-4 w-4" />
            </button>
            <button
              type="button"
              aria-label="Collapse all bookmarks"
              title="Collapse all"
              onClick={() => setCollapseSignal((value) => value + 1)}
              className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-md border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900"
            >
              <ChevronsDownUp className="h-4 w-4" />
            </button>
            <div
              className="min-w-16 text-right text-xs text-slate-500"
              aria-live="polite"
            >
              {hasSearch
                ? `${filteredNodeCount} shown`
                : `${totalNodeCount} items`}
            </div>
          </div>
        </div>
        {hasSearch && filteredBookmarks.length === 0 ? (
          <div className="flex min-h-0 flex-1 items-center justify-center px-4 text-sm text-slate-500">
            No bookmarks match "{normalizedSearchQuery}".
          </div>
        ) : (
          <TreeTable
            data={filteredBookmarks}
            columns={columns}
            className="min-h-0 flex-1"
            expandSignal={expandSignal}
            collapseSignal={collapseSignal}
          />
        )}
      </section>
    </main>
  )
}

const root = document.getElementById('app')
if (root) {
  ReactDOM.createRoot(root).render(<BookmarksTool />)
}
