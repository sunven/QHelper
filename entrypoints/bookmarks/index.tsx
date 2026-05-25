import {
  Check,
  ChevronsDownUp,
  ChevronsUpDown,
  Copy,
  Link,
  Loader2,
  Search,
  Trash2,
  X,
} from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import ReactDOM from 'react-dom/client'
import {
  type TreeData,
  TreeTable,
  type TreeTableProps,
} from '@/components/fe-tools/TreeTable'
import {
  type BookmarkLinkCheckResult,
  type BookmarkLinkCheckStatus,
  checkBookmarkUrls,
  collectBookmarkUrlTargets,
} from '@/lib/bookmarks/dead-link-checker'
import '@fontsource-variable/jetbrains-mono'
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

function removeBookmarkFromTree(items: TreeData[], id: string): TreeData[] {
  return items.flatMap((item) => {
    if (item.id === id) {
      return []
    }

    if (!item.children) {
      return [item]
    }

    return [{ ...item, children: removeBookmarkFromTree(item.children, id) }]
  })
}

function findBookmarkInTree(
  items: TreeData[],
  id: string,
): TreeData | undefined {
  for (const item of items) {
    if (item.id === id) {
      return item
    }

    const childMatch = findBookmarkInTree(item.children ?? [], id)

    if (childMatch) {
      return childMatch
    }
  }

  return undefined
}

function removeBookmarkLinkResults(
  results: Record<string, BookmarkLinkCheckResult>,
  item: TreeData,
): Record<string, BookmarkLinkCheckResult> {
  const nextResults = { ...results }

  function visit(node: TreeData) {
    delete nextResults[node.id]

    for (const child of node.children ?? []) {
      visit(child)
    }
  }

  visit(item)
  return nextResults
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

type BookmarkLinkCheckState = {
  completed: number
  isChecking: boolean
  results: Record<string, BookmarkLinkCheckResult>
  total: number
}

const initialLinkCheckState: BookmarkLinkCheckState = {
  completed: 0,
  isChecking: false,
  results: {},
  total: 0,
}

const statusLabel: Record<BookmarkLinkCheckStatus, string> = {
  blocked: 'Blocked',
  broken: 'Broken',
  error: 'Error',
  ok: 'OK',
  pending: 'Checking',
  skipped: 'Skipped',
  unchecked: 'Unchecked',
}

const statusClassName: Record<BookmarkLinkCheckStatus, string> = {
  blocked: 'border-amber-200 bg-amber-50 text-amber-700',
  broken: 'border-red-200 bg-red-50 text-red-700',
  error: 'border-red-200 bg-red-50 text-red-700',
  ok: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  pending: 'border-blue-200 bg-blue-50 text-blue-700',
  skipped: 'border-slate-200 bg-slate-50 text-slate-500',
  unchecked: 'border-slate-200 bg-slate-50 text-slate-500',
}

function getBookmarkLinkStatusSummary(
  results: Record<string, BookmarkLinkCheckResult>,
) {
  const summary: Record<BookmarkLinkCheckStatus, number> = {
    blocked: 0,
    broken: 0,
    error: 0,
    ok: 0,
    pending: 0,
    skipped: 0,
    unchecked: 0,
  }

  for (const result of Object.values(results)) {
    summary[result.status] += 1
  }

  return summary
}

function BookmarkLinkStatusCell({
  result,
  status,
}: {
  result: BookmarkLinkCheckResult | undefined
  status: BookmarkLinkCheckStatus
}) {
  const detail = result
    ? result.statusCode
      ? `${statusLabel[status]} ${result.statusCode}`
      : result.reason
        ? `${statusLabel[status]}: ${result.reason}`
        : statusLabel[status]
    : statusLabel[status]

  return (
    <span
      className={`inline-flex max-w-full items-center rounded-full border px-2 py-0.5 text-[11px] font-medium ${statusClassName[status]}`}
      title={detail}
    >
      <span className="truncate">{detail}</span>
    </span>
  )
}

function BookmarkCopyButton({
  copiedLabel,
  copyLabel,
  text,
  title,
}: {
  copiedLabel: string
  copyLabel: string
  text: string
  title: string
}) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1500)
    } catch (error) {
      console.error(`Failed to copy bookmark ${title}:`, error)
    }
  }

  return (
    <button
      type="button"
      aria-label={copied ? copiedLabel : copyLabel}
      title={copied ? `Copied ${title}` : `Copy ${title}`}
      onClick={() => void handleCopy()}
      className="flex h-6 w-6 shrink-0 cursor-pointer items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-900 disabled:pointer-events-none disabled:opacity-70"
      disabled={copied}
    >
      {copied ? (
        <Check className="h-3.5 w-3.5 text-emerald-600" />
      ) : (
        <Copy className="h-3.5 w-3.5" />
      )}
    </button>
  )
}

