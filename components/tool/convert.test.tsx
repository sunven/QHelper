import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ConvertTool } from './convert'

const { add, clear, historyState } = vi.hoisted(() => ({
  add: vi.fn(),
  clear: vi.fn(),
  historyState: { entries: [] as unknown[] },
}))

vi.mock('@/hooks/useToolHistory', () => ({
  useToolHistory: () => ({
    history: historyState.entries,
    loading: false,
    add,
    remove: vi.fn(),
    clear,
  }),
}))

describe('convert/ConvertTool', () => {
  beforeEach(() => {
    add.mockClear()
    clear.mockClear()
    historyState.entries = []
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

    expect(add).toHaveBeenCalledWith(
      { source: 'hello', result: 'aGVsbG8=' },
      { type: 'base64Encode' },
    )
  })

  it('lists history newest-last and restores the source on select', async () => {
    historyState.entries = [
      {
        id: 'entry-old',
        timestamp: 1_700_000_000_000,
        input: { source: 'older', result: 'b2xkZXI=' },
        metadata: { type: 'base64Encode' },
      },
      {
        id: 'entry-new',
        timestamp: 1_700_000_100_000,
        input: { source: 'newer', result: 'bmV3ZXI=' },
        metadata: { type: 'base64Encode' },
      },
    ]
    const user = userEvent.setup()

    render(<ConvertTool />)

    // 共享 module 按传入顺序渲染(store 顺序:最新在末尾)
    expect(screen.getByText('older')).toBeInTheDocument()
    expect(screen.getByText('newer')).toBeInTheDocument()

    await user.click(screen.getByText('older'))

    expect(
      screen.getByPlaceholderText('粘贴需要进行编解码的字符串'),
    ).toHaveValue('older')
  })
})
