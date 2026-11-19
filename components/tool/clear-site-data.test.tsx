import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ClearSiteDataTool } from './clear-site-data'

const { collectSiteDataCounts, clearSiteData, reload } = vi.hoisted(() => ({
  collectSiteDataCounts: vi.fn(),
  clearSiteData: vi.fn(),
  reload: vi.fn(),
}))

vi.mock('@/lib/site-data/counts', () => ({ collectSiteDataCounts }))
vi.mock('@/lib/site-data/clear', () => ({ clearSiteData }))
vi.mock('@/lib/chrome/tabs', () => ({ reload }))

const counts = {
  cookies: 3,
  localStorage: 2,
  sessionStorage: 1,
  indexedDB: 1,
  cacheStorage: 1,
  serviceWorkers: 0,
}

const allTypes = [
  'cookies',
  'localStorage',
  'sessionStorage',
  'indexedDB',
  'cacheStorage',
  'serviceWorkers',
]

describe('clear-site-data tool', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    window.history.replaceState({}, '', '/tools/clear-site-data.html')
    collectSiteDataCounts.mockResolvedValue(counts)
    clearSiteData.mockResolvedValue({
      results: [
        { type: 'cookies', status: 'success', message: '已删除 3 条 Cookie' },
      ],
      affectedTabIds: [7],
    })
    reload.mockResolvedValue(undefined)
  })

  afterEach(() => {
    window.history.replaceState({}, '', '/')
  })

  it('defaults to every data type and shows the all-sites warning', async () => {
    render(<ClearSiteDataTool />)

    await waitFor(() => {
      expect(collectSiteDataCounts).toHaveBeenCalledWith({ mode: 'all-sites' })
    })

    for (const type of allTypes) {
      expect(await screen.findByTestId(`clear-site-data-type-${type}`)).toBeChecked()
    }

    expect(screen.getByTestId('clear-site-data-target-all')).toBeChecked()
    expect(screen.getByTestId('clear-site-data-target-current')).toBeDisabled()
    expect(await screen.findByText('3')).toBeVisible()
    expect(screen.getByText(/包含扩展自身的 Cookie/)).toBeVisible()
  })

  it('labels unpredicted types as 不统计 in all-sites mode', async () => {
    collectSiteDataCounts.mockResolvedValue({
      cookies: 3151,
      localStorage: null,
      sessionStorage: null,
      indexedDB: null,
      cacheStorage: null,
      serviceWorkers: null,
    })

    render(<ClearSiteDataTool />)

    expect(await screen.findByText('3151')).toBeVisible()
    expect(screen.getAllByText('不统计')).toHaveLength(5)
    expect(
      screen.getByText(
        /仅能统计 Cookie 数量；其余类型无法预览，但仍会随清理生效/,
      ),
    ).toBeVisible()

    fireEvent.click(screen.getByTestId('clear-site-data-clear'))
    fireEvent.click(screen.getByTestId('clear-site-data-confirm'))
    await waitFor(() => {
      expect(clearSiteData).toHaveBeenCalledTimes(1)
    })
  })

  it('shows the current site target when launched from the popup', async () => {    window.history.replaceState(
      {},
      '',
      '/tools/clear-site-data.html?origin=https%3A%2F%2Fapp.example.com&tabId=9',
    )
    render(<ClearSiteDataTool />)

    await waitFor(() => {
      expect(collectSiteDataCounts).toHaveBeenCalledWith({
        mode: 'current-site',
        origin: 'https://app.example.com',
        hostname: 'app.example.com',
        tabId: 9,
      })
    })

    expect(screen.getByTestId('clear-site-data-target-current')).toBeChecked()
    expect(screen.getByText('https://app.example.com')).toBeVisible()
    expect(
      screen.queryByText(/包含扩展自身的 Cookie/),
    ).not.toBeInTheDocument()
  })

  it('clears the selected types after confirmation and refreshes affected tabs', async () => {
    render(<ClearSiteDataTool />)
    await screen.findByText('3')

    fireEvent.click(screen.getByTestId('clear-site-data-clear'))
    expect(screen.getByText('确认清除站点数据')).toBeVisible()

    fireEvent.click(screen.getByTestId('clear-site-data-confirm'))

    await waitFor(() => {
      expect(clearSiteData).toHaveBeenCalledTimes(1)
    })
    expect(clearSiteData.mock.calls[0][0]).toEqual({ mode: 'all-sites' })
    expect(clearSiteData.mock.calls[0][1]).toEqual(allTypes)

    await waitFor(() => {
      expect(reload).toHaveBeenCalledWith(7)
    })
    expect(
      await screen.findByTestId('clear-site-data-result-cookies'),
    ).toHaveTextContent('成功')
  })

  it('only clears selected types', async () => {
    render(<ClearSiteDataTool />)
    await waitFor(() => {
      expect(collectSiteDataCounts).toHaveBeenCalled()
    })

    fireEvent.click(screen.getByTestId('clear-site-data-type-serviceWorkers'))
    fireEvent.click(screen.getByTestId('clear-site-data-type-cacheStorage'))
    fireEvent.click(screen.getByTestId('clear-site-data-clear'))
    fireEvent.click(screen.getByTestId('clear-site-data-confirm'))

    await waitFor(() => {
      expect(clearSiteData).toHaveBeenCalledTimes(1)
    })
    expect(clearSiteData.mock.calls[0][1]).toEqual([
      'cookies',
      'localStorage',
      'sessionStorage',
      'indexedDB',
    ])
  })

  it('renders per-type failure results', async () => {
    clearSiteData.mockResolvedValue({
      results: [
        {
          type: 'cookies',
          status: 'failed',
          message: '3 条 Cookie 删除失败',
        },
        { type: 'localStorage', status: 'success' },
      ],
      affectedTabIds: [],
    })

    render(<ClearSiteDataTool />)
    await screen.findByText('3')
    fireEvent.click(screen.getByTestId('clear-site-data-clear'))
    fireEvent.click(screen.getByTestId('clear-site-data-confirm'))

    const cookiesResult = await screen.findByTestId(
      'clear-site-data-result-cookies',
    )
    expect(cookiesResult).toHaveTextContent('失败')
    expect(cookiesResult).toHaveTextContent('3 条 Cookie 删除失败')
  })
})
