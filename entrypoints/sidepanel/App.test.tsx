import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { App } from './App'

const { usePersistedValue, streamWebPageSummary, resolveSummarizableTab, extractTabContent } =
  vi.hoisted(() => ({
    usePersistedValue: vi.fn(),
    streamWebPageSummary: vi.fn(),
    resolveSummarizableTab: vi.fn(),
    extractTabContent: vi.fn(),
  }))

vi.mock('@/hooks/usePersistedValue', () => ({
  usePersistedValue,
}))

vi.mock('@/lib/web-summary/ai', () => ({
  streamWebPageSummary,
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
  beforeEach(() => {
    vi.clearAllMocks()
    usePersistedValue.mockReturnValue({
      value: {
        endpoint: 'https://example.com/v1/chat/completions',
        model: 'gpt-4.1-mini',
        apiKey: 'secret',
      },
      setValue: vi.fn(() => Promise.resolve()),
      loading: false,
    })
    resolveSummarizableTab.mockResolvedValue(ARTICLE_TAB)
    extractTabContent.mockResolvedValue(PAGE_CONTENT)
    ;(chrome.runtime.sendMessage as any).mockResolvedValue(null)
  })

  it('renders the sidepanel controls', async () => {
    render(<App />)

    expect(await screen.findByTestId('web-summary-panel')).toBeVisible()
    expect(screen.getByTestId('web-summary-config-toggle')).toBeVisible()
    expect(screen.getByTestId('web-summary-config-drawer')).toHaveAttribute('aria-hidden', 'true')

    fireEvent.click(screen.getByTestId('web-summary-config-toggle'))

    expect(screen.getByTestId('web-summary-config-drawer')).toHaveAttribute('aria-hidden', 'false')
    expect(screen.getByTestId('web-summary-endpoint')).toBeVisible()
    expect(screen.getByTestId('web-summary-model')).toBeVisible()
    expect(screen.getByTestId('web-summary-api-key')).toBeVisible()
  })

  it('toggles api key visibility in the config drawer', async () => {
    render(<App />)

    fireEvent.click(await screen.findByTestId('web-summary-config-toggle'))

    const apiKeyInput = screen.getByTestId('web-summary-api-key')
    const visibilityToggle = screen.getByTestId('web-summary-api-key-visibility')

    expect(apiKeyInput).toHaveAttribute('type', 'password')

    fireEvent.click(visibilityToggle)
    expect(apiKeyInput).toHaveAttribute('type', 'text')

    fireEvent.click(visibilityToggle)
    expect(apiKeyInput).toHaveAttribute('type', 'password')
  })

  it('clears the loading state after aborting an in-flight summary', async () => {
    streamWebPageSummary.mockImplementation(({ signal, onDelta }) => {
      onDelta?.('# 正在生成')
      return new Promise((_, reject) => {
        signal?.addEventListener('abort', () => {
          reject(new DOMException('Aborted', 'AbortError'))
        })
      })
    })

    render(<App />)

    fireEvent.click(await screen.findByTestId('web-summary-summarize'))

    const stopButton = await screen.findByTestId('web-summary-stop')
    fireEvent.click(stopButton)

    await waitFor(() => {
      expect(screen.queryByTestId('web-summary-stop')).not.toBeInTheDocument()
    })
  })

  it('renders markdown-style model output as formatted HTML', async () => {
    streamWebPageSummary.mockImplementation(({ onDelta }) => {
      onDelta?.('```markdown\n# 总结\n\n- 第一条\n```')
      return Promise.resolve('```markdown\n# 总结\n\n- 第一条\n```')
    })

    render(<App />)

    fireEvent.click(await screen.findByTestId('web-summary-summarize'))

    expect(await screen.findByRole('heading', { name: '总结' })).toBeVisible()
    expect(screen.getByText('第一条')).toBeVisible()
    expect(screen.queryByText('```markdown')).not.toBeInTheDocument()
  })

  it('summarizes the content extracted from the resolved tab', async () => {
    streamWebPageSummary.mockResolvedValue('done')

    render(<App />)

    fireEvent.click(await screen.findByTestId('web-summary-summarize'))

    await waitFor(() => {
      expect(extractTabContent).toHaveBeenCalledWith(1)
    })
    expect(streamWebPageSummary).toHaveBeenCalledWith(
      expect.objectContaining({
        pageContent: expect.objectContaining({
          title: 'Article page',
          content: 'content',
        }),
      }),
    )
  })

  it('shows a recoverable error when on-demand extraction fails', async () => {
    extractTabContent.mockRejectedValueOnce(new Error('Cannot access contents of url'))

    render(<App />)

    fireEvent.click(await screen.findByTestId('web-summary-summarize'))

    expect(
      await screen.findByText('无法访问当前网页内容，请确认这是普通网页，并从当前页面重新发起总结。'),
    ).toBeVisible()
    expect(streamWebPageSummary).not.toHaveBeenCalled()
  })

  it('does not summarize unsupported browser pages', async () => {
    // bootstrap 与点击都会尝试解析，持续抛错（bootstrap 吞掉自己的那次）
    resolveSummarizableTab.mockRejectedValue(
      new Error('当前页面不是普通网页，无法提取正文内容。'),
    )

    render(<App />)

    fireEvent.click(await screen.findByTestId('web-summary-summarize'))

    expect(await screen.findByText('当前页面不是普通网页，无法提取正文内容。')).toBeVisible()
    expect(extractTabContent).not.toHaveBeenCalled()
  })
})
