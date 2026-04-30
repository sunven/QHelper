import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
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

  it('renders nested children expanded by default and toggles them', async () => {
    const user = userEvent.setup()
    render(<TreeTable data={data} columns={columns} />)

    expect(screen.getByText('Child')).toBeVisible()
    await user.click(screen.getByRole('button', { name: 'Collapse row' }))
    expect(screen.queryByText('Child')).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Expand row' }))
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
})
