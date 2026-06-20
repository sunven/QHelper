import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { App } from './context-hub'

vi.mock('@/components/tool/ToolPageShell', () => ({
  ToolPageShell: ({ children }: { children: React.ReactNode }) => <main>{children}</main>,
}))

describe('context-hub/App', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders an empty local-only input experience', () => {
    render(<App />)

    expect(screen.getByRole('textbox', { name: 'Context input' })).toBeVisible()
    expect(screen.getAllByText('等待输入')[0]).toBeVisible()
    expect(screen.getByText('内容仅在本地识别，默认不会保存历史。')).toBeVisible()
  })

  it('detects JSON and recommends the JSON formatter', async () => {
    render(<App />)

    fireEvent.change(screen.getByRole('textbox', { name: 'Context input' }), {
      target: { value: '{"ok":true}' },
    })

    expect(screen.getAllByText('JSON')[0]).toBeVisible()
    expect(screen.getByRole('link', { name: '打开 JSON 格式化' })).toHaveAttribute(
      'href',
      '/tools/json.html',
    )
  })

  it('detects URL input and shows URL facts', async () => {
    const user = userEvent.setup()

    render(<App />)

    await user.type(
      screen.getByRole('textbox', { name: 'Context input' }),
      'https://example.com/path?q=1',
    )

    expect(screen.getAllByText('URL')[0]).toBeVisible()
    expect(screen.getByText('Host')).toBeVisible()
    expect(screen.getByText('example.com')).toBeVisible()
    expect(screen.getByRole('link', { name: '打开 URL 解析器' })).toHaveAttribute(
      'href',
      '/tools/urlparser.html',
    )
  })

  it('detects JWT input and renders a local preview action', async () => {
    const user = userEvent.setup()

    render(<App />)

    await user.type(
      screen.getByRole('textbox', { name: 'Context input' }),
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjMiLCJuYW1lIjoiUXVpbm4ifQ.signature',
    )

    expect(screen.getAllByText('JWT')[0]).toBeVisible()
    expect(screen.getByText('查看 JWT 预览')).toBeVisible()
    expect(
      screen.getByText((content) => content.includes('"alg": "HS256"')),
    ).toBeVisible()
    expect(
      screen.getByText((content) => content.includes('"name": "Quinn"')),
    ).toBeVisible()
  })

  it('shows a neutral fallback for unknown input', async () => {
    const user = userEvent.setup()

    render(<App />)

    await user.type(
      screen.getByRole('textbox', { name: 'Context input' }),
      'hello world',
    )

    expect(screen.getAllByText('未知格式')[0]).toBeVisible()
    expect(screen.getByText('浏览工具目录')).toBeVisible()
  })

  it('clears input without writing to extension storage', async () => {
    const user = userEvent.setup()

    render(<App />)

    const input = screen.getByRole('textbox', { name: 'Context input' })
    fireEvent.change(input, {
      target: { value: '{"ok":true}' },
    })
    await user.click(screen.getByRole('button', { name: '清空输入' }))

    expect(input).toHaveValue('')
    expect(chrome.storage.local.set).not.toHaveBeenCalled()
    expect(chrome.storage.sync.set).not.toHaveBeenCalled()
  })
})
