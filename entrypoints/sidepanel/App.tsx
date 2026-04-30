import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ErrorMessage } from '@/components/ui/error-message'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useExtensionStorage } from '@/hooks/useExtensionStorage'
import { cn, copyToClipboard } from '@/lib/utils'
import { streamWebPageSummary } from '@/lib/web-summary/ai'
import {
  DEFAULT_WEB_SUMMARY_CONFIG,
  WEB_SUMMARY_CONFIG_KEY,
  normalizeWebSummaryConfig,
  validateWebSummaryConfig,
} from '@/lib/web-summary/config'
import { renderSafeMarkdown } from '@/lib/web-summary/markdown'
import type {
  OpenWebSummaryResponse,
  WebSummaryPageContent,
  WebSummaryPendingAction,
} from '@/types/web-summary'
import { Bot, Copy, Eye, EyeOff, LoaderCircle, PanelsTopLeft, Settings2, SquareStop, X } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message
  }

  return '未知错误'
}

function isUnsupportedUrl(url?: string | null): boolean {
  if (!url) {
    return true
  }

  return /^(about:|chrome:|chrome-extension:|edge:|moz-extension:|opera:|vivaldi:)/.test(url)
}

function getRefreshHint(error: unknown): string {
  const message = getErrorMessage(error)
  if (/Receiving end does not exist|Could not establish connection/i.test(message)) {
    return '当前网页还没有注入摘要脚本，请刷新页面后重试。'
  }

  return message
}

async function getTabById(tabId?: number) {
  if (tabId) {
    try {
      return await chrome.tabs.get(tabId)
    } catch {
      // fall through to active tab lookup
    }
  }

  const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true })
  return activeTab
}

