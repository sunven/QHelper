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
    fireEvent.change(input, { target: { value: 'json' } })
    expect(screen.getByText('星标收藏')).toBeVisible()
    fireEvent.change(input, { target: { value: '清除 Cookie' } })
    expect(screen.getByTestId('discovery-search-clear-cookie')).toBeVisible()
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
    fireEvent.change(input, { target: { value: 'json diff' } })
    const star = screen.getByRole('button', { name: '收藏JSON 格式化' })
    await waitFor(() => expect(star).toBeEnabled())
    fireEvent.click(star)
    await screen.findByRole('button', { name: '取消收藏JSON 格式化' })
    expect(launch).not.toHaveBeenCalled()
    fireEvent.keyDown(input, { key: 'Enter' })
    expect(launch.mock.calls[0][0].id).toBe('json')
    fireEvent.keyDown(input, { key: 'Escape' })
    expect(input).toHaveValue('')
    expect(screen.getByTestId('discovery-favorites-json')).toBeVisible()
    fireEvent.change(input, { target: { value: 'no-such-tool' } })
    expect(screen.getByRole('status')).toHaveTextContent('没有找到')
  })
})
