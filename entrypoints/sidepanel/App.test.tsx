import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { saveConversation } from '@/lib/web-summary/session'
import { App } from './App'

const {
  usePersistedValue,
  answerPageConversation,
  fetchWebSummaryModels,
  resolveSummarizableTab,
  extractTabContent,
} = vi.hoisted(() => ({
  usePersistedValue: vi.fn(),
  answerPageConversation: vi.fn(),
  fetchWebSummaryModels: vi.fn(),
  resolveSummarizableTab: vi.fn(),
  extractTabContent: vi.fn(),
}))

vi.mock('@/hooks/usePersistedValue', () => ({
  usePersistedValue,
}))

vi.mock('@/lib/web-summary/conversation', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/web-summary/conversation')>()),
  answerPageConversation,
}))

vi.mock('@/lib/web-summary/models', () => ({
  fetchWebSummaryModels,
}))

// 提取 seam：mock 掉 tab 解析与注入，保留纯函数 getRefreshHint 的真实现
vi.mock('@/lib/web-summary/page-source', async (importOriginal) => {
  const actual =
    await importOriginal<typeof import('@/lib/web-summary/page-source')>()
  return {
    ...actual,
    resolveSummarizableTab,
    extractTabContent,
  }
})

const ARTICLE_TAB = {
  id: 1,
  windowId: 1,
  title: 'Article page',
  url: 'https://example.com/article',
} as chrome.tabs.Tab

const PAGE_CONTENT = {
  title: 'Article page',
  url: 'https://example.com/article',
  content: 'content',
  source: 'article',
  truncated: false,
  charCount: 7,
}

