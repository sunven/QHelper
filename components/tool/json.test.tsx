import { fireEvent, render, screen, within } from '@testing-library/react'
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

describe('JSON response diff', () => {
  beforeEach(() => {
    historyState.entries = []
    vi.clearAllMocks()
  })

  async function openDiff(before = '', after = '') {
    const user = userEvent.setup()
    render(<JsonTool />)
    await user.click(screen.getByRole('button', { name: /^Diff$/ }))
    fireEvent.change(screen.getByLabelText('基准响应'), {
      target: { value: before },
    })
    fireEvent.change(screen.getByLabelText('待比较响应'), {
      target: { value: after },
    })
    return user
  }

  it('shows field changes and keeps both responses editable', async () => {
    const user = await openDiff(
      '{"data":{"id":1,"name":"A","count":1}}',
      '{"data":{"id":"1","enabled":true,"count":2}}',
    )
    await user.click(screen.getByRole('button', { name: '执行 Diff' }))
    const result = screen.getByTestId('json-diff-result')
    for (const label of ['新增 1', '删除 1', '值变化 1', '类型变化 1']) {
      expect(within(result).getByText(label)).toBeInTheDocument()
    }
    expect(within(result).getByText('data.id')).toBeInTheDocument()
    expect(screen.getByLabelText('基准响应')).toBeVisible()
    expect(screen.getByLabelText('待比较响应')).toBeVisible()
    fireEvent.change(screen.getByLabelText('待比较响应'), {
      target: { value: '{}' },
    })
    expect(screen.queryByTestId('json-diff-result')).toBeNull()
  })

  it('validates each side and never compares invalid JSON as plain text', async () => {
    const user = await openDiff('', '{invalid')
    await user.click(screen.getByRole('button', { name: '执行 Diff' }))
    expect(screen.getByText('请输入基准响应')).toBeVisible()
    expect(screen.getByText(/待比较响应 JSON 无效/)).toBeVisible()
    expect(screen.queryByTestId('json-diff-result')).toBeNull()
  })

  it.each(['ctrlKey', 'metaKey'])(
    'swaps, compares via %s and clears both inputs',
    async (modifier) => {
      const user = await openDiff('null', '{}')
      await user.click(screen.getByRole('button', { name: '交换输入' }))
      expect(screen.getByLabelText('基准响应')).toHaveValue('{}')
      expect(screen.getByLabelText('待比较响应')).toHaveValue('null')
      fireEvent.keyDown(document, { key: 'Enter', [modifier]: true })
      expect(screen.getByTestId('json-diff-result')).toBeVisible()
      await user.click(screen.getByRole('button', { name: '清空输入' }))
      expect(screen.getByLabelText('基准响应')).toHaveValue('')
      expect(screen.getByLabelText('待比较响应')).toHaveValue('')
      expect(screen.queryByTestId('json-diff-result')).toBeNull()
    },
  )

  it('reports equal content despite object key order', async () => {
    const user = await openDiff('{"a":1,"b":2}', '{"b":2,"a":1}')
    await user.click(screen.getByRole('button', { name: '执行 Diff' }))
    expect(screen.getByText('两个 JSON 内容相同，没有发现差异')).toBeVisible()
  })

  it('copies the report, handles failure and retries a single change', async () => {
    const user = await openDiff('{"id":1}', '{"id":"1"}')
    const write = vi
      .spyOn(navigator.clipboard, 'writeText')
      .mockResolvedValue(undefined)
    await user.click(screen.getByRole('button', { name: '执行 Diff' }))
    await user.click(screen.getByRole('button', { name: '复制全部差异' }))
    expect(write).toHaveBeenCalledWith(
      expect.stringContaining('基准响应 → 待比较响应'),
    )
    expect(screen.getByRole('button', { name: '已复制' })).toBeVisible()
    write.mockRejectedValueOnce(new Error('denied'))
    await user.click(screen.getByRole('button', { name: '复制此项' }))
    expect(screen.getByRole('alert')).toHaveTextContent('复制失败，请重试')
    await user.click(screen.getByRole('button', { name: '复制此项' }))
    expect(screen.queryByRole('alert')).toBeNull()
    expect(write).toHaveBeenLastCalledWith(
      expect.stringContaining('[类型变化]'),
    )
  })
})

it('invalidates a diff when history restores the baseline', async () => {
  historyState.entries = [
    {
      id: 'restore',
      timestamp: 1,
      input: '{"restored":true}',
      metadata: { name: '恢复基准' },
    },
  ]
  const user = userEvent.setup()
  render(<JsonTool />)
  await user.click(screen.getByRole('button', { name: /^Diff$/ }))
  fireEvent.change(screen.getByLabelText('基准响应'), {
    target: { value: '{}' },
  })
  fireEvent.change(screen.getByLabelText('待比较响应'), {
    target: { value: 'null' },
  })
  await user.click(screen.getByRole('button', { name: '执行 Diff' }))
  expect(screen.getByTestId('json-diff-result')).toBeVisible()
  await user.click(screen.getByText('恢复基准'))
  expect(screen.getByLabelText('基准响应')).toHaveValue('{"restored":true}')
  expect(screen.queryByTestId('json-diff-result')).toBeNull()
})