export function App() {
  const { value: storedConfig, setValue: setStoredConfig, loading: configLoading } = useExtensionStorage(
    WEB_SUMMARY_CONFIG_KEY,
    DEFAULT_WEB_SUMMARY_CONFIG,
  )
  const config = useMemo(() => normalizeWebSummaryConfig(storedConfig), [storedConfig])
  const configErrors = useMemo(() => validateWebSummaryConfig(config), [config])

  const [summaryMarkdown, setSummaryMarkdown] = useState('')
  const [isSummarizing, setIsSummarizing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [statusText, setStatusText] = useState('打开网页后点击“开始总结”，摘要会显示在当前页面旁边。')
  const [abortController, setAbortController] = useState<AbortController | null>(null)
  const [copySuccess, setCopySuccess] = useState(false)
  const [isConfigOpen, setIsConfigOpen] = useState(false)
  const [isApiKeyVisible, setIsApiKeyVisible] = useState(false)

  const summaryHtml = useMemo(() => renderSafeMarkdown(summaryMarkdown), [summaryMarkdown])
  const summarizeRef = useRef<(tabId?: number) => Promise<void>>(async () => undefined)
  const abortControllerRef = useRef<AbortController | null>(null)

  useEffect(() => {
    abortControllerRef.current = abortController
  }, [abortController])

  const updateConfigField = (field: keyof typeof config, value: string) => {
    void setStoredConfig({
      ...config,
      [field]: value,
    })
  }

  const summarizePage = async (requestedTabId?: number) => {
    if (isSummarizing) {
      return
    }

    setCopySuccess(false)
    setError(null)

    if (configErrors.length > 0) {
      setIsConfigOpen(true)
      setStatusText('点击右上角设置打开联网配置抽屉，补全配置后即可开始总结。')
      setError(configErrors[0])
      return
    }

    const targetTab = await getTabById(requestedTabId)
    if (!targetTab?.id) {
      setError('未找到当前活动网页。')
      return
    }

    if (isUnsupportedUrl(targetTab.url)) {
      setError('当前页面不是普通网页，无法提取正文内容。')
      return
    }

    setStatusText('正在提取当前网页正文…')
    setSummaryMarkdown('')
    setIsSummarizing(true)

    const controller = new AbortController()
    setAbortController(controller)

    try {
      const pageContent = await chrome.tabs.sendMessage(
        targetTab.id,
        { type: 'WEB_SUMMARY_EXTRACT_PAGE' },
      ) as WebSummaryPageContent

      setStatusText('正在生成摘要…')

      await streamWebPageSummary({
        pageContent,
        config,
        signal: controller.signal,
        onDelta: (delta) => {
          setSummaryMarkdown((previous) => previous + delta)
        },
      })

      setStatusText('摘要生成完成。')
    } catch (caughtError) {
      if (caughtError instanceof Error && caughtError.name === 'AbortError') {
        setStatusText('已停止本次总结。')
      } else {
        setStatusText('总结失败，请检查当前网页和接口配置。')
        setError(getRefreshHint(caughtError))
      }
    } finally {
      setIsSummarizing(false)
      setAbortController(null)
    }
  }

  summarizeRef.current = summarizePage

  useEffect(() => {
    let active = true

    const bootstrap = async () => {
      const currentTab = await getTabById()

      const pendingAction = await chrome.runtime.sendMessage(
        {
          type: 'WEB_SUMMARY_SIDE_PANEL_READY',
          tabId: currentTab?.id,
        },
      ) as WebSummaryPendingAction | null

      if (active && pendingAction?.type === 'SUMMARIZE_ACTIVE_PAGE') {
        await summarizeRef.current(pendingAction.tabId)
      }
    }

    void bootstrap()

    return () => {
      active = false
      abortControllerRef.current?.abort()
    }
  }, [])

  const handleLaunchFromPopup = async () => {
    const activeTab = await getTabById()
    const response = await chrome.runtime.sendMessage({
      type: 'OPEN_WEB_SUMMARY',
      tabId: activeTab?.id,
    }) as OpenWebSummaryResponse

    if (!response?.ok) {
      setError(response?.error || '无法打开网页总结侧边栏。')
      return
    }

    setStatusText('已请求重新打开侧边栏。')
  }

  const handleCopySummary = async () => {
    if (!summaryMarkdown.trim()) {
      return
    }

    await copyToClipboard(summaryMarkdown)
    setCopySuccess(true)
    setTimeout(() => setCopySuccess(false), 1500)
  }

  return (
    <div
      data-testid="web-summary-panel"
      className="h-screen overflow-hidden bg-[linear-gradient(180deg,#f8fafc_0%,#f1f5f9_100%)] text-slate-900"
      style={{ fontFamily: '"IBM Plex Sans", "SF Pro Text", "Segoe UI", sans-serif' }}
    >
      <div className="mx-auto flex h-full max-w-[1040px] flex-col p-1.5">
        <Card className="relative h-full gap-1.5 overflow-hidden rounded-lg border-slate-200/80 bg-white/92 py-2">
          <CardHeader className="gap-1 border-b border-slate-100 px-2.5 !pb-1.5">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0 flex items-center gap-2">
                <div className="flex h-5 shrink-0 items-center gap-1 rounded-md border border-emerald-200 bg-emerald-50 px-1.5 text-[9px] font-semibold uppercase tracking-[0.16em] text-emerald-700">
                  <PanelsTopLeft className="h-2.5 w-2.5" />
                  <span>Side Panel</span>
                </div>
                <CardTitle className="truncate pt-0.5 text-base">网页总结</CardTitle>
              </div>
              <div className="flex items-center gap-1.5">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  data-testid="web-summary-config-toggle"
                  aria-label="打开联网配置抽屉"
                  onClick={() => setIsConfigOpen(true)}
                  className="h-7 w-7 rounded-md border border-slate-200 bg-white/90"
                >
                  <Settings2 className="h-3.5 w-3.5" />
                </Button>
                <div className="shrink-0 rounded-md border border-emerald-200 bg-emerald-50 px-1.5 py-0.5 text-[10px] font-medium text-emerald-700">
                  可选联网 AI
                </div>
              </div>
            </div>
            <p className="text-[11px] leading-4 text-slate-500">
              边看边读：在当前网页旁边生成摘要。
            </p>
          </CardHeader>
          <CardContent className="flex min-h-0 flex-1 flex-col gap-1.5 px-2.5 pt-1.5">
            <div className="flex min-h-0 flex-1 flex-col gap-1.5">
              <div className="flex items-center gap-2 overflow-x-auto pb-1 [&::-webkit-scrollbar]:hidden">
                  <Button
                    data-testid="web-summary-summarize"
                    onClick={() => void summarizePage()}
                    disabled={configLoading || isSummarizing}
                    size="sm"
                    className="min-w-0 flex-1 whitespace-nowrap px-2.5 text-[13px]"
                  >
                    {isSummarizing ? (
                      <>
                        <LoaderCircle className="h-4 w-4 animate-spin" />
                        总结中…
                      </>
                    ) : (
                      <>
                        <Bot className="h-4 w-4" />
                        开始总结
                      </>
                    )}
                  </Button>

                  {isSummarizing && (
                    <Button
                      data-testid="web-summary-stop"
                      variant="outline"
                      size="sm"
                      className="min-w-0 flex-1 whitespace-nowrap px-2.5 text-[13px]"
                      onClick={() => abortController?.abort()}
                    >
                      <SquareStop className="h-4 w-4" />
                      停止
                    </Button>
                  )}

                  <Button
                    variant="ghost"
                    size="sm"
                    className="min-w-0 flex-1 whitespace-nowrap px-2.5 text-[13px]"
                    onClick={() => void handleLaunchFromPopup()}
                  >
                    重新打开
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    className="min-w-0 flex-1 whitespace-nowrap px-2.5 text-[13px]"
                    onClick={() => void handleCopySummary()}
                    disabled={!summaryMarkdown.trim()}
                  >
                    <Copy className="h-4 w-4" />
                    {copySuccess ? '已复制' : '复制'}
                  </Button>
              </div>

              <div className="flex min-h-0 flex-1 flex-col rounded-lg border border-slate-200 bg-white">
                <div className="shrink-0 border-b border-slate-100 px-2.5 py-1.5">
                  <div className="flex items-center gap-2">
                    <div className="shrink-0 text-sm font-semibold text-slate-900">摘要结果</div>
                    <div
                      className="min-w-0 flex-1 truncate text-right text-[11px] leading-5 text-slate-500"
                      title={statusText}
                    >
                      {statusText}
                    </div>
                  </div>
                </div>
                <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-2.5 py-2">
                  {summaryMarkdown ? (
                    <article
                      data-testid="web-summary-output"
                      className="prose prose-slate max-w-none break-words text-[13px] leading-5 [overflow-wrap:anywhere] prose-headings:mb-1.5 prose-headings:text-slate-900 prose-p:my-1.5 prose-p:text-slate-700 prose-strong:text-slate-900 prose-li:my-0.5 prose-li:text-slate-700 prose-code:text-emerald-700 prose-pre:bg-slate-950 prose-pre:text-slate-100 [&_a]:break-all [&_code]:break-words [&_li]:break-words [&_p]:break-words [&_pre]:overflow-x-hidden [&_pre]:whitespace-pre-wrap [&_pre]:break-words"
                      dangerouslySetInnerHTML={{ __html: summaryHtml }}
                    />
                  ) : (
                    <div className="flex h-full min-h-full items-center justify-center rounded-lg border border-dashed border-slate-200 bg-slate-50/70 px-3 text-center text-sm leading-5 text-slate-500">
                      点击右上角设置按钮打开联网配置抽屉，配置 endpoint / model / API Key 后，点击“开始总结”，摘要会在这里实时生成。
                    </div>
                  )}
                </div>
              </div>
            </div>

            {error && (
              <ErrorMessage
                title="网页总结暂时不可用"
                message={error}
                className="border-red-200 bg-red-50/90 text-red-700"
              />
            )}
          </CardContent>

          <div
            data-testid="web-summary-config-overlay"
            className={cn(
              'pointer-events-none absolute inset-0 z-20 bg-slate-950/10 opacity-0 transition-opacity duration-200',
              isConfigOpen && 'pointer-events-auto opacity-100',
            )}
            onClick={() => setIsConfigOpen(false)}
            aria-hidden={!isConfigOpen}
          />

          <aside
            data-testid="web-summary-config-drawer"
            aria-hidden={!isConfigOpen}
            className={cn(
              'pointer-events-none absolute inset-y-0 right-0 z-30 flex w-full max-w-[360px] translate-x-full transition-transform duration-200 ease-out',
              isConfigOpen && 'pointer-events-auto translate-x-0',
            )}
          >
            <Card className="h-full w-full rounded-none rounded-l-lg border-y-0 border-r-0 border-l border-slate-200 bg-white/98 shadow-[-12px_0_28px_rgba(15,23,42,0.12)]">
              <CardHeader className="gap-1 border-b border-slate-100 pb-2">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <CardTitle className="text-sm">联网配置</CardTitle>
                    <CardDescription className="text-[12px] leading-5">
                      仅在你点击“开始总结”时，当前网页正文才会发送到你填写的兼容 OpenAI 接口。
                    </CardDescription>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label="关闭联网配置抽屉"
                    onClick={() => setIsConfigOpen(false)}
                    className="h-7 w-7 rounded-md border border-slate-200 bg-white/90"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-2 pt-2">
                <div className="space-y-1.5">
                  <Label htmlFor="web-summary-endpoint" className="text-[13px]">接口地址</Label>
                  <Input
                    id="web-summary-endpoint"
                    data-testid="web-summary-endpoint"
                    value={config.endpoint}
                    onChange={(event) => updateConfigField('endpoint', event.target.value)}
                    placeholder="https://api.openai.com/v1/chat/completions"
                    className="h-8 rounded-md px-2.5 text-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="web-summary-model" className="text-[13px]">模型名称</Label>
                  <Input
                    id="web-summary-model"
                    data-testid="web-summary-model"
                    value={config.model}
                    onChange={(event) => updateConfigField('model', event.target.value)}
                    placeholder="gpt-4.1-mini / 自定义兼容模型"
                    className="h-8 rounded-md px-2.5 text-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="web-summary-api-key" className="text-[13px]">API Key</Label>
                  <div className="relative">
                    <Input
                      id="web-summary-api-key"
                      data-testid="web-summary-api-key"
                      type={isApiKeyVisible ? 'text' : 'password'}
                      value={config.apiKey}
                      onChange={(event) => updateConfigField('apiKey', event.target.value)}
                      placeholder="sk-..."
                      className="h-8 rounded-md px-2.5 pr-9 text-sm"
                    />
                    <button
                      type="button"
                      data-testid="web-summary-api-key-visibility"
                      aria-label={isApiKeyVisible ? '隐藏 API Key 明文' : '显示 API Key 明文'}
                      aria-pressed={isApiKeyVisible}
                      onClick={() => setIsApiKeyVisible((visible) => !visible)}
                      className="absolute inset-y-0 right-0 flex w-8 items-center justify-center rounded-r-md text-slate-500 transition-colors hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/45"
                    >
                      {isApiKeyVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div className="rounded-lg border border-slate-200 bg-slate-50/80 p-2 text-[11px] leading-5 text-slate-500">
                  配置会保存在 <code>chrome.storage.local</code> 的 <code>webSummaryConfig</code> 键下，仅保存在本机浏览器，不会自动同步到云端。
                </div>
              </CardContent>
            </Card>
          </aside>
        </Card>
      </div>
    </div>
  )
}
