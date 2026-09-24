import {
  Check,
  ChevronsDownUp,
  ChevronsUpDown,
  Copy,
  FolderPlus,
  Link,
  Loader2,
  Search,
  Trash2,
  X,
} from 'lucide-react'
import {
  type FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import ReactDOM from 'react-dom/client'
import {
  type TreeData,
  TreeTable,
  type TreeTableProps,
} from '@/components/fe-tools/TreeTable'
import {
  type BookmarkDeletionPlan,
  collectBookmarkIds,
  findBookmarkInTree,
  isBookmarkFolder,
  planBookmarkDeletion,
  removeBookmarksFromTree,
} from '@/lib/bookmarks/bookmark-tree'
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

type BookmarkFolderOption = {
  id: string
  label: string
}

function collectBookmarkFolderOptions(
  items: TreeData[],
  parentLabel = '',
): BookmarkFolderOption[] {
  return items.flatMap((item) => {
    if (item.url) {
      return []
    }

    const title = String(item.title || 'Untitled folder')
    const label = parentLabel ? `${parentLabel} / ${title}` : title

    return [
      { id: item.id, label },
      ...collectBookmarkFolderOptions(item.children ?? [], label),
    ]
  })
}

async function loadBookmarkTree(): Promise<TreeData[]> {
  const tree = await chrome.bookmarks.getTree()
  return (tree[0]?.children ?? []) as unknown as TreeData[]
}

function isDeletableBookmarkNode(node: TreeData) {
  return (
    typeof node.folderType !== 'string' && typeof node.unmodifiable !== 'string'
  )
}

function bookmarkDeletionLabel(node: TreeData) {
  return String(node.title || node.url || 'bookmark')
}

function BookmarkDeletionList({ nodes }: { nodes: TreeData[] }) {
  return (
    <ul className="space-y-2">
      {nodes.map((node) => {
        const folder = isBookmarkFolder(node)
        const url = typeof node.url === 'string' ? node.url : ''
        const label = bookmarkDeletionLabel(node)
        const children = node.children ?? []

        return (
          <li key={node.id}>
            <div className="break-words text-sm text-slate-900">{label}</div>
            {folder ? (
              <div className="text-xs text-slate-500">folder</div>
            ) : (
              url &&
              url !== label && (
                <div className="truncate text-xs text-slate-500">{url}</div>
              )
            )}
            {folder && children.length > 0 && (
              <div className="mt-2 border-l border-slate-200 pl-3">
                <BookmarkDeletionList nodes={children} />
              </div>
            )}
          </li>
        )
      })}
    </ul>
  )
}

function BookmarkDeletionConfirm({
  plan,
  onCancel,
  onConfirm,
}: {
  plan: BookmarkDeletionPlan
  onCancel: () => void
  onConfirm: () => void
}) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/45 p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="bookmark-deletion-title"
        className="flex max-h-[min(32rem,calc(100vh-2rem))] w-full max-w-lg flex-col rounded-lg border border-slate-200 bg-white p-4 shadow-xl"
      >
        <h2
          id="bookmark-deletion-title"
          className="text-base font-semibold text-slate-950"
        >
          Delete {plan.removals.length} selected items?
        </h2>
        <div className="mt-3 min-h-0 flex-1 overflow-y-auto rounded-md border border-slate-200 p-3">
          <BookmarkDeletionList nodes={plan.removals} />
        </div>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          This removes {plan.removedIds.size} bookmark entries in total.
        </p>
        {plan.blocked.length > 0 && (
          <p className="mt-1 text-sm leading-6 text-slate-600">
            {plan.blocked.length} permanent browser{' '}
            {plan.blocked.length === 1 ? 'folder' : 'folders'} will be kept.
          </p>
        )}
        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex h-8 cursor-pointer items-center justify-center rounded-md border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="inline-flex h-8 cursor-pointer items-center justify-center rounded-md bg-red-600 px-3 text-sm font-medium text-white hover:bg-red-700"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  )
}

