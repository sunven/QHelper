import {
  getJsonStringSettings,
  subscribeJsonStringSettings,
  transformJsonStringToJson,
  type JsonStringSettings,
} from '@/lib/fe-tools/json-string'
import {
  clearCapturedJsonStringRequests,
  getCapturedJsonStringRequests,
  subscribeCapturedJsonStringRequests,
  type CapturedJsonStringRequest,
} from '@/lib/fe-tools/json-string-request-store'
import { useEffect, useMemo, useState } from 'react'
import ReactDOM from 'react-dom/client'
import '@fontsource-variable/jetbrains-mono'
import '../../index.css'

function parseCapturedContent(content: string) {
  const parsed = JSON.parse(content)
  return transformJsonStringToJson(parsed)
}

function JsonStringPanel() {
  const [requestData, setRequestData] = useState<CapturedJsonStringRequest[]>([])
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
  const [settings, setSettings] = useState<JsonStringSettings | null>(null)

  useEffect(() => {
    let mounted = true

    getJsonStringSettings().then((nextSettings) => {
      if (mounted) {
        setSettings(nextSettings)
      }
    })

    getCapturedJsonStringRequests().then((requests) => {
      if (mounted) {
        setRequestData(requests)
      }
    })

    const unsubscribeRequests = subscribeCapturedJsonStringRequests(
      (requests) => {
        if (mounted) {
          setRequestData(requests)
        }
      },
    )
    const unsubscribeSettings = subscribeJsonStringSettings((nextSettings) => {
      if (!mounted) {
        return
      }

      setSettings(nextSettings)
      if (!nextSettings.enabled) {
        setSelectedIndex(null)
      }
    })

    return () => {
      mounted = false
      unsubscribeRequests()
      unsubscribeSettings()
      void clearCapturedJsonStringRequests()
    }
  }, [])

  const selectedRequest = selectedIndex === null ? null : requestData[selectedIndex]
  const preview = useMemo(() => {
    if (!selectedRequest) {
      return { error: '', value: '' }
    }

    try {
      return {
        error: '',
        value: JSON.stringify(parseCapturedContent(selectedRequest.content), null, 2),
      }
    } catch (err) {
      return {
        error: err instanceof Error ? err.message : 'JSON parse error',
        value: '',
      }
    }
  }, [selectedRequest])

  if (!settings) {
    return <main className="h-screen bg-white" />
  }

  if (!settings.enabled) {
    return (
      <main className="grid h-screen place-items-center bg-white p-6 text-slate-900">
        <section className="max-w-sm text-center">
          <h1 className="font-mono text-sm font-semibold">Json String 已停用</h1>
          <p className="mt-2 text-xs leading-5 text-slate-500">
            可在 QHelper 设置中重新启用。
          </p>
        </section>
      </main>
    )
  }

  return (
    <main className="grid h-screen grid-cols-[minmax(240px,34%)_1fr] bg-white text-slate-900">
      <section className="min-h-0 overflow-auto border-r border-slate-200">
        <table className="w-full table-fixed">
          <thead className="sticky top-0 bg-slate-50">
            <tr>
              <th className="border-b border-slate-200 px-2 py-1.5 text-left text-[11px] font-semibold uppercase text-slate-500">
                url
              </th>
            </tr>
          </thead>
          <tbody>
            {requestData.map((request, index) => (
              <tr
                key={`${request.request.url}-${index}`}
                className={`cursor-pointer border-b border-slate-100 hover:bg-slate-50 ${selectedIndex === index ? 'bg-emerald-50' : ''}`}
                onClick={() => setSelectedIndex(index)}
              >
                <td className="truncate px-2 py-1.5 text-xs text-slate-700">{request.request.url}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
      <section className="min-h-0 overflow-auto p-2">
        {preview.error ? (
          <div className="rounded-md border border-red-200 bg-red-50 p-2 text-xs text-red-700">
            {preview.error}
          </div>
        ) : (
          <pre aria-label="JSON preview" className="whitespace-pre-wrap break-words font-mono text-xs leading-5">
            {preview.value}
          </pre>
        )}
      </section>
    </main>
  )
}

const root = document.getElementById('app')
if (root) {
  ReactDOM.createRoot(root).render(<JsonStringPanel />)
}
