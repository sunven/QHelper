import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { FORMATTER_LANGUAGE_META } from '@/lib/syntax-formatter'
import { SyntaxFormatter } from './formatter'

const { add, historyState, migrateLegacyFormatterHistory } = vi.hoisted(() => ({
  add: vi.fn(),
  historyState: { entries: [] as unknown[] },
  migrateLegacyFormatterHistory: vi.fn(async () => null),
}))

vi.mock('@/hooks/useToolHistory', () => ({
  useToolHistory: () => ({
    history: historyState.entries,
    loading: false,
    add,
    remove: vi.fn(),
    clear: vi.fn(() => Promise.resolve()),
  }),
}))

vi.mock('@/lib/syntax-formatter', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/syntax-formatter')>()
  return {
    ...actual,
    migrateLegacyFormatterHistory,
  }
})

function renderFormatter(initialEntry = '/formatter.html') {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <SyntaxFormatter />
    </MemoryRouter>,
  )
}

describe('SyntaxFormatter', () => {
  beforeEach(() => {
    add.mockClear()
    migrateLegacyFormatterHistory.mockClear()
    historyState.entries = []
    Object.defineProperty(URL, 'createObjectURL', {
      value: vi.fn(() => 'blob:test'),
      configurable: true,
    })
    Object.defineProperty(URL, 'revokeObjectURL', {
      value: vi.fn(),
      configurable: true,
    })
  })

  it('applies the HTML sample once language is ready', async () => {
    renderFormatter()

    await waitFor(() => {
      expect(screen.getByTestId('formatter-input')).toHaveValue(
        FORMATTER_LANGUAGE_META.html.defaultInput,
      )
    })
    expect(screen.getByTestId('formatter-language-html')).toBeInTheDocument()
    expect(screen.getAllByRole('combobox')).toHaveLength(2)
  })

  it('keeps the input when switching Formatter Language', async () => {
    const user = userEvent.setup()
    renderFormatter()

    await waitFor(() => {
      expect(screen.getByTestId('formatter-input')).toHaveValue(
        FORMATTER_LANGUAGE_META.html.defaultInput,
      )
    })

    await user.click(screen.getByRole('button', { name: 'XML' }))

    expect(screen.getByTestId('formatter-input')).toHaveValue(
      FORMATTER_LANGUAGE_META.html.defaultInput,
    )
    expect(screen.getByText('XML 输入')).toBeInTheDocument()
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument()
  })

  it('uses the language query before persisted language', async () => {
    renderFormatter('/formatter.html?language=css')

    await waitFor(() => {
      expect(screen.getByTestId('formatter-input')).toHaveValue(
        FORMATTER_LANGUAGE_META.css.defaultInput,
      )
    })
    expect(screen.getByText('CSS 输入')).toBeInTheDocument()
  })

  it('restores language, direction, and input from history', async () => {
    historyState.entries = [
      {
        id: 'entry-0',
        timestamp: 1,
        input: {
          input: '<root><a/></root>',
          language: 'xml',
          mode: 'minify',
          htmlOptions: {
            indentSize: 2,
            indentChar: 'space',
            wrapLineLength: 120,
          },
        },
      },
    ]
    const user = userEvent.setup()
    renderFormatter()

    await user.click(screen.getByText(/XML:/))

    expect(screen.getByTestId('formatter-input')).toHaveValue(
      '<root><a/></root>',
    )
    expect(screen.getByText('XML 输入')).toBeInTheDocument()
    await waitFor(() => {
      expect(screen.getByTestId('formatter-output')).toHaveValue(
        '<root><a></a></root>',
      )
    })
  })

  it('snapshots language with the input on download', async () => {
    const user = userEvent.setup()
    renderFormatter()

    await waitFor(() => {
      expect(screen.getByRole('button', { name: '下载' })).toBeEnabled()
    })
    await user.click(screen.getByRole('button', { name: '下载' }))

    expect(add).toHaveBeenCalledWith(
      expect.objectContaining({
        language: 'html',
        mode: 'beautify',
        input: FORMATTER_LANGUAGE_META.html.defaultInput,
      }),
    )
  })
})