function describeBookmarkDeletion(plan: BookmarkDeletionPlan) {
  const parts: string[] = []

  if (plan.removals.length === 1) {
    const node = plan.removals[0]
    const title = bookmarkDeletionLabel(node)

    parts.push(
      isBookmarkFolder(node)
        ? `Delete bookmark folder "${title}" and all of its contents?`
        : `Delete bookmark "${title}"?`,
    )
  } else {
    parts.push(`Delete ${plan.removals.length} selected items?`)

    if (plan.folderCount > 0) {
      parts.push(
        `${plan.folderCount} ${plan.folderCount === 1 ? 'folder' : 'folders'} will be removed with their contents.`,
      )
    }

    parts.push(`This removes ${plan.removedIds.size} bookmark entries in total.`)
  }

  if (plan.blocked.length > 0) {
    parts.push(
      `${plan.blocked.length} permanent browser ${
        plan.blocked.length === 1 ? 'folder' : 'folders'
      } will be kept.`,
    )
  }

  return parts.join(' ')
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
  const detail = getBookmarkLinkStatusDetail(result, status)

  return (
    <span
      className={`inline-flex max-w-full items-center rounded-full border px-2 py-0.5 text-[11px] font-medium ${statusClassName[status]}`}
      title={detail}
    >
      <span className="truncate">{detail}</span>
    </span>
  )
}