function BookmarkTitleCell({
  searchQuery,
  title,
}: {
  searchQuery: string
  title: string
}) {
  if (!title) {
    return ''
  }

  return (
    <div className="flex min-w-0 items-center gap-1.5">
      <span className="min-w-0 truncate">
        {renderHighlightedText(title, searchQuery)}
      </span>
      <BookmarkCopyButton
        copiedLabel="Bookmark title copied"
        copyLabel={`Copy bookmark title ${title}`}
        text={title}
        title="title"
      />
    </div>
  )
}

function BookmarkUrlCell({
  searchQuery,
  url,
}: {
  searchQuery: string
  url: string
}) {
  return (
    <div className="flex min-w-0 items-center gap-1.5">
      <a
        href={url}
        target="_blank"
        rel="noreferrer"
        className="min-w-0 truncate text-blue-600 underline"
      >
        {renderHighlightedText(url, searchQuery)}
      </a>
      <BookmarkCopyButton
        copiedLabel="Bookmark URL copied"
        copyLabel={`Copy bookmark URL ${url}`}
        text={url}
        title="URL"
      />
    </div>
  )
}

function BookmarkActionsCell({
  deleting,
  item,
  onDelete,
}: {
  deleting: boolean
  item: TreeData
  onDelete: (item: TreeData) => void
}) {
  const title = String(item.title || item.url || 'bookmark')

  return (
    <button
      type="button"
      aria-label={`Delete bookmark ${title}`}
      title={`Delete ${title}`}
      onClick={() => onDelete(item)}
      disabled={deleting}
      className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-md text-slate-500 hover:bg-red-50 hover:text-red-600 disabled:pointer-events-none disabled:opacity-60"
    >
      {deleting ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : (
        <Trash2 className="h-3.5 w-3.5" />
      )}
    </button>
  )
}

