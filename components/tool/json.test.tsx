import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { JsonTool } from './json'

const { add, remove, historyState } = vi.hoisted(() => ({
  add: vi.fn(),
  remove: vi.fn(),
  historyState: { entries: [] as unknown[] },
}))

vi.mock('@/hooks/useToolHistory', () => ({
  useToolHistory: () => ({
    history: historyState.entries,
    loading: false,
    add,
    remove,
  }),
}))

describe('json/JsonTool history', () => {
  beforeEach(() => {
    historyState.entries = []
  })

  it('renders nothing when history is empty', () => {
    render(<JsonTool />)
    expect(screen.queryByText('历史记录')).toBeNull()
  })

  it('lists named entries and restores the content on select', async () => {
    historyState.entries = [
      {
        id: 'e1',
        timestamp: 1_700_000_000_000,
        input: '{"a":1}',
        metadata: { name: '我的 JSON' },
      },
    ]
    const user = userEvent.setup()
    render(<JsonTool />)

    await user.click(screen.getByText('我的 JSON'))

    expect(screen.getByDisplayValue('{"a":1}')).toBeInTheDocument()
  })

  it('deletes by entry id, not by row index', async () => {
    historyState.entries = [
      { id: 'e1', timestamp: 1, input: '{"a":1}', metadata: { name: '甲' } },
      { id: 'e2', timestamp: 2, input: '{"b":2}', metadata: { name: '乙' } },
    ]
    const user = userEvent.setup()
    render(<JsonTool />)

    // 第二条的删除按钮
    await user.click(screen.getAllByRole('button', { name: '删除这条历史' })[1])

    expect(remove).toHaveBeenCalledWith('e2')
  })
})
