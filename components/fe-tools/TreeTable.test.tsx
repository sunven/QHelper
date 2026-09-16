import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { TreeTable, type TreeData, type TreeTableProps } from './TreeTable'

const columns: TreeTableProps['columns'] = [
  { key: 'title', header: 'Title' },
  {
    key: 'url',
    header: 'URL',
    render(value) {
      return (
        <a href={String(value)} target="_blank" rel="noreferrer">
          {String(value)}
        </a>
      )
    },
  },
  { key: 'dateAdded', header: 'Date Added' },
  { key: 'dateLastUsed', header: 'Date Last Used' },
  { key: 'dateGroupModified', header: 'Date Group Modified' },
]

const data: TreeData[] = [
  {
    id: '1',
    title: 'Folder',
    dateAdded: '1',
    children: [
      {
        id: '2',
        title: 'Child',
        url: 'https://example.com',
      },
    ],
  },
]

describe('fe-tools/TreeTable', () => {
  it('renders bookmark table headers', () => {
    render(<TreeTable data={data} columns={columns} />)

    for (const header of ['Title', 'URL', 'Date Added', 'Date Last Used', 'Date Group Modified']) {
      expect(screen.getByRole('columnheader', { name: header })).toBeVisible()
    }
  })

  it('allows callers to constrain the scroll container', () => {
    render(<TreeTable data={data} columns={columns} className="min-h-0 flex-1" />)

    expect(screen.getByRole('table').parentElement).toHaveClass('overflow-auto', 'min-h-0', 'flex-1')
  })

  it('keeps table headers sticky inside the scroll container', () => {
    render(<TreeTable data={data} columns={columns} />)

    const titleHeader = screen.getByRole('columnheader', { name: 'Title' })
    expect(titleHeader.closest('thead')).toHaveClass('sticky', 'top-0', 'z-10')
    expect(titleHeader).toHaveClass('font-bold')
  })

  it('renders nested children expanded by default and toggles them', async () => {
    const user = userEvent.setup()
    render(<TreeTable data={data} columns={columns} />)

    expect(screen.getByText('Child')).toBeVisible()
    await user.click(screen.getByRole('button', { name: 'Collapse row' }))
    expect(screen.queryByText('Child')).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Expand row' }))
    expect(screen.getByText('Child')).toBeVisible()
  })

  it('expands and collapses all rows from caller signals', () => {
    const { rerender } = render(<TreeTable data={data} columns={columns} collapseSignal={0} expandSignal={0} />)

    expect(screen.getByText('Child')).toBeVisible()

    rerender(<TreeTable data={data} columns={columns} collapseSignal={1} expandSignal={0} />)
    expect(screen.queryByText('Child')).not.toBeInTheDocument()

    rerender(<TreeTable data={data} columns={columns} collapseSignal={1} expandSignal={1} />)
    expect(screen.getByText('Child')).toBeVisible()
  })

  it('renders url cells as blank-target links', () => {
    render(<TreeTable data={data} columns={columns} />)

    const row = screen.getByText('Child').closest('tr')
    expect(row).not.toBeNull()
    const link = within(row as HTMLTableRowElement).getByRole('link', {
      name: 'https://example.com',
    })
    expect(link).toHaveAttribute('target', '_blank')
  })

  it('renders no checkbox column unless checked ids are supplied', () => {
    const { rerender } = render(<TreeTable data={data} columns={columns} />)

    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument()

    rerender(<TreeTable data={data} columns={columns} checkedIds={new Set()} />)

    expect(screen.getAllByRole('checkbox')).toHaveLength(3)
    expect(screen.getByRole('checkbox', { name: 'Select all rows' })).toBeVisible()
    expect(screen.getByRole('checkbox', { name: 'Select Folder' })).toBeVisible()
    expect(screen.getByRole('checkbox', { name: 'Select Child' })).toBeVisible()
  })

  it('keeps the row checkbox in its own leading cell', () => {
    render(<TreeTable data={data} columns={columns} checkedIds={new Set()} />)

    const row = screen.getByText('Folder').closest('tr')
    expect(row).not.toBeNull()
    const cells = within(row as HTMLTableRowElement).getAllByRole('cell')

    expect(within(cells[0]).getByRole('checkbox')).toBeInTheDocument()
    expect(
      within(cells[1]).getByRole('button', { name: 'Collapse row' }),
    ).toBeInTheDocument()
  })

  it('checks a row without selecting it', async () => {
    const user = userEvent.setup()
    const onCheckedIdsChange = vi.fn()
    const onRowSelect = vi.fn()

    render(
      <TreeTable
        data={data}
        columns={columns}
        checkedIds={new Set()}
        onCheckedIdsChange={onCheckedIdsChange}
        onRowSelect={onRowSelect}
      />,
    )

    await user.click(screen.getByRole('checkbox', { name: 'Select Child' }))

    expect(onCheckedIdsChange).toHaveBeenCalledWith(new Set(['1', '2']))
    expect(onRowSelect).not.toHaveBeenCalled()
  })

  it('promotes every ancestor once its whole subtree is checked', async () => {
    const user = userEvent.setup()
    const onCheckedIdsChange = vi.fn()
    const nestedData: TreeData[] = [
      {
        id: 'F',
        title: 'Outer',
        children: [
          { id: 'c1', title: 'Alpha', url: 'https://example.com/alpha' },
          {
            id: 'G',
            title: 'Inner',
            children: [
              { id: 'c2', title: 'Beta', url: 'https://example.com/beta' },
            ],
          },
        ],
      },
    ]

    render(
      <TreeTable
        data={nestedData}
        columns={columns}
        checkedIds={new Set(['c1'])}
        onCheckedIdsChange={onCheckedIdsChange}
      />,
    )

    await user.click(screen.getByRole('checkbox', { name: 'Select Beta' }))

    expect(onCheckedIdsChange).toHaveBeenCalledWith(
      new Set(['c1', 'c2', 'G', 'F']),
    )
  })

  it('leaves a folder out while one of its descendants stays unchecked', async () => {
    const user = userEvent.setup()
    const onCheckedIdsChange = vi.fn()

    render(
      <TreeTable
        data={data}
        columns={columns}
        checkedIds={new Set(['2'])}
        onCheckedIdsChange={onCheckedIdsChange}
      />,
    )

    await user.click(screen.getByRole('checkbox', { name: 'Select Child' }))

    expect(onCheckedIdsChange).toHaveBeenCalledWith(new Set())
  })

  it('checks every descendant of a checked folder', async () => {
    const user = userEvent.setup()
    const onCheckedIdsChange = vi.fn()

    render(
      <TreeTable
        data={data}
        columns={columns}
        checkedIds={new Set()}
        onCheckedIdsChange={onCheckedIdsChange}
      />,
    )

    await user.click(screen.getByRole('checkbox', { name: 'Select Folder' }))

    expect(onCheckedIdsChange).toHaveBeenCalledWith(new Set(['1', '2']))
  })

  it('leaves rows the caller rejects out of the selection', async () => {
    const user = userEvent.setup()
    const onCheckedIdsChange = vi.fn()

    render(
      <TreeTable
        data={data}
        columns={columns}
        checkedIds={new Set()}
        onCheckedIdsChange={onCheckedIdsChange}
        isSelectable={(item) => item.id !== '1'}
      />,
    )

    expect(screen.getByRole('checkbox', { name: 'Select Folder' })).toBeDisabled()

    await user.click(screen.getByRole('checkbox', { name: 'Select all rows' }))

    expect(onCheckedIdsChange).toHaveBeenCalledWith(new Set(['2']))
  })

  it('never promotes a row the caller rejects', async () => {
    const user = userEvent.setup()
    const onCheckedIdsChange = vi.fn()

    render(
      <TreeTable
        data={data}
        columns={columns}
        checkedIds={new Set()}
        onCheckedIdsChange={onCheckedIdsChange}
        isSelectable={(item) => item.id !== '1'}
      />,
    )

    await user.click(screen.getByRole('checkbox', { name: 'Select Child' }))

    expect(onCheckedIdsChange).toHaveBeenCalledWith(new Set(['2']))
  })

  it('unchecks every descendant of an unchecked folder', async () => {
    const user = userEvent.setup()
    const onCheckedIdsChange = vi.fn()

    render(
      <TreeTable
        data={data}
        columns={columns}
        checkedIds={new Set(['1', '2'])}
        onCheckedIdsChange={onCheckedIdsChange}
      />,
    )

    await user.click(screen.getByRole('checkbox', { name: 'Select Folder' }))

    expect(onCheckedIdsChange).toHaveBeenCalledWith(new Set())
  })

  it('drops a folder from the selection once one of its descendants is unchecked', async () => {
    const user = userEvent.setup()
    const onCheckedIdsChange = vi.fn()

    render(
      <TreeTable
        data={data}
        columns={columns}
        checkedIds={new Set(['1', '2'])}
        onCheckedIdsChange={onCheckedIdsChange}
      />,
    )

    await user.click(screen.getByRole('checkbox', { name: 'Select Child' }))

    expect(onCheckedIdsChange).toHaveBeenCalledWith(new Set())
  })

  it('partially checks a folder when only some of its descendants are checked', () => {
    render(
      <TreeTable data={data} columns={columns} checkedIds={new Set(['2'])} />,
    )

    expect(
      screen.getByRole('checkbox', { name: 'Select Folder' }),
    ).toBePartiallyChecked()
    expect(screen.getByRole('checkbox', { name: 'Select Child' })).toBeChecked()
  })

  it('checks a folder that is not itself selected and leaves its descendants alone', async () => {
    const user = userEvent.setup()
    const onCheckedIdsChange = vi.fn()

    render(
      <TreeTable
        data={data}
        columns={columns}
        checkedIds={new Set(['2'])}
        onCheckedIdsChange={onCheckedIdsChange}
      />,
    )

    await user.click(screen.getByRole('checkbox', { name: 'Select Folder' }))

    expect(onCheckedIdsChange).toHaveBeenCalledWith(new Set(['1', '2']))
  })

  it('reflects the checked rows in the header checkbox', () => {
    const { rerender } = render(
      <TreeTable data={data} columns={columns} checkedIds={new Set()} />,
    )

    const headerCheckbox = screen.getByRole('checkbox', {
      name: 'Select all rows',
    })

    expect(headerCheckbox).not.toBeChecked()

    rerender(
      <TreeTable data={data} columns={columns} checkedIds={new Set(['1'])} />,
    )
    expect(headerCheckbox).toBePartiallyChecked()

    rerender(
      <TreeTable
        data={data}
        columns={columns}
        checkedIds={new Set(['1', '2'])}
      />,
    )
    expect(headerCheckbox).toBeChecked()
    expect(headerCheckbox).not.toBePartiallyChecked()
  })

  it('checks every visible row from the header without dropping hidden ids', async () => {
    const user = userEvent.setup()
    const onCheckedIdsChange = vi.fn()

    render(
      <TreeTable
        data={data}
        columns={columns}
        checkedIds={new Set(['outside-the-filter'])}
        onCheckedIdsChange={onCheckedIdsChange}
      />,
    )

    await user.click(screen.getByRole('checkbox', { name: 'Select all rows' }))

    expect(onCheckedIdsChange).toHaveBeenCalledWith(
      new Set(['outside-the-filter', '1', '2']),
    )
  })

  it('unchecks only the visible rows from the header', async () => {
    const user = userEvent.setup()
    const onCheckedIdsChange = vi.fn()

    render(
      <TreeTable
        data={data}
        columns={columns}
        checkedIds={new Set(['outside-the-filter', '1', '2'])}
        onCheckedIdsChange={onCheckedIdsChange}
      />,
    )

    await user.click(screen.getByRole('checkbox', { name: 'Select all rows' }))

    expect(onCheckedIdsChange).toHaveBeenCalledWith(
      new Set(['outside-the-filter']),
    )
  })
})
