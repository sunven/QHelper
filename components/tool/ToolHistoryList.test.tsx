import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import type { HistoryEntry } from '@/hooks/useToolHistory'
import { ToolHistoryList } from './ToolHistoryList'

type Snapshot = { input: string }

function makeEntries(...inputs: string[]): HistoryEntry<Snapshot>[] {
  return inputs.map((input, index) => ({
    id: `entry-${index}`,
    timestamp: 1_700_000_000_000 + index,
    input: { input },
  }))
}

function renderList(
  entries: HistoryEntry<Snapshot>[],
  props: {
    onSelect?: (entry: HistoryEntry<Snapshot>) => void
    onClear?: () => void
    onRemove?: (id: string) => void
  } = {},
) {
  return render(
    <ToolHistoryList
      entries={entries}
      renderItem={(entry) => (
        <span className="line-clamp-1 font-mono text-xs">
          {entry.input.input}
        </span>
      )}
      onSelect={props.onSelect ?? (() => undefined)}
      onClear={props.onClear}
      onRemove={props.onRemove}
    />,
  )
}

describe('tool/ToolHistoryList', () => {
  it('renders nothing when there is no history', () => {
    const { container } = renderList([])

    expect(container).toBeEmptyDOMElement()
    expect(screen.queryByText('历史记录')).not.toBeInTheDocument()
  })

  it('renders one row per entry, in the order given', () => {
    renderList(makeEntries('first', 'second', 'third'))

    const rows = screen.getAllByText(/first|second|third/)
    expect(rows.map((row) => row.textContent)).toEqual([
      'first',
      'second',
      'third',
    ])
  })

  it('reports the selected entry, not just its input', async () => {
    const onSelect = vi.fn()
    const entries = makeEntries('alpha')
    const user = userEvent.setup()

    renderList(entries, { onSelect })
    await user.click(screen.getByText('alpha'))

    expect(onSelect).toHaveBeenCalledWith(entries[0])
  })

  it('renders no clear control unless onClear is given', () => {
    renderList(makeEntries('alpha'))

    expect(screen.queryByRole('button', { name: /清除历史/ })).toBeNull()
  })

  it('renders the clear control with the entry count and reports clicks', async () => {
    const onClear = vi.fn()
    const user = userEvent.setup()

    renderList(makeEntries('a', 'b'), { onClear })
    await user.click(screen.getByRole('button', { name: '清除历史 (2)' }))

    expect(onClear).toHaveBeenCalledTimes(1)
  })

  it('renders no delete control unless onRemove is given', () => {
    renderList(makeEntries('alpha'))

    expect(screen.queryByRole('button', { name: '删除这条历史' })).toBeNull()
  })

  it('deletes by entry id without selecting the row', async () => {
    const onSelect = vi.fn()
    const onRemove = vi.fn()
    const user = userEvent.setup()

    renderList(makeEntries('alpha'), { onSelect, onRemove })
    await user.click(screen.getByRole('button', { name: '删除这条历史' }))

    expect(onRemove).toHaveBeenCalledWith('entry-0')
    expect(onSelect).not.toHaveBeenCalled()
  })

  it('lets renderItem own the row content', () => {
    render(
      <ToolHistoryList
        entries={makeEntries('alpha')}
        renderItem={() => <span>custom content</span>}
        onSelect={() => undefined}
      />,
    )

    expect(screen.getByText('custom content')).toBeVisible()
    expect(screen.queryByText('alpha')).toBeNull()
  })
})
