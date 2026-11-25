import { useCallback, useEffect, useRef, useState } from 'react'
import { getErrorMessage } from '@/lib/utils'
import {
  answerPageConversation,
  HISTORY_CHARS,
} from '@/lib/web-summary/conversation'
import {
  extractTabContent,
  getRefreshHint,
} from '@/lib/web-summary/page-source'
import { loadConversation, saveConversation } from '@/lib/web-summary/session'
import type {
  WebSummaryConfig,
  WebSummaryConversation,
} from '@/types/web-summary'

export function useConversation() {
  const [conversation, setConversation] =
    useState<WebSummaryConversation | null>(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [status, setStatus] = useState('开始总结后，可继续围绕本页提问。')
  const [windowId, setWindowId] = useState<number | null>(null)
  const current = useRef<WebSummaryConversation | null>(null)
  const owner = useRef<number | null>(null)
  const mounted = useRef(false)
  const operation = useRef<{
    controller: AbortController
    flush: () => void
    config: WebSummaryConfig
  } | null>(null)

  const publish = useCallback((next: WebSummaryConversation | null) => {
    current.current = next
    if (mounted.current) setConversation(next)
    if (owner.current !== null) {
      void saveConversation(owner.current, next).catch((caught) => {
        if (mounted.current)
          setError(
            `对话保存失败：${getErrorMessage(caught)}。请复制需要保留的内容后重试；不会改存为长期记录。`,
          )
      })
    }
  }, [])

  const stop = useCallback(() => {
    const running = operation.current
    if (!running) return
    running.controller.abort()
    running.flush()
    operation.current = null
    const value = current.current
    publish(
      value
        ? {
            ...value,
            messages: value.messages.map((message) =>
              message.status === 'streaming'
                ? { ...message, status: 'stopped' }
                : message,
            ),
          }
        : null,
    )
    if (mounted.current) {
      setBusy(false)
      setStatus('已停止，可重试或继续追问。')
    }
  }, [publish])

  useEffect(() => {
    mounted.current = true
    let active = true
    void (async () => {
      try {
        const win = await chrome.windows.getCurrent()
        if (win.id === undefined) throw new Error('未找到当前浏览器窗口。')
        if (!active) return
        owner.current = win.id
        setWindowId(win.id)
        const restored = await loadConversation(win.id)
        if (!active) return
        current.current = restored
        setConversation(restored)
        if (restored) setStatus('已恢复对话，继续使用开始总结时的正文。')
      } catch (caught) {
        if (active) setError(getErrorMessage(caught))
      } finally {
        if (active) setLoading(false)
      }
    })()
    const onClosed = (info: chrome.sidePanel.PanelClosedInfo) => {
      if (info.windowId === owner.current) stop()
    }
    window.addEventListener('pagehide', stop)
    chrome.sidePanel.onClosed?.addListener(onClosed)
    return () => {
      active = false
      mounted.current = false
      stop()
      window.removeEventListener('pagehide', stop)
      chrome.sidePanel.onClosed?.removeListener(onClosed)
    }
  }, [stop])

  async function run(
    value: WebSummaryConversation,
    config: WebSummaryConfig,
    running: NonNullable<typeof operation.current>,
  ) {
    let answer = ''
    let timer: ReturnType<typeof setTimeout> | undefined
    const lastId = value.messages[value.messages.length - 1].id
    const flush = () => {
      clearTimeout(timer)
      timer = undefined
      if (operation.current !== running || current.current?.id !== value.id)
        return
      publish({
        ...current.current,
        messages: current.current.messages.map((message) =>
          message.id === lastId
            ? {
                ...message,
                content:
                  answer || value.messages[value.messages.length - 1].content,
              }
            : message,
        ),
      })
    }
    running.flush = flush
    try {
      const result = await answerPageConversation({
        conversation: value,
        config,
        signal: running.controller.signal,
        onDelta: (delta) => {
          if (
            operation.current !== running ||
            running.controller.signal.aborted
          )
            return
          answer += delta
          timer ??= setTimeout(flush, 100)
        },
        onStatus: (text) => {
          if (mounted.current && operation.current === running) setStatus(text)
        },
        onMemory: (memory, memoryThrough) => {
          if (operation.current === running && current.current)
            publish({ ...current.current, memory, memoryThrough })
        },
      })
      running.controller.signal.throwIfAborted()
      answer = result
      flush()
      if (operation.current === running && current.current) {
        publish({
          ...current.current,
          messages: current.current.messages.map((message) =>
            message.id === lastId
              ? { ...message, status: 'complete' }
              : message,
          ),
        })
        setStatus('回答完成，可继续追问。')
      }
    } catch (caught) {
      if (operation.current === running && current.current) {
        flush()
        const aborted = running.controller.signal.aborted
        publish({
          ...current.current,
          messages: current.current.messages.map((message) =>
            message.id === lastId
              ? { ...message, status: aborted ? 'stopped' : 'error' }
              : message,
          ),
        })
        if (mounted.current) {
          setStatus(
            aborted
              ? '已停止，可继续追问。'
              : '生成失败，已有内容已保留，可重试。',
          )
          if (!aborted) setError(getErrorMessage(caught))
        }
      }
    } finally {
      clearTimeout(timer)
      if (operation.current === running) {
        operation.current = null
        if (mounted.current) setBusy(false)
      }
    }
  }

  function begin(config: WebSummaryConfig) {
    if (operation.current || owner.current === null || !mounted.current)
      return null
    const running = {
      controller: new AbortController(),
      flush: () => {},
      config: { ...config },
    }
    operation.current = running
    setBusy(true)
    setError(null)
    return running
  }

  async function start(
    tab: chrome.tabs.Tab & { id: number },
    config: WebSummaryConfig,
  ) {
    const windowId = owner.current
    if (windowId === null) return
    const running = begin(config)
    if (!running) return
    setStatus('正在读取完整网页正文…')
    try {
      if (!tab.url || !/^https?:/.test(tab.url))
        throw new Error('当前页面不是普通网页，无法提取正文内容。')
      const page = await extractTabContent(tab.id)
      if (page.url !== tab.url)
        throw new Error('读取期间页面发生了跳转，请从目标网页重新开始。')
      running.controller.signal.throwIfAborted()
      const value: WebSummaryConversation = {
        id: crypto.randomUUID(),
        windowId,
        tabId: tab.id,
        page,
        createdAt: Date.now(),
        memory: '',
        memoryThrough: 0,
        messages: [
          {
            id: crypto.randomUUID(),
            role: 'assistant',
            content: '',
            status: 'streaming',
          },
        ],
      }
      // Save the complete snapshot before making any external requests.
      await saveConversation(value.windowId, value)
      running.controller.signal.throwIfAborted()
      publish(value)
      await run(value, running.config, running)
    } catch (caught) {
      if (operation.current === running) {
        operation.current = null
        setBusy(false)
        setError(getRefreshHint(caught))
        setStatus('无法开始总结，原对话仍保留。')
      }
    }
  }

  async function send(
    question: string,
    config: WebSummaryConfig,
    retry = false,
  ) {
    const previous = current.current
    if (
      !previous ||
      (!retry && (!question.trim() || !previous.messages[0]?.content))
    )
      return
    if (question.length > HISTORY_CHARS) {
      setError('本次问题过长，请缩短至 4,000 字符以内再发送。')
      return
    }
    const running = begin(config)
    if (!running) return
    const messages = retry
      ? previous.messages.slice(0, -1)
      : [
          ...previous.messages,
          {
            id: crypto.randomUUID(),
            role: 'user' as const,
            content: question.trim(),
            status: 'complete' as const,
          },
        ]
    const value = {
      ...previous,
      messages: [
        ...messages,
        {
          id: crypto.randomUUID(),
          role: 'assistant' as const,
          content: retry
            ? previous.messages[previous.messages.length - 1].content
            : '',
          status: 'streaming' as const,
        },
      ],
    }
    publish(value)
    await run(value, running.config, running)
  }

  function clear() {
    stop()
    publish(null)
    setError(null)
    setStatus('对话已清除，可开始新的网页总结。')
  }

  return {
    conversation,
    loading,
    busy,
    error,
    status,
    windowId,
    activeConfig: operation.current?.config,
    start,
    send,
    stop,
    clear,
    setError,
  }
}