describe('sidepanel/App', () => {
  afterEach(async () => {
    cleanup()
    // Unmount may queue a final save; finish it before replacing storage mocks.
    await saveConversation(1, null)
  })

  beforeEach(() => {
    vi.clearAllMocks()
    answerPageConversation.mockReset().mockResolvedValue('done')
    vi.mocked(chrome.tabs.get).mockImplementation(async (id) => ({
      ...ARTICLE_TAB,
      id,
    }))
    const stored: Record<string, unknown> = {}
    vi.mocked(chrome.storage.session.get).mockImplementation(async (key) => ({
      [String(key)]: stored[String(key)],
    }))
    vi.mocked(chrome.storage.session.set).mockImplementation(async (items) => {
      Object.assign(stored, structuredClone(items))
    })
    vi.mocked(chrome.storage.session.remove).mockImplementation(async (key) => {
      delete stored[String(key)]
    })
    usePersistedValue.mockReturnValue({
      value: {
        endpoint: 'https://example.com/v1/chat/completions',
        model: 'gpt-4.1-mini',
        apiKey: 'secret',
      },
      setValue: vi.fn(() => Promise.resolve()),
      loading: false,
    })
    resolveSummarizableTab.mockReset().mockResolvedValue(ARTICLE_TAB)
    extractTabContent.mockReset().mockResolvedValue(PAGE_CONTENT)
    vi.mocked(chrome.runtime.sendMessage).mockImplementation(async () => null)
  })

  it('renders the sidepanel controls', async () => {
    render(<App />)

    expect(await screen.findByTestId('web-summary-panel')).toBeVisible()
    expect(screen.getByTestId('web-summary-config-toggle')).toBeVisible()
    expect(screen.getByTestId('web-summary-config-drawer')).toHaveAttribute(
      'aria-hidden',
      'true',
    )

    fireEvent.click(screen.getByTestId('web-summary-config-toggle'))

    expect(screen.getByTestId('web-summary-config-drawer')).toHaveAttribute(
      'aria-hidden',
      'false',
    )
    expect(screen.getByTestId('web-summary-endpoint')).toBeVisible()
    expect(screen.getByTestId('web-summary-model')).toBeVisible()
    expect(screen.getByTestId('web-summary-api-key')).toBeVisible()
  })

  it('labels the current page and the summarized page', async () => {
    answerPageConversation.mockResolvedValue('done')

    render(<App />)

    expect(await screen.findByText('当前页面')).toBeVisible()
    expect(await screen.findByText('Article page')).toBeVisible()

    await waitFor(() =>
      expect(screen.getByTestId('web-summary-summarize')).toBeEnabled(),
    )
    fireEvent.click(screen.getByTestId('web-summary-summarize'))

    await waitFor(() => {
      expect(screen.getByText('对话来源')).toBeVisible()
    })
    expect(screen.getAllByText('Article page')).toHaveLength(2)
  })

  it('runs a pending action when the panel is already mounted', async () => {
    answerPageConversation.mockResolvedValue('done')

    render(<App />)

    expect(await screen.findByText('Article page')).toBeVisible()

    vi.mocked(chrome.runtime.sendMessage).mockImplementation(
      async (message: unknown) => {
        const typed = message as { type?: string; tabId?: number }
        if (
          typed?.type === 'WEB_SUMMARY_SIDE_PANEL_READY' &&
          typed.tabId === 7
        ) {
          return { type: 'SUMMARIZE_ACTIVE_PAGE', tabId: 7 }
        }
        return null
      },
    )

    const listenerCalls = vi.mocked(chrome.runtime.onMessage.addListener).mock
      .calls
    const listener = listenerCalls[listenerCalls.length - 1]?.[0] as
      | ((message: unknown) => boolean)
      | undefined

    act(() => {
      expect(listener?.({ type: 'WEB_SUMMARY_OPEN_REQUESTED', tabId: 7 })).toBe(
        false,
      )
    })

    await waitFor(() => {
      expect(answerPageConversation).toHaveBeenCalledTimes(1)
    })
    expect(chrome.runtime.sendMessage).toHaveBeenCalledWith({
      type: 'WEB_SUMMARY_SIDE_PANEL_READY',
      tabId: 7,
    })
  })

  it('ignores a second summarize request while the first is resolving the tab', async () => {
    answerPageConversation.mockResolvedValue('done')

    render(<App />)

    expect(await screen.findByText('Article page')).toBeVisible()

    let resolveTab: (tab: chrome.tabs.Tab) => void = () => undefined
    resolveSummarizableTab.mockReturnValueOnce(
      new Promise<chrome.tabs.Tab>((resolve) => {
        resolveTab = resolve
      }),
    )

    await waitFor(() =>
      expect(screen.getByTestId('web-summary-summarize')).toBeEnabled(),
    )
    const button = screen.getByTestId('web-summary-summarize')
    fireEvent.click(button)
    fireEvent.click(button)
    resolveTab(ARTICLE_TAB)

    await waitFor(() => {
      expect(answerPageConversation).toHaveBeenCalledTimes(1)
    })
  })

  it('updates the current page label when switching tabs', async () => {
    render(<App />)

    expect(await screen.findByText('Article page')).toBeVisible()

    const listener = vi.mocked(chrome.tabs.onActivated.addListener).mock
      .calls[0]?.[0]
    resolveSummarizableTab.mockResolvedValueOnce({
      id: 2,
      windowId: 1,
      title: 'Another page',
      url: 'https://example.com/another',
    } as chrome.tabs.Tab)

    listener?.({ tabId: 2, windowId: 1 })

    expect(await screen.findByText('Another page')).toBeVisible()
  })

  it('toggles api key visibility in the config drawer', async () => {
    render(<App />)

    fireEvent.click(await screen.findByTestId('web-summary-config-toggle'))

    const apiKeyInput = screen.getByTestId('web-summary-api-key')
    const visibilityToggle = screen.getByTestId(
      'web-summary-api-key-visibility',
    )

    expect(apiKeyInput).toHaveAttribute('type', 'password')

    fireEvent.click(visibilityToggle)
    expect(apiKeyInput).toHaveAttribute('type', 'text')

    fireEvent.click(visibilityToggle)
    expect(apiKeyInput).toHaveAttribute('type', 'password')
  })

  it('fetches model options and applies the selected model', async () => {
    const setValue = vi.fn(() => Promise.resolve())
    usePersistedValue.mockReturnValue({
      value: {
        endpoint: 'https://example.com/v1/chat/completions',
        model: '',
        apiKey: 'secret',
      },
      setValue,
      loading: false,
    })
    fetchWebSummaryModels.mockResolvedValue(['gpt-4.1', 'gpt-4.1-mini'])

    render(<App />)

    fireEvent.click(await screen.findByTestId('web-summary-config-toggle'))
    fireEvent.click(screen.getByTestId('web-summary-fetch-models'))

    expect(await screen.findByText('gpt-4.1')).toBeVisible()
    expect(fetchWebSummaryModels).toHaveBeenCalledWith({
      endpoint: 'https://example.com/v1/chat/completions',
      apiKey: 'secret',
    })

    fireEvent.click(screen.getByText('gpt-4.1'))

    await waitFor(() => {
      expect(setValue).toHaveBeenCalledWith(
        expect.objectContaining({ model: 'gpt-4.1' }),
      )
    })
    expect(
      screen.queryByTestId('web-summary-model-options'),
    ).not.toBeInTheDocument()
  })

  it('shows an inline error when fetching models fails', async () => {
    fetchWebSummaryModels.mockRejectedValue(
      new Error('模型列表接口返回 401：unauthorized'),
    )

    render(<App />)

    fireEvent.click(await screen.findByTestId('web-summary-config-toggle'))
    fireEvent.click(screen.getByTestId('web-summary-fetch-models'))

    expect(
      await screen.findByText('模型列表接口返回 401：unauthorized'),
    ).toBeVisible()
    expect(
      screen.queryByTestId('web-summary-model-options'),
    ).not.toBeInTheDocument()
  })

  it('clears the loading state after aborting an in-flight summary', async () => {
    answerPageConversation.mockImplementation(({ signal, onDelta }) => {
      onDelta?.('# 正在生成')
      return new Promise((_, reject) => {
        signal?.addEventListener('abort', () => {
          reject(new DOMException('Aborted', 'AbortError'))
        })
      })
    })

    render(<App />)

    await waitFor(() =>
      expect(screen.getByTestId('web-summary-summarize')).toBeEnabled(),
    )
    fireEvent.click(screen.getByTestId('web-summary-summarize'))

    const stopButton = await screen.findByTestId('web-summary-stop')
    fireEvent.click(stopButton)

    await waitFor(() => {
      expect(screen.queryByTestId('web-summary-stop')).not.toBeInTheDocument()
    })
  })

  it('renders markdown-style model output as formatted HTML', async () => {
    answerPageConversation.mockImplementation(({ onDelta }) => {
      onDelta?.('```markdown\n# 总结\n\n- 第一条\n```')
      return Promise.resolve('```markdown\n# 总结\n\n- 第一条\n```')
    })

    render(<App />)

    await waitFor(() =>
      expect(screen.getByTestId('web-summary-summarize')).toBeEnabled(),
    )
    fireEvent.click(screen.getByTestId('web-summary-summarize'))

    expect(await screen.findByRole('heading', { name: '总结' })).toBeVisible()
    expect(screen.getByText('第一条')).toBeVisible()
    expect(screen.queryByText('```markdown')).not.toBeInTheDocument()
  })

  it('summarizes the content extracted from the resolved tab', async () => {
    answerPageConversation.mockResolvedValue('done')

    render(<App />)

    await waitFor(() =>
      expect(screen.getByTestId('web-summary-summarize')).toBeEnabled(),
    )
    fireEvent.click(screen.getByTestId('web-summary-summarize'))

    await waitFor(() => {
      expect(extractTabContent).toHaveBeenCalledWith(1)
    })
    expect(answerPageConversation).toHaveBeenCalledWith(
      expect.objectContaining({
        conversation: expect.objectContaining({
          page: expect.objectContaining({
            title: 'Article page',
            content: 'content',
          }),
        }),
      }),
    )
  })

  it('shows a recoverable error when on-demand extraction fails', async () => {
    extractTabContent.mockRejectedValueOnce(
      new Error('Cannot access contents of url'),
    )

    render(<App />)

    await waitFor(() =>
      expect(screen.getByTestId('web-summary-summarize')).toBeEnabled(),
    )
    fireEvent.click(screen.getByTestId('web-summary-summarize'))

    expect(
      await screen.findByText(
        '无法访问当前网页内容，请确认这是普通网页，并从当前页面重新发起总结。',
      ),
    ).toBeVisible()
    expect(answerPageConversation).not.toHaveBeenCalled()
  })

  it('does not summarize unsupported browser pages', async () => {
    // bootstrap 与点击都会尝试解析，持续抛错（bootstrap 吞掉自己的那次）
    resolveSummarizableTab.mockRejectedValue(
      new Error('当前页面不是普通网页，无法提取正文内容。'),
    )

    render(<App />)

    await waitFor(() =>
      expect(screen.getByTestId('web-summary-summarize')).toBeEnabled(),
    )
    fireEvent.click(screen.getByTestId('web-summary-summarize'))

    expect(
      await screen.findByText('当前页面不是普通网页，无法提取正文内容。'),
    ).toBeVisible()
    expect(extractTabContent).not.toHaveBeenCalled()
  })
  async function startSummary() {
    await waitFor(() =>
      expect(screen.getByTestId('web-summary-summarize')).toBeEnabled(),
    )
    fireEvent.click(screen.getByTestId('web-summary-summarize'))
    await screen.findByText('回答完成，可继续追问。')
  }

  it('carries earlier turns and the original page when the active tab changes', async () => {
    render(<App />)
    await startSummary()
    resolveSummarizableTab.mockResolvedValue({
      ...ARTICLE_TAB,
      id: 8,
      title: 'Page B',
      url: 'https://example.com/b',
    })
    const activated = vi.mocked(chrome.tabs.onActivated.addListener).mock
      .calls[0][0]
    act(() => {
      activated({ tabId: 8, windowId: 1 })
    })
    await screen.findByText('Page B')
    fireEvent.change(screen.getByTestId('web-summary-question'), {
      target: { value: '展开第二点' },
    })
    fireEvent.click(screen.getByTestId('web-summary-send'))
    await waitFor(() => expect(answerPageConversation).toHaveBeenCalledTimes(2))
    await waitFor(() =>
      expect(screen.getByTestId('web-summary-summarize')).toBeEnabled(),
    )
    fireEvent.change(screen.getByTestId('web-summary-question'), {
      target: { value: '作者给了哪些证据' },
    })
    fireEvent.click(screen.getByTestId('web-summary-send'))
    await waitFor(() => expect(answerPageConversation).toHaveBeenCalledTimes(3))
    const value = answerPageConversation.mock.calls[2][0].conversation
    expect(value.page).toEqual(PAGE_CONTENT)
    expect(
      value.messages.map((message: { content: string }) => message.content),
    ).toEqual(['done', '展开第二点', 'done', '作者给了哪些证据', ''])
    expect(extractTabContent).toHaveBeenCalledTimes(1)
  })

  it('restores after remount without rereading or sending another request', async () => {
    const view = render(<App />)
    await startSummary()
    view.unmount()
    render(<App />)
    await screen.findByText('已恢复对话，继续使用开始总结时的正文。')
    expect(screen.getByText('done')).toBeVisible()
    expect(answerPageConversation).toHaveBeenCalledTimes(1)
    expect(extractTabContent).toHaveBeenCalledTimes(1)
  })

  it('waits for configuration to load before consuming a pending start', async () => {
    const configured = usePersistedValue.getMockImplementation()?.()
    usePersistedValue.mockReturnValue({ ...configured, loading: true })
    vi.mocked(chrome.runtime.sendMessage).mockImplementationOnce(async () => ({
      type: 'SUMMARIZE_ACTIVE_PAGE',
      tabId: 1,
    }))
    const view = render(<App />)
    await screen.findByTestId('web-summary-panel')
    expect(chrome.runtime.sendMessage).not.toHaveBeenCalled()
    usePersistedValue.mockReturnValue({ ...configured, loading: false })
    view.rerender(<App />)
    await waitFor(() => expect(answerPageConversation).toHaveBeenCalledTimes(1))
  })

  it('requires confirmation to replace a snapshot and preserves it on cancel', async () => {
    render(<App />)
    await startSummary()
    fireEvent.click(screen.getByTestId('web-summary-summarize'))
    await screen.findByRole('alertdialog')
    expect(extractTabContent).toHaveBeenCalledTimes(1)
    fireEvent.click(screen.getByRole('button', { name: '取消' }))
    expect(screen.getByText('done')).toBeVisible()
    fireEvent.click(screen.getByTestId('web-summary-summarize'))
    fireEvent.click(await screen.findByTestId('web-summary-confirm-replace'))
    await waitFor(() => expect(extractTabContent).toHaveBeenCalledTimes(2))
  })

  it('does not let late stream callbacks restore a cleared conversation', async () => {
    let delta: (text: string) => void = () => {}
    let finish: (text: string) => void = () => {}
    answerPageConversation.mockImplementationOnce(({ onDelta }) => {
      delta = onDelta
      onDelta('半段回答')
      return new Promise<string>((resolve) => {
        finish = resolve
      })
    })
    render(<App />)
    await waitFor(() =>
      expect(screen.getByTestId('web-summary-summarize')).toBeEnabled(),
    )
    fireEvent.click(screen.getByTestId('web-summary-summarize'))
    await screen.findByText('半段回答')
    fireEvent.click(screen.getByTestId('web-summary-clear'))
    await act(async () => {
      delta('迟到的内容')
      finish('迟到的完整回答')
    })
    expect(screen.queryByTestId('web-summary-message')).not.toBeInTheDocument()
    expect(screen.getByTestId('web-summary-question')).toBeDisabled()
    const { loadConversation } = await import('@/lib/web-summary/session')
    expect(await loadConversation(1)).toBeNull()
  })

  it('stops on a real panel-close event and preserves partial text for reopening', async () => {
    let signal: AbortSignal | undefined
    answerPageConversation.mockImplementationOnce(
      ({ signal: currentSignal, onDelta }) => {
        signal = currentSignal
        onDelta('未完成的总结')
        return new Promise((_, reject) =>
          currentSignal.addEventListener('abort', () =>
            reject(new DOMException('Aborted', 'AbortError')),
          ),
        )
      },
    )
    const view = render(<App />)
    await waitFor(() =>
      expect(screen.getByTestId('web-summary-summarize')).toBeEnabled(),
    )
    fireEvent.click(screen.getByTestId('web-summary-summarize'))
    await screen.findByText('未完成的总结')
    act(() => {
      for (const [listener] of vi.mocked(chrome.sidePanel.onClosed.addListener)
        .mock.calls)
        listener({ windowId: 1, path: 'sidepanel.html' })
    })
    expect(signal?.aborted).toBe(true)
    await screen.findByText('网页助手 · 已停止（未完成）')
    expect(screen.getByTestId('web-summary-question')).toBeEnabled()
    view.unmount()
    render(<App />)
    await screen.findByText('未完成的总结')
    expect(answerPageConversation).toHaveBeenCalledTimes(1)
  })

  it('does not consume an entry request for another browser window', async () => {
    render(<App />)
    await screen.findByText('Article page')
    vi.mocked(chrome.runtime.sendMessage).mockClear()
    vi.mocked(chrome.tabs.get).mockImplementationOnce(async () => ({
      ...ARTICLE_TAB,
      id: 9,
      windowId: 2,
    }))
    const listeners = vi.mocked(chrome.runtime.onMessage.addListener).mock.calls
    await act(async () => {
      listeners[listeners.length - 1][0](
        { type: 'WEB_SUMMARY_OPEN_REQUESTED', tabId: 9 },
        {},
        () => {},
      )
    })
    expect(chrome.runtime.sendMessage).not.toHaveBeenCalled()
    expect(answerPageConversation).not.toHaveBeenCalled()
  })

  it('marks a failed answer as incomplete and replaces it when retrying', async () => {
    answerPageConversation.mockImplementationOnce(async ({ onDelta }) => {
      onDelta('半段')
      throw new Error('connection lost')
    })
    render(<App />)
    await waitFor(() =>
      expect(screen.getByTestId('web-summary-summarize')).toBeEnabled(),
    )
    fireEvent.click(screen.getByTestId('web-summary-summarize'))
    await screen.findByText('网页助手 · 失败（未完成）')
    expect(screen.getByTestId('web-summary-question')).toBeEnabled()
    fireEvent.click(screen.getByTestId('web-summary-retry'))
    await screen.findByText('done')
    expect(screen.getAllByTestId('web-summary-message')).toHaveLength(1)
    expect(screen.queryByText('半段')).not.toBeInTheDocument()
    expect(extractTabContent).toHaveBeenCalledTimes(1)
  })
  it('uses new configuration only for the next manually sent message', async () => {
    let finish: (text: string) => void = () => {}
    answerPageConversation.mockImplementationOnce(({ onDelta }) => {
      onDelta('正在生成的总结')
      return new Promise<string>((resolve) => {
        finish = resolve
      })
    })
    const view = render(<App />)
    await waitFor(() =>
      expect(screen.getByTestId('web-summary-summarize')).toBeEnabled(),
    )
    fireEvent.click(screen.getByTestId('web-summary-summarize'))
    await screen.findByText('正在生成的总结')
    const firstConfig = answerPageConversation.mock.calls[0][0].config
    usePersistedValue.mockReturnValue({
      value: {
        ...firstConfig,
        endpoint: 'https://other.example/chat',
        model: 'other-model',
      },
      loading: false,
      setValue: vi.fn(),
    })
    view.rerender(<App />)
    expect(answerPageConversation).toHaveBeenCalledTimes(1)
    expect(screen.getByText(/正在使用：gpt-4.1-mini/)).toBeVisible()
    await act(async () => {
      finish('done')
    })
    expect(screen.getByText(/下次请求：other-model/)).toBeVisible()
    expect(screen.getByText('done')).toBeVisible()
    fireEvent.change(screen.getByTestId('web-summary-question'), {
      target: { value: '继续' },
    })
    fireEvent.click(screen.getByTestId('web-summary-send'))
    await waitFor(() => expect(answerPageConversation).toHaveBeenCalledTimes(2))
    expect(answerPageConversation.mock.calls[1][0].config.model).toBe(
      'other-model',
    )
    expect(firstConfig.model).toBe('gpt-4.1-mini')
  })

  it('preserves a partial answer if retrying fails before producing any text', async () => {
    answerPageConversation.mockImplementationOnce(async ({ onDelta }) => {
      onDelta('需要保留的半段')
      throw new Error('offline')
    })
    const view = render(<App />)
    await waitFor(() =>
      expect(screen.getByTestId('web-summary-summarize')).toBeEnabled(),
    )
    fireEvent.click(screen.getByTestId('web-summary-summarize'))
    await screen.findByText('需要保留的半段')
    answerPageConversation.mockRejectedValueOnce(new Error('still offline'))
    fireEvent.click(screen.getByTestId('web-summary-retry'))
    await screen.findByText('still offline')
    expect(screen.getByText('需要保留的半段')).toBeVisible()
    expect(screen.getAllByTestId('web-summary-message')).toHaveLength(1)
    view.unmount()
  })

  it('retains an oversized question for editing without sending it', async () => {
    render(<App />)
    await startSummary()
    const question = '问'.repeat(4001)
    fireEvent.change(screen.getByTestId('web-summary-question'), {
      target: { value: question },
    })
    fireEvent.click(screen.getByTestId('web-summary-send'))
    await screen.findByText('本次问题过长，请缩短至 4,000 字符以内再发送。')
    expect(screen.getByTestId('web-summary-question')).toHaveValue(question)
    expect(answerPageConversation).toHaveBeenCalledTimes(1)
  })

  it('removes an initial snapshot if stopped while its save is pending', async () => {
    const save = vi.mocked(chrome.storage.session.set).getMockImplementation()
    let finishSave: () => void = () => {}
    vi.mocked(chrome.storage.session.set).mockImplementationOnce(
      async (items) => {
        await new Promise<void>((resolve) => {
          finishSave = resolve
        })
        await save?.(items, () => {})
      },
    )
    render(<App />)
    await waitFor(() =>
      expect(screen.getByTestId('web-summary-summarize')).toBeEnabled(),
    )
    fireEvent.click(screen.getByTestId('web-summary-summarize'))
    await waitFor(() => expect(chrome.storage.session.set).toHaveBeenCalled())
    fireEvent.click(screen.getByTestId('web-summary-stop'))
    await act(async () => {
      finishSave()
    })
    const { loadConversation } = await import('@/lib/web-summary/session')
    expect(await loadConversation(1)).toBeNull()
    expect(answerPageConversation).not.toHaveBeenCalled()
  })
})
