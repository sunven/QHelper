import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ConvertTool } from './convert'

const { addHistory, clearHistory } = vi.hoisted(() => ({
  addHistory: vi.fn(),
  clearHistory: vi.fn(),
}))

vi.mock('@/hooks/useToolHistory', () => ({
  useToolHistory: () => ({
    history: [],
    addHistory,
    clearHistory,
  }),
}))

vi.mock('@/components/tool/ToolPageShell', () => ({
  ToolPageShell: ({ children }: { children: React.ReactNode }) => (
    <main>{children}</main>
  ),
}))

describe('convert/ConvertTool', () => {
  beforeEach(() => {
    addHistory.mockClear()
    clearHistory.mockClear()
  })

  it('records the current conversion output in history', async () => {
    const user = userEvent.setup()

    render(<ConvertTool />)

    await user.type(
      screen.getByPlaceholderText('粘贴需要进行编解码的字符串'),
      'hello',
    )
    await user.click(screen.getByRole('button', { name: 'Base64编码' }))

    await waitFor(() => {
      expect(screen.getByPlaceholderText('结果将显示在这里')).toHaveValue(
        'aGVsbG8=',
      )
    })

    expect(addHistory).toHaveBeenCalledWith('hello', 'aGVsbG8=', {
      type: 'base64Encode',
    })
  })
})