function buildColumns(
  searchQuery: string,
  linkCheck: BookmarkLinkCheckState,
  deletingBookmarkId: string | null,
  onDeleteBookmark: (item: TreeData) => void,
): TreeTableProps['columns'] {
  return [
    {
      key: 'title',
      header: 'Title',
      render(value) {
        return (
          <BookmarkTitleCell
            searchQuery={searchQuery}
            title={String(value ?? '')}
          />
        )
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

        return <BookmarkUrlCell searchQuery={searchQuery} url={url} />
      },
    },
    {
      key: 'linkStatus',
      header: 'Status',
      width: '130px',
      render(_value, data) {
        if (!data.url) {
          return ''
        }

        const result = linkCheck.results[data.id]
        const status =
          result?.status ?? (linkCheck.isChecking ? 'pending' : 'unchecked')

        return <BookmarkLinkStatusCell result={result} status={status} />
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
    {
      key: 'actions',
      header: 'Actions',
      width: '88px',
      render(_value, data) {
        return (
          <BookmarkActionsCell
            deleting={deletingBookmarkId === data.id}
            item={data}
            onDelete={onDeleteBookmark}
          />
        )
      },
    },
  ]
}

function BookmarksTool() {
  const [bookmarks, setBookmarks] = useState<TreeData[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [expandSignal, setExpandSignal] = useState(0)
  const [collapseSignal, setCollapseSignal] = useState(0)
  const [error, setError] = useState('')
  const [linkCheck, setLinkCheck] = useState<BookmarkLinkCheckState>(
    initialLinkCheckState,
  )
  const [deletingBookmarkId, setDeletingBookmarkId] = useState<string | null>(
    null,
  )
  const linkCheckRunId = useRef(0)
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
  const linkTargets = useMemo(
    () => collectBookmarkUrlTargets(filteredBookmarks),
    [filteredBookmarks],
  )
  const linkStatusSummary = useMemo(
    () => getBookmarkLinkStatusSummary(linkCheck.results),
    [linkCheck.results],
  )
  const problemCount =
    linkStatusSummary.blocked +
    linkStatusSummary.broken +
    linkStatusSummary.error
  const hasSearch = normalizedSearchQuery.length > 0

  const handleDeleteBookmark = useCallback(
    async (item: TreeData) => {
      const fullItem = findBookmarkInTree(bookmarks, item.id) ?? item
      const title = String(fullItem.title || fullItem.url || 'bookmark')
      const isFolder = Boolean(fullItem.children)
      const confirmed = window.confirm(
        isFolder
          ? `Delete bookmark folder "${title}" and all of its contents?`
          : `Delete bookmark "${title}"?`,
      )

      if (!confirmed) {
        return
      }

      setDeletingBookmarkId(fullItem.id)
      setError('')

      try {
        if (isFolder) {
          await chrome.bookmarks.removeTree(fullItem.id)
        } else {
          await chrome.bookmarks.remove(fullItem.id)
        }

        linkCheckRunId.current += 1
        setBookmarks((current) => removeBookmarkFromTree(current, fullItem.id))
        setLinkCheck((current) => ({
          ...current,
          isChecking: false,
          results: removeBookmarkLinkResults(current.results, fullItem),
        }))
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Failed to delete bookmark',
        )
      } finally {
        setDeletingBookmarkId((current) =>
          current === fullItem.id ? null : current,
        )
      }
    },
    [bookmarks],
  )

  const columns = useMemo(
    () =>
      buildColumns(
        searchQuery,
        linkCheck,
        deletingBookmarkId,
        handleDeleteBookmark,
      ),
    [deletingBookmarkId, handleDeleteBookmark, linkCheck, searchQuery],
  )

  const handleCheckDeadLinks = useCallback(async () => {
    const currentRunId = linkCheckRunId.current + 1
    linkCheckRunId.current = currentRunId

    const pendingResults = Object.fromEntries(
      linkTargets.map((target) => [
        target.id,
        {
          checkedAt: Date.now(),
          id: target.id,
          status: 'pending' as const,
          url: target.url,
        },
      ]),
    )

    setLinkCheck({
      completed: 0,
      isChecking: linkTargets.length > 0,
      results: pendingResults,
      total: linkTargets.length,
    })

    if (linkTargets.length === 0) {
      return
    }

    await checkBookmarkUrls(linkTargets, {
      onProgress(result) {
        if (linkCheckRunId.current !== currentRunId) {
          return
        }

        setLinkCheck((current) => ({
          ...current,
          completed: current.completed + 1,
          results: {
            ...current.results,
            [result.id]: result,
          },
        }))
      },
    })

    if (linkCheckRunId.current === currentRunId) {
      setLinkCheck((current) => ({
        ...current,
        isChecking: false,
      }))
    }
  }, [linkTargets])

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
              className="h-9 w-full rounded-md border border-slate-300 bg-white pl-8 pr-9 text-sm text-slate-900 outline-none transition [&::-webkit-search-cancel-button]:appearance-none [&::-webkit-search-decoration]:appearance-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
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
              aria-label="Check dead links"
              title="Check dead links"
              onClick={() => void handleCheckDeadLinks()}
              disabled={linkCheck.isChecking}
              className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-md border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900 disabled:pointer-events-none disabled:opacity-60"
            >
              {linkCheck.isChecking ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Link className="h-4 w-4" />
              )}
            </button>
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
              className="min-w-28 text-right text-xs text-slate-500"
              aria-live="polite"
            >
              {linkCheck.isChecking
                ? `${linkCheck.completed}/${linkCheck.total} checked`
                : linkCheck.total > 0
                  ? problemCount > 0
                    ? `${problemCount} issues`
                    : `${linkCheck.total} checked`
                  : hasSearch
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