function getBookmarkLinkStatusDetail(
  result: BookmarkLinkCheckResult | undefined,
  status: BookmarkLinkCheckStatus,
) {
  const label = statusLabel[status]

  if (!result) {
    return label
  }

  if (result.statusCode) {
    return `${label} ${result.statusCode}`
  }

  if (result.reason) {
    return `${label}: ${result.reason}`
  }

  return label
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
  disabled,
  item,
  onDelete,
}: {
  deleting: boolean
  disabled: boolean
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
      disabled={disabled}
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
  pendingDeleteIds: ReadonlySet<string>,
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
            deleting={pendingDeleteIds.has(data.id)}
            disabled={pendingDeleteIds.size > 0}
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
  const [folderTitle, setFolderTitle] = useState('')
  const [folderParentId, setFolderParentId] = useState('')
  const [showCreateFolder, setShowCreateFolder] = useState(false)
  const [creatingFolder, setCreatingFolder] = useState(false)
  const [selectedBookmarkId, setSelectedBookmarkId] = useState<string | null>(
    null,
  )
  const [expandSignal, setExpandSignal] = useState(0)
  const [collapseSignal, setCollapseSignal] = useState(0)
  const [error, setError] = useState('')
  const [linkCheck, setLinkCheck] = useState<BookmarkLinkCheckState>(
    initialLinkCheckState,
  )
  const [pendingDeleteIds, setPendingDeleteIds] = useState<ReadonlySet<string>>(
    new Set(),
  )
  const [pendingDeletionPlan, setPendingDeletionPlan] =
    useState<BookmarkDeletionPlan | null>(null)
  const [selectedBookmarkIds, setSelectedBookmarkIds] = useState<
    ReadonlySet<string>
  >(new Set())
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
  const folderOptions = useMemo(
    () => collectBookmarkFolderOptions(bookmarks),
    [bookmarks],
  )
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
  const selectedBookmark = selectedBookmarkId
    ? findBookmarkInTree(bookmarks, selectedBookmarkId)
    : undefined
  const defaultFolderParentId = folderOptions[0]?.id || ''
  const selectedDefaultFolderParentId = selectedBookmark
    ? String(selectedBookmark.url ? selectedBookmark.parentId || defaultFolderParentId : selectedBookmark.id)
    : defaultFolderParentId
  const selectedFolderParentId = folderParentId || selectedDefaultFolderParentId

  const handleCreateFolder = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault()

      const title = folderTitle.trim()
      const parentId = selectedFolderParentId

      if (!title) {
        setError('Folder name is required')
        return
      }

      if (!parentId) {
        setError('No bookmark folder is available for creating folders')
        return
      }

      setCreatingFolder(true)
      setError('')

      try {
        await chrome.bookmarks.create({ parentId, title })
        setBookmarks(await loadBookmarkTree())
        setFolderTitle('')
        setFolderParentId('')
        setSearchQuery('')
        setShowCreateFolder(false)
        setExpandSignal((value) => value + 1)
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : 'Failed to create bookmark folder',
        )
      } finally {
        setCreatingFolder(false)
      }
    },
    [folderTitle, selectedFolderParentId],
  )

  const executeBookmarkDeletion = useCallback(
    async (plan: BookmarkDeletionPlan) => {
      if (pendingDeleteIds.size > 0 || plan.removals.length === 0) {
        return
      }

      setPendingDeletionPlan(null)
      setPendingDeleteIds(new Set(plan.removals.map((node) => node.id)))
      setError('')

      const removedNodes: TreeData[] = []
      const failures: string[] = []

      await Promise.all(
        plan.removals.map(async (node) => {
          try {
            if (isBookmarkFolder(node)) {
              await chrome.bookmarks.removeTree(node.id)
            } else {
              await chrome.bookmarks.remove(node.id)
            }

            removedNodes.push(node)
          } catch (err) {
            failures.push(
              err instanceof Error
                ? err.message
                : `Failed to delete bookmark ${node.id}`,
            )
          }
        }),
      )

      linkCheckRunId.current += 1

      const removedIds = new Set(collectBookmarkIds(removedNodes))

      setBookmarks((current) => removeBookmarksFromTree(current, removedIds))
      setSelectedBookmarkId((current) =>
        current && removedIds.has(current) ? null : current,
      )
      setSelectedBookmarkIds(
        (current) => new Set([...current].filter((id) => !removedIds.has(id))),
      )
      setLinkCheck((current) => {
        const results = Object.fromEntries(
          Object.entries(current.results).filter(([id]) => !removedIds.has(id)),
        )
        const total = Object.keys(results).length

        return {
          completed: Math.min(current.completed, total),
          isChecking: false,
          results,
          total,
        }
      })

      if (failures.length > 0) {
        setError(failures.join(' '))

        try {
          setBookmarks(await loadBookmarkTree())
        } catch {
          // Keep the locally pruned tree when the reload fails.
        }
      }

      setPendingDeleteIds(new Set())
    },
    [pendingDeleteIds],
  )

  const handleDeleteBookmark = useCallback(
    async (item: TreeData) => {
      if (pendingDeleteIds.size > 0) {
        return
      }

      const plan = planBookmarkDeletion(
        bookmarks,
        new Set([item.id]),
        isDeletableBookmarkNode,
      )

      if (plan.removals.length === 0) {
        setError('None of the selected bookmarks can be deleted')
        return
      }

      if (!window.confirm(describeBookmarkDeletion(plan))) {
        return
      }

      await executeBookmarkDeletion(plan)
    },
    [bookmarks, executeBookmarkDeletion, pendingDeleteIds],
  )

  const handleDeleteSelectedBookmarks = useCallback(() => {
    if (
      selectedBookmarkIds.size === 0 ||
      pendingDeleteIds.size > 0 ||
      pendingDeletionPlan
    ) {
      return
    }

    const plan = planBookmarkDeletion(
      bookmarks,
      selectedBookmarkIds,
      isDeletableBookmarkNode,
    )

    if (plan.removals.length === 0) {
      setError('None of the selected bookmarks can be deleted')
      return
    }

    setError('')
    setPendingDeletionPlan(plan)
  }, [bookmarks, pendingDeleteIds, pendingDeletionPlan, selectedBookmarkIds])

  const handleSelectedBookmarkIdsChange = useCallback(
    (ids: Set<string>) => {
      if (pendingDeleteIds.size > 0) {
        return
      }

      setSelectedBookmarkIds(ids)
    },
    [pendingDeleteIds],
  )

  const columns = useMemo(
    () =>
      buildColumns(
        searchQuery,
        linkCheck,
        pendingDeleteIds,
        handleDeleteBookmark,
      ),
    [handleDeleteBookmark, linkCheck, pendingDeleteIds, searchQuery],
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

    loadBookmarkTree()
      .then((tree) => {
        if (mounted) {
          setBookmarks(tree)
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
              aria-label="Create bookmark folder"
              title="Create folder"
              onClick={() => setShowCreateFolder((value) => !value)}
              disabled={folderOptions.length === 0}
              className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-md border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900 disabled:pointer-events-none disabled:opacity-60"
            >
              <FolderPlus className="h-4 w-4" />
            </button>
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
            <button
              type="button"
              aria-label={`Delete ${selectedBookmarkIds.size} selected bookmarks`}
              title="Delete selected"
              onClick={() => void handleDeleteSelectedBookmarks()}
              disabled={
                selectedBookmarkIds.size === 0 ||
                pendingDeleteIds.size > 0 ||
                pendingDeletionPlan !== null
              }
              className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-md border border-slate-200 text-slate-600 hover:bg-red-50 hover:text-red-600 disabled:pointer-events-none disabled:opacity-60"
            >
              {pendingDeleteIds.size > 0 ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
            </button>
            <div
              className="min-w-28 whitespace-nowrap text-right text-xs text-slate-500"
              aria-live="polite"
            >
              {selectedBookmarkIds.size > 0 &&
                `${selectedBookmarkIds.size} selected · `}
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
        {showCreateFolder && (
          <form
            className="flex flex-col gap-2 border-b border-slate-200 bg-slate-50 p-2 md:flex-row md:items-end"
            onSubmit={(event) => void handleCreateFolder(event)}
          >
            <label className="flex min-w-0 flex-1 flex-col gap-1 text-xs font-medium text-slate-600">
              Folder name
              <input
                type="text"
                value={folderTitle}
                onChange={(event) => setFolderTitle(event.target.value)}
                className="h-8 rounded-md border border-slate-300 bg-white px-2 text-sm font-normal text-slate-900 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                autoFocus
              />
            </label>
            <label className="flex min-w-0 flex-1 flex-col gap-1 text-xs font-medium text-slate-600">
              Parent folder
              <select
                value={selectedFolderParentId}
                onChange={(event) => setFolderParentId(event.target.value)}
                className="h-8 rounded-md border border-slate-300 bg-white px-2 text-sm font-normal text-slate-900 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
              >
                {folderOptions.map((folder) => (
                  <option key={folder.id} value={folder.id}>
                    {folder.label}
                  </option>
                ))}
              </select>
            </label>
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={creatingFolder}
                className="inline-flex h-8 items-center justify-center rounded-md bg-slate-900 px-3 text-sm font-medium text-white hover:bg-slate-700 disabled:pointer-events-none disabled:opacity-60"
              >
                {creatingFolder ? 'Saving...' : 'Save folder'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowCreateFolder(false)
                  setFolderTitle('')
                  setFolderParentId('')
                }}
                className="inline-flex h-8 items-center justify-center rounded-md border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
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
            selectedRowId={selectedBookmarkId}
            onRowSelect={(item) => {
              setSelectedBookmarkId(item.id)
              setFolderParentId('')
            }}
            checkedIds={selectedBookmarkIds}
            onCheckedIdsChange={handleSelectedBookmarkIdsChange}
            isSelectable={isDeletableBookmarkNode}
          />
        )}
      </section>
      {pendingDeletionPlan && (
        <BookmarkDeletionConfirm
          plan={pendingDeletionPlan}
          onCancel={() => setPendingDeletionPlan(null)}
          onConfirm={() => {
            void executeBookmarkDeletion(pendingDeletionPlan)
          }}
        />
      )}
    </main>
  )
}

const root = document.getElementById('app')
if (root) {
  ReactDOM.createRoot(root).render(<BookmarksTool />)
}
