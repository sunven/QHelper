import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { getLaunchDirectory } from '@/lib/tool-catalog'
import { installToolDataStorage } from '@/test/tool-data-storage'
import { ToolDiscovery } from './ToolDiscovery'

describe('tool search controls', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    installToolDataStorage()
  })
  it('only labels the favorites column in popup results that offer stars', () => {
    render(
      <ToolDiscovery
        surface="popup"
        entries={getLaunchDirectory('popup-main').entries}
        onLaunch={vi.fn()}
        onSearchingChange={vi.fn()}
      />,
    )
    const input = screen.getByRole('textbox', { name: '搜索工具' })
    expect(screen.queryByText('星标收藏')).not.toBeInTheDocument()
    fireEvent.change(input, { target: { value: 'uuid' } })
    expect(screen.getByText('星标收藏')).toBeVisible()
    fireEvent.change(input, { target: { value: '书签' } })
    expect(screen.getByTestId('discovery-search-bookmarks')).toBeVisible()
    expect(screen.queryByText('星标收藏')).not.toBeInTheDocument()
  })
  it('supports keyboard launch, clearing, empty results and independent favorites', async () => {
    const launch = vi.fn()
    render(
      <ToolDiscovery
        entries={getLaunchDirectory('popup-main').entries}
        onLaunch={launch}
        onSearchingChange={vi.fn()}
      />,
    )
    const input = screen.getByRole('textbox', { name: '搜索工具' })
    fireEvent.change(input, { target: { value: 'reload' } })
    const star = screen.getByRole('button', { name: '收藏自动刷新' })
    await waitFor(() => expect(star).toBeEnabled())
    fireEvent.click(star)
    await screen.findByRole('button', { name: '取消收藏自动刷新' })
    expect(launch).not.toHaveBeenCalled()
    fireEvent.keyDown(input, { key: 'Enter' })
    expect(launch.mock.calls[0][0].id).toBe('auto-refresh')
    fireEvent.keyDown(input, { key: 'Escape' })
    expect(input).toHaveValue('')
    expect(screen.getByTestId('discovery-favorites-auto-refresh')).toBeVisible()
    fireEvent.change(input, { target: { value: 'no-such-tool' } })
    expect(screen.getByRole('status')).toHaveTextContent('没有找到')
  })
})
