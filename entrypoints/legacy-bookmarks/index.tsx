import {
  TreeTable,
  type LegacyTreeData,
  type TreeTableProps,
} from '@/components/legacy-fe-tools/TreeTable'
import { useEffect, useState } from 'react'
import ReactDOM from 'react-dom/client'
import '../../index.css'

function renderDate(value: unknown) {
  if (typeof value !== 'number' && typeof value !== 'string') {
    return ''
  }

  return value ? new Date(value).toLocaleString() : ''
}

const columns: TreeTableProps['columns'] = [
  { key: 'title', header: 'Title' },
  {
    key: 'url',
    header: 'URL',
    render(value) {
      if (!value) {
        return ''
      }

      return (
        <a href={String(value)} target="_blank" rel="noreferrer" className="text-blue-600 underline">
          {String(value)}
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

function LegacyBookmarksTool() {
  const [bookmarks, setBookmarks] = useState<LegacyTreeData[]>([])
  const [error, setError] = useState('')

  useEffect(() => {
    let mounted = true

    chrome.bookmarks
      .getTree()
      .then((tree) => {
        if (mounted) {
          setBookmarks((tree[0]?.children ?? []) as unknown as LegacyTreeData[])
        }
      })
      .catch((err) => {
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Failed to load bookmarks')
        }
      })

    return () => {
      mounted = false
    }
  }, [])

  return (
    <main className="min-h-screen bg-slate-50 p-4 text-slate-900">
      <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
        {error && <div className="border-b border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
        <TreeTable data={bookmarks} columns={columns} />
      </section>
    </main>
  )
}

const root = document.getElementById('app')
if (root) {
  ReactDOM.createRoot(root).render(<LegacyBookmarksTool />)
}
