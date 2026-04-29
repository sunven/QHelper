import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { App } from './App'

const { useExtensionStorage, streamWebPageSummary } = vi.hoisted(() => ({
  useExtensionStorage: vi.fn(),
  streamWebPageSummary: vi.fn(),
}))

vi.mock('@/hooks/useExtensionStorage', () => ({
  useExtensionStorage,
}))

vi.mock('@/lib/web-summary/ai', () => ({
  streamWebPageSummary,
}))

describe('sidepanel/App', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useExtensionStorage.mockReturnValue({
      value: {
        endpoint: 'https://example.com/v1/chat/completions',
        model: 'gpt-4.1-mini',
        apiKey: 'secret',
      },
      setValue: vi.fn(() => Promise.resolve()),
      loading: false,
    })

    ;(chrome.tabs.query as any).mockResolvedValue([
      {
        id: 1,
        title: 'Article page',
        url: 'https://example.com/article',
      },
    ] as chrome.tabs.Tab[])
    ;(chrome.tabs.get as any).mockResolvedValue({
      id: 1,
      title: 'Article page',
      url: 'https://example.com/article',
    } as chrome.tabs.Tab)
    ;(chrome.tabs.sendMessage as any).mockResolvedValue({
      title: 'Article page',
      url: 'https://example.com/article',
      content: 'content',
      source: 'article',
      truncated: false,
      charCount: 7,
    })
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
})
