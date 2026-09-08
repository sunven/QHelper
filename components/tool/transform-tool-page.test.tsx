import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createTransformToolPage } from './transform-tool-page'

const { add } = vi.hoisted(() => ({
  add: vi.fn(),
}))

vi.mock('@/hooks/useToolHistory', () => ({
  useToolHistory: (toolId: string) => {
    if (toolId !== 'test-tool') {
      throw new Error(`unexpected toolId: ${toolId}`)
    }
    return { history: [], add }
  },
}))

type Mode = 'upper' | 'lower'

const transform = vi.fn(
  (input: string, options: { mode: Mode }) =>
    options.mode === 'upper' ? input.toUpperCase() : input.toLowerCase(),
)

const TestToolPage = createTransformToolPage<Mode, Record<string, never>>({
  toolId: 'test-tool',
  transform,
  defaultInput: 'Hello',
  defaultOptions: {},
  directions: [
    {
      mode: 'upper',
      label: '转大写',
      inputLabel: '原始文本',
      outputLabel: '大写结果',
    },
    {
      mode: 'lower',
      label: '转小写',
      inputLabel: '原始文本',
      outputLabel: '小写结果',
    },
  ],
  download: { prefix: 'text', extension: () => 'txt' },
})

const toolbarTransform = vi.fn((input: string) => input.toUpperCase())

const ToolbarToolPage = createTransformToolPage<
  'optimize',
  Record<string, never>
>({
  toolId: 'test-tool',
  transform: toolbarTransform,
  defaultInput: 'Hello',
  defaultOptions: {},
  directions: [{ mode: 'optimize', label: '优化', inputLabel: '输入', outputLabel: '输出' }],
  renderToolbar: ({ setInput }) => (
    <button type="button" onClick={() => setInput('uploaded')}>
      上传文件
    </button>
  ),
  stats: (input, output) => <div>{`${input.length}→${output.length} 字节`}</div>,
  download: { prefix: 'text', extension: () => 'txt' },
})

describe('createTransformToolPage', () => {
  beforeEach(() => {
    add.mockClear()
    transform.mockClear()
    // jsdom 未实现 Blob URL
    Object.defineProperty(URL, 'createObjectURL', {
      value: vi.fn(() => 'blob:test'),
      configurable: true,
    })
    Object.defineProperty(URL, 'revokeObjectURL', {
      value: vi.fn(),
      configurable: true,
    })
  })

  it('derives the output from the transform function', () => {
    render(<TestToolPage />)

    const output = screen.getByDisplayValue('HELLO')
    expect(output).toHaveAttribute('readonly')
    expect(screen.getByText('大写结果')).toBeInTheDocument()
    expect(screen.getByText('原始文本')).toBeInTheDocument()
  })

  it('switches direction and re-derives the output', async () => {
    const user = userEvent.setup()
    render(<TestToolPage />)

    await user.click(screen.getByRole('button', { name: '转小写' }))

    await waitFor(() => {
      expect(screen.getByDisplayValue('hello')).toBeInTheDocument()
    })
  })

  it('swap moves the output into the input and flips the direction', async () => {
    const user = userEvent.setup()
    render(<TestToolPage />)

    await user.click(screen.getByRole('button', { name: '交换方向' }))

    expect(screen.getByDisplayValue('HELLO')).toHaveValue('HELLO')
    // 输入变为原输出，方向翻转为小写后派生输出
    await waitFor(() => {
      expect(screen.getAllByDisplayValue('hello')).toHaveLength(1)
    })
    expect(transform).toHaveBeenLastCalledWith('HELLO', { mode: 'lower' })
  })

  it('shows the error inline and disables download when the transform fails', () => {
    transform.mockImplementationOnce(
      () => new Error('解析失败') as unknown as string,
    )
    render(<TestToolPage />)

    expect(screen.getByDisplayValue('解析失败')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '下载' })).toBeDisabled()
  })

  it('snapshots only a successful transform on download', async () => {
    transform.mockImplementation(() => new Error('解析失败') as unknown as string)
    const user = userEvent.setup()
    render(<TestToolPage />)

    // 错误时下载禁用，不会快照
    expect(screen.getByRole('button', { name: '下载' })).toBeDisabled()
    await user.click(screen.getByRole('button', { name: '下载' }))
    expect(add).not.toHaveBeenCalled()

    // 恢复成功转换后，需要一次重渲染让派生值重新计算
    transform.mockImplementation((input: string, options: { mode: Mode }) =>
      options.mode === 'upper' ? input.toUpperCase() : input.toLowerCase(),
    )
    // 切换方向再切回，触发输入或选项变化引发的重渲染
    await user.click(screen.getByRole('button', { name: '转小写' }))
    await waitFor(() => {
      expect(screen.getByRole('button', { name: '下载' })).toBeEnabled()
    })
    await user.click(screen.getByRole('button', { name: '下载' }))

    expect(add).toHaveBeenCalledTimes(1)
  })

  it('clear empties the input and the derived output', async () => {
    const user = userEvent.setup()
    render(<TestToolPage />)

    await user.click(screen.getByRole('button', { name: '清空' }))

    const textareas = screen.getAllByRole('textbox') as HTMLTextAreaElement[]
    expect(textareas.map((el) => el.value)).toEqual(['', ''])
  })

  it('renderToolbar shows the top bar for a single-direction tool and setInput feeds the transform', async () => {
    const user = userEvent.setup()
    render(<ToolbarToolPage />)

    // 单方向：无方向按钮，但顶栏因 renderToolbar 而可见
    expect(screen.getByRole('button', { name: '上传文件' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: '优化' })).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: '上传文件' }))
    expect(toolbarTransform).toHaveBeenLastCalledWith('uploaded', {
      mode: 'optimize',
    })
  })

  it('stats override replaces the default stats row', () => {
    render(<ToolbarToolPage />)

    expect(screen.getByText('5→5 字节')).toBeInTheDocument()
    expect(screen.queryByText('输入字符: 5')).not.toBeInTheDocument()
  })
})
