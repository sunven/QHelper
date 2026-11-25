import {
  Bot,
  Check,
  Copy,
  Eye,
  EyeOff,
  FileText,
  LoaderCircle,
  RefreshCw,
  Send,
  Settings2,
  SquareStop,
  Trash2,
  X,
} from 'lucide-react'
import {
  memo,
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { ErrorMessage } from '@/components/ui/error-message'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { usePersistedValue } from '@/hooks/usePersistedValue'
import { cn, copyToClipboard, getErrorMessage } from '@/lib/utils'
import {
  DEFAULT_WEB_SUMMARY_CONFIG,
  normalizeWebSummaryConfig,
  validateWebSummaryConfig,
  WEB_SUMMARY_CONFIG_KEY,
} from '@/lib/web-summary/config'
import { HISTORY_CHARS } from '@/lib/web-summary/conversation'
import { renderSafeMarkdown } from '@/lib/web-summary/markdown'
import { fetchWebSummaryModels } from '@/lib/web-summary/models'
import { resolveSummarizableTab } from '@/lib/web-summary/page-source'
import type {
  WebSummaryChatMessage,
  WebSummaryPendingAction,
} from '@/types/web-summary'
import { useConversation } from './useConversation'

const ChatMessage = memo(function ChatMessage({
  message,
}: {
  message: WebSummaryChatMessage
}) {
  const text = useDeferredValue(message.content)
  const html = useMemo(() => renderSafeMarkdown(text), [text])
  return (
    <section
      className={cn(
        'space-y-1 border-b border-slate-100 py-3 last:border-0',
        message.role === 'user' && 'rounded-md bg-slate-50 px-2',
      )}
      data-testid="web-summary-message"
    >
      <div className="text-xs font-medium text-slate-500">
        {message.role === 'user' ? '你' : '网页助手'}
        {message.status === 'stopped' && ' · 已停止（未完成）'}
        {message.status === 'error' && ' · 失败（未完成）'}
      </div>
      {message.role === 'user' ? (
        <p className="whitespace-pre-wrap break-words text-sm">
          {message.content}
        </p>
      ) : (
        <article
          data-testid="web-summary-output"
          className="prose prose-slate max-w-none break-words text-[13px] leading-5 [overflow-wrap:anywhere] prose-headings:mb-1.5 prose-p:my-1.5 prose-li:my-0.5 [&_pre]:whitespace-pre-wrap [&_pre]:break-words"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      )}
    </section>
  )
})

export function App() {
  const {
    value: storedConfig,
    setValue: setStoredConfig,
    loading: configLoading,
  } = usePersistedValue(WEB_SUMMARY_CONFIG_KEY, DEFAULT_WEB_SUMMARY_CONFIG)
  const config = useMemo(
    () => normalizeWebSummaryConfig(storedConfig),
    [storedConfig],
  )
  const configErrors = useMemo(() => validateWebSummaryConfig(config), [config])
  const chat = useConversation()
  const [question, setQuestion] = useState('')
  const [isConfigOpen, setIsConfigOpen] = useState(false)
  const [isApiKeyVisible, setIsApiKeyVisible] = useState(false)
  const [models, setModels] = useState<string[]>([])
  const [isModelsOpen, setIsModelsOpen] = useState(false)
  const [isFetchingModels, setIsFetchingModels] = useState(false)
  const [modelsError, setModelsError] = useState<string | null>(null)
  const [activePage, setActivePage] = useState<chrome.tabs.Tab | null>(null)
  const [replacement, setReplacement] = useState<
    (chrome.tabs.Tab & { id: number }) | null
  >(null)
  const [copySuccess, setCopySuccess] = useState(false)
  const [resolving, setResolving] = useState(false)
  const resolvingRef = useRef(false)
  const requestVersion = useRef(0)
  const startRef = useRef<(tabId?: number, force?: boolean) => Promise<void>>(
    async () => {},
  )
  const ready = !chat.loading && !configLoading && chat.windowId !== null
  const busy = chat.busy || resolving
  const readyRef = useRef(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const followOutput = useRef(true)

  const updateConfigField = (field: keyof typeof config, value: string) => {
    if (field === 'endpoint' || field === 'apiKey') {
      setModels([])
      setIsModelsOpen(false)
      setModelsError(null)
    }

    void setStoredConfig({
      ...config,
      [field]: value,
    })
  }

  const fetchModels = async () => {
    if (isFetchingModels) {
      return
    }

    setModelsError(null)
    setIsFetchingModels(true)

    try {
      const modelList = await fetchWebSummaryModels({
        endpoint: config.endpoint,
        apiKey: config.apiKey,
      })
      setModels(modelList)
      setIsModelsOpen(true)
    } catch (caughtError) {
      setModels([])
      setIsModelsOpen(false)
      setModelsError(getErrorMessage(caughtError))
    } finally {
      setIsFetchingModels(false)
    }
  }

  const selectModel = (model: string) => {
    updateConfigField('model', model)
    setIsModelsOpen(false)
  }

  function validConfig() {
    if (!configErrors.length) return true
    setIsConfigOpen(true)
    chat.setError(configErrors[0])
    return false
  }

  async function requestStart(tabId?: number, force = false) {
    const windowId = chat.windowId
    if (!ready || busy || resolvingRef.current || windowId === null) return
    resolvingRef.current = true
    const version = ++requestVersion.current
    setResolving(true)
    try {
      const tab =
        tabId === undefined
          ? await resolveSummarizableTab(undefined, {
              queryTabs: () => chrome.tabs.query({ active: true, windowId }),
            })
          : await chrome.tabs.get(tabId)
      if (version !== requestVersion.current || !readyRef.current) return
      if (!tab?.id || tab.windowId !== chat.windowId) return
      if (
        !force &&
        chat.conversation?.tabId === tab.id &&
        chat.conversation.page.url === tab.url
      )
        return
      if (!validConfig()) return
      if (chat.conversation)
        setReplacement(tab as chrome.tabs.Tab & { id: number })
      else await chat.start(tab as chrome.tabs.Tab & { id: number }, config)
    } catch (caught) {
      if (version === requestVersion.current)
        chat.setError(getErrorMessage(caught))
    } finally {
      if (version === requestVersion.current) {
        resolvingRef.current = false
        setResolving(false)
      }
    }
  }

  const stopRequest = useCallback(() => {
    requestVersion.current++
    resolvingRef.current = false
    setResolving(false)
    chat.stop()
  }, [chat.stop])

  useEffect(() => {
    const stop = (info: chrome.sidePanel.PanelClosedInfo) => {
      if (info.windowId === chat.windowId) stopRequest()
    }
    chrome.sidePanel.onClosed?.addListener(stop)
    window.addEventListener('pagehide', stopRequest)
    return () => {
      requestVersion.current++
      readyRef.current = false
      chrome.sidePanel.onClosed?.removeListener(stop)
      window.removeEventListener('pagehide', stopRequest)
    }
  }, [chat.windowId, stopRequest])

  useEffect(() => {
    startRef.current = requestStart
    readyRef.current = ready
  })

  useEffect(() => {
    const windowId = chat.windowId
    if (!ready || windowId === null) return
    let active = true
    const refreshPage = async () => {
      try {
        const tab = await resolveSummarizableTab(undefined, {
          queryTabs: () => chrome.tabs.query({ active: true, windowId }),
        })
        if (active) setActivePage(tab)
        return tab
      } catch {
        if (active) setActivePage(null)
      }
    }
    const consume = async (tabId?: number) => {
      if (!active || !readyRef.current || tabId === undefined) return
      try {
        const tab = await chrome.tabs.get(tabId)
        if (tab.windowId !== windowId) return
        const action = (await chrome.runtime.sendMessage({
          type: 'WEB_SUMMARY_SIDE_PANEL_READY',
          tabId,
        })) as WebSummaryPendingAction | null
        if (active && action?.type === 'SUMMARIZE_ACTIVE_PAGE')
          await startRef.current(action.tabId)
      } catch (caught) {
        if (active) chat.setError(getErrorMessage(caught))
      }
    }
    void refreshPage().then((tab) => consume(tab?.id))
    const onMessage = (message: { type?: string; tabId?: number } | null) => {
      if (message?.type === 'WEB_SUMMARY_OPEN_REQUESTED')
        void consume(message.tabId)
      return false
    }
    const onActivated = (info: chrome.tabs.OnActivatedInfo) => {
      if (info.windowId === windowId) void refreshPage()
    }
    const onUpdated = (
      _id: number,
      change: chrome.tabs.OnUpdatedInfo,
      tab: chrome.tabs.Tab,
    ) => {
      if (
        tab.windowId === windowId &&
        tab.active &&
        (change.url || change.title || change.status === 'complete')
      )
        void refreshPage()
    }
    chrome.runtime.onMessage.addListener(onMessage)
    chrome.tabs.onActivated.addListener(onActivated)
    chrome.tabs.onUpdated.addListener(onUpdated)
    return () => {
      active = false
      chrome.runtime.onMessage.removeListener(onMessage)
      chrome.tabs.onActivated.removeListener(onActivated)
      chrome.tabs.onUpdated.removeListener(onUpdated)
    }
  }, [ready, chat.windowId, chat.setError])

  useEffect(() => {
    if (chat.conversation && followOutput.current && scrollRef.current)
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
  }, [chat.conversation])

  useEffect(() => {
    if (!copySuccess) return
    const timer = setTimeout(() => setCopySuccess(false), 1500)
    return () => clearTimeout(timer)
  }, [copySuccess])

  function submitQuestion() {
    if (!question.trim() || busy || !validConfig()) return
    if (question.length > HISTORY_CHARS) {
      chat.setError(
        `本次问题过长，请缩短至 ${HISTORY_CHARS.toLocaleString()} 字符以内再发送。`,
      )
      return
    }
    followOutput.current = true
    void chat.send(question, config)
    setQuestion('')
  }

  const lastMessage =
    chat.conversation?.messages[chat.conversation.messages.length - 1]
  const canChat = !!chat.conversation?.messages[0]?.content
  const displayedConfig = chat.activeConfig ?? config

  return (
    <div
      data-testid="web-summary-panel"
      className="h-screen overflow-hidden bg-slate-50 text-slate-900"
    >
      <div className="mx-auto flex h-full max-w-[1040px] flex-col p-1.5">
        <Card className="relative h-full gap-1.5 overflow-hidden rounded-lg border-slate-200 bg-white py-2">
          <CardHeader className="gap-1 border-b border-slate-100 px-2.5 !pb-1.5">
            <div className="flex items-center justify-between gap-2">
              <CardTitle className="text-base">网页总结与对话</CardTitle>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                data-testid="web-summary-config-toggle"
                aria-label="打开联网配置抽屉"
                onClick={() => setIsConfigOpen(true)}
                className="h-7 w-7"
              >
                <Settings2 className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs text-slate-500">读完总结，继续问这篇文章。</p>
          </CardHeader>
          <CardContent className="flex min-h-0 flex-1 flex-col gap-2 px-2.5 pt-1.5">
            <div className="flex min-w-0 items-center gap-1.5 text-xs text-slate-500">
              <FileText className="h-3 w-3 shrink-0" />
              <span className="shrink-0">当前页面</span>
              <span className="truncate" title={activePage?.url}>
                {activePage?.title ?? '未找到可总结的网页'}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              <Button
                data-testid="web-summary-summarize"
                onClick={() => void requestStart(undefined, true)}
                disabled={!ready || busy}
                size="sm"
                className="flex-1 text-xs"
              >
                <Bot className="h-4 w-4" />
                {chat.conversation
                  ? chat.conversation.tabId === activePage?.id &&
                    chat.conversation.page.url === activePage?.url
                    ? '重新读取本页'
                    : '总结当前页'
                  : '开始总结'}
              </Button>
              {busy && (
                <Button
                  data-testid="web-summary-stop"
                  variant="outline"
                  size="sm"
                  onClick={stopRequest}
                >
                  <SquareStop className="h-4 w-4" />
                  停止
                </Button>
              )}
              {chat.conversation && (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    aria-label="复制对话"
                    onClick={() => {
                      if (!chat.conversation) return
                      void copyToClipboard(
                        chat.conversation.messages
                          .map(
                            (message) =>
                              `${message.role === 'user' ? '你' : '网页助手'}${message.status !== 'complete' ? '（未完成）' : ''}\n${message.content}`,
                          )
                          .join('\n\n'),
                      )
                        .then(() => setCopySuccess(true))
                        .catch((caught) =>
                          chat.setError(getErrorMessage(caught)),
                        )
                    }}
                  >
                    <Copy className="h-4 w-4" />
                    {copySuccess ? '已复制' : '复制'}
                  </Button>
                  <Button
                    data-testid="web-summary-clear"
                    variant="ghost"
                    size="icon"
                    aria-label="清除对话"
                    onClick={() => {
                      stopRequest()
                      chat.clear()
                      setQuestion('')
                      setReplacement(null)
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </>
              )}
            </div>
            {replacement && (
              <div
                role="alertdialog"
                aria-label="替换当前对话"
                className="space-y-2 rounded-md border border-slate-300 bg-slate-50 p-2 text-sm"
              >
                <p>
                  读取“{replacement.title || replacement.url}
                  ”并开始新对话？将替换当前正文、问答和记忆，旧对话无法恢复。
                </p>
                <div className="flex gap-2">
                  <Button
                    data-testid="web-summary-confirm-replace"
                    size="sm"
                    disabled={busy}
                    onClick={() => {
                      if (!validConfig()) return
                      const tab = replacement
                      setReplacement(null)
                      setQuestion('')
                      void chat.start(tab, config)
                    }}
                  >
                    替换并开始
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setReplacement(null)}
                  >
                    取消
                  </Button>
                </div>
              </div>
            )}
            <div className="flex min-h-0 flex-1 flex-col rounded-lg border border-slate-200">
              {chat.conversation && (
                <div className="shrink-0 border-b border-slate-100 p-2 text-xs text-slate-500">
                  <div className="flex min-w-0 gap-1">
                    <span className="shrink-0">对话来源</span>
                    <span
                      className="truncate font-medium text-slate-800"
                      title={chat.conversation.page.url}
                    >
                      {chat.conversation.page.title}
                    </span>
                  </div>
                  <div className="truncate" title={chat.conversation.page.url}>
                    {chat.conversation.page.url}
                  </div>
                  <p>
                    {new Date(chat.conversation.createdAt).toLocaleTimeString()}{' '}
                    读取 · {chat.conversation.page.charCount.toLocaleString()}{' '}
                    字符 · 固定正文快照
                  </p>
                  {chat.conversation.memory && (
                    <p>
                      早期问答已整理为记忆，完整记录仍可查看；部分细节可能需要重述。
                    </p>
                  )}
                </div>
              )}
              <div
                ref={scrollRef}
                onScroll={(event) => {
                  const el = event.currentTarget
                  followOutput.current =
                    el.scrollHeight - el.scrollTop - el.clientHeight < 80
                }}
                className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-2.5"
                aria-label="网页对话记录"
              >
                {chat.conversation ? (
                  chat.conversation.messages.map((message) => (
                    <ChatMessage key={message.id} message={message} />
                  ))
                ) : (
                  <p className="py-8 text-center text-sm text-slate-500">
                    配置接口后开始总结，随后可以围绕网页连续提问。
                  </p>
                )}
              </div>
            </div>
            <p
              role="status"
              className="flex items-center gap-1 text-xs text-slate-500"
            >
              {busy && <LoaderCircle className="h-3 w-3 animate-spin" />}
              {chat.status}
            </p>
            {chat.error && (
              <ErrorMessage
                title="网页对话暂时不可用"
                message={chat.error}
                className="max-h-32 overflow-y-auto border-red-200 bg-red-50 text-red-700"
              />
            )}
            {lastMessage &&
              (lastMessage.status === 'stopped' ||
                lastMessage.status === 'error') && (
                <Button
                  data-testid="web-summary-retry"
                  variant="outline"
                  size="sm"
                  disabled={busy || !ready}
                  onClick={() => {
                    if (validConfig()) void chat.send('', config, true)
                  }}
                >
                  <RefreshCw className="h-3 w-3" />
                  重试
                  {chat.conversation?.messages.length === 1
                    ? '总结'
                    : '当前问题'}
                </Button>
              )}
            <form
              className="shrink-0 space-y-1.5 border-t border-slate-100 pt-2"
              onSubmit={(event) => {
                event.preventDefault()
                submitQuestion()
              }}
            >
              <Label htmlFor="web-summary-question" className="sr-only">
                针对网页提问
              </Label>
              <Textarea
                id="web-summary-question"
                data-testid="web-summary-question"
                value={question}
                onChange={(event) => setQuestion(event.target.value)}
                disabled={!canChat || !ready}
                placeholder={
                  canChat ? '针对这篇文章继续提问…' : '先生成总结，再开始提问'
                }
                className="min-h-16 max-h-32 resize-y text-sm"
                onKeyDown={(event) => {
                  if (
                    event.key === 'Enter' &&
                    !event.shiftKey &&
                    !event.nativeEvent.isComposing &&
                    event.keyCode !== 229
                  ) {
                    event.preventDefault()
                    submitQuestion()
                  }
                }}
              />
              <div className="flex items-center gap-2">
                <p
                  className="min-w-0 flex-1 truncate text-[11px] text-slate-500"
                  title={`${displayedConfig.endpoint} · ${displayedConfig.model}`}
                >
                  {displayedConfig.model
                    ? `${chat.activeConfig ? '正在使用' : '下次请求'}：${displayedConfig.model} · ${displayedConfig.endpoint}`
                    : '尚未配置接口'}
                  <br />
                  仅本次浏览器使用期间保留
                </p>
                <Button
                  data-testid="web-summary-send"
                  type="submit"
                  size="sm"
                  disabled={!ready || busy || !canChat || !question.trim()}
                >
                  <Send className="h-3.5 w-3.5" />
                  发送
                </Button>
              </div>
            </form>
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
            inert={!isConfigOpen}
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
                      主动总结或发送问题时，正文及相关问答会发送到你指定的接口。长文阅读和对话记忆整理可能需要多次请求；保存配置和重开侧栏不会发送内容。
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
              <CardContent className="min-h-0 flex-1 space-y-2 overflow-y-auto pt-2">
                <div className="space-y-1.5">
                  <Label htmlFor="web-summary-endpoint" className="text-[13px]">
                    接口地址
                  </Label>
                  <Input
                    id="web-summary-endpoint"
                    data-testid="web-summary-endpoint"
                    value={config.endpoint}
                    onChange={(event) =>
                      updateConfigField('endpoint', event.target.value)
                    }
                    placeholder="https://api.openai.com/v1/chat/completions"
                    className="h-8 rounded-md px-2.5 text-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="web-summary-api-key" className="text-[13px]">
                    API Key
                  </Label>
                  <div className="relative">
                    <Input
                      id="web-summary-api-key"
                      data-testid="web-summary-api-key"
                      type={isApiKeyVisible ? 'text' : 'password'}
                      value={config.apiKey}
                      onChange={(event) =>
                        updateConfigField('apiKey', event.target.value)
                      }
                      placeholder="sk-..."
                      className="h-8 rounded-md px-2.5 pr-9 text-sm"
                    />
                    <button
                      type="button"
                      data-testid="web-summary-api-key-visibility"
                      aria-label={
                        isApiKeyVisible
                          ? '隐藏 API Key 明文'
                          : '显示 API Key 明文'
                      }
                      aria-pressed={isApiKeyVisible}
                      onClick={() => setIsApiKeyVisible((visible) => !visible)}
                      className="absolute inset-y-0 right-0 flex w-8 items-center justify-center rounded-r-md text-slate-500 transition-colors hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/45"
                    >
                      {isApiKeyVisible ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="web-summary-model" className="text-[13px]">
                    模型名称
                  </Label>
                  <div className="flex items-center gap-1.5">
                    <Input
                      id="web-summary-model"
                      data-testid="web-summary-model"
                      value={config.model}
                      onChange={(event) =>
                        updateConfigField('model', event.target.value)
                      }
                      placeholder="gpt-4.1-mini / 自定义兼容模型"
                      className="h-8 min-w-0 flex-1 rounded-md px-2.5 text-sm"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      data-testid="web-summary-fetch-models"
                      onClick={() => void fetchModels()}
                      disabled={!config.endpoint.trim() || isFetchingModels}
                      className="h-8 shrink-0 whitespace-nowrap px-2 text-[12px]"
                    >
                      {isFetchingModels ? (
                        <LoaderCircle className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <RefreshCw className="h-3.5 w-3.5" />
                      )}
                      获取模型
                    </Button>
                  </div>
                  {isModelsOpen && models.length > 0 && (
                    <div
                      role="listbox"
                      aria-label="可选模型"
                      data-testid="web-summary-model-options"
                      className="max-h-40 overflow-y-auto rounded-md border border-slate-200 bg-white py-0.5"
                    >
                      {models.map((model) => (
                        <button
                          key={model}
                          type="button"
                          role="option"
                          aria-selected={config.model === model}
                          data-testid="web-summary-model-option"
                          onClick={() => selectModel(model)}
                          className={cn(
                            'flex w-full items-center justify-between gap-2 px-2.5 py-1.5 text-left text-xs text-slate-700 transition-colors hover:bg-slate-50',
                            config.model === model &&
                              'bg-emerald-50 text-emerald-700',
                          )}
                        >
                          <span className="truncate">{model}</span>
                          {config.model === model && (
                            <Check className="h-3.5 w-3.5 shrink-0" />
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                  {modelsError && (
                    <p className="text-[11px] leading-4 text-red-600">
                      {modelsError}
                    </p>
                  )}
                </div>

                <div className="rounded-lg border border-slate-200 bg-slate-50/80 p-2 text-[11px] leading-5 text-slate-500">
                  配置会保存在 <code>chrome.storage.local</code> 的{' '}
                  <code>webSummaryConfig</code>{' '}
                  键下，仅保存在本机浏览器，不会自动同步到云端。
                </div>
              </CardContent>
            </Card>
          </aside>
        </Card>
      </div>
    </div>
  )
}
