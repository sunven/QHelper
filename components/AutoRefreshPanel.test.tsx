import type {
  AutoRefreshMessage,
  AutoRefreshTabState,
  RefreshRule,
} from '@/types/auto-refresh'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AutoRefreshPanel } from './AutoRefreshPanel'

const { sendAutoRefreshMessage } = vi.hoisted(() => ({
  sendAutoRefreshMessage: vi.fn(),
}))

vi.mock('@/lib/auto-refresh/client', () => ({
  sendAutoRefreshMessage,
}))

const tabsQuery = chrome.tabs.query as unknown as ReturnType<typeof vi.fn>

const rule: RefreshRule = {
  id: 'rule-1',
  url: 'https://example.com/',
  intervalSeconds: 60,
  enabled: true,
  createdAt: 1,
  updatedAt: 1,
}

function tabState(
  overrides: Partial<AutoRefreshTabState> = {},
): AutoRefreshTabState {
  return {
    tabId: 1,
    url: 'https://example.com/',
    supported: true,
    masterEnabled: true,
    paused: false,
    rule: null,
    session: null,
    effective: 'none',
    ...overrides,
  }
}

function mockMessages(initialState: AutoRefreshTabState) {
  sendAutoRefreshMessage.mockImplementation(
    async (message: AutoRefreshMessage) => {
      switch (message.type) {
        case 'AUTO_REFRESH_GET_TAB_STATE':
          return initialState
        case 'AUTO_REFRESH_START_SESSION':
          return tabState({
            effective: 'session',
            session: {
              tabId: 1,
              url: 'https://example.com/',
              intervalSeconds: message.intervalSeconds,
              startedAt: 1,
            },
          })
        case 'AUTO_REFRESH_STOP_SESSION':
          return tabState()
        case 'AUTO_REFRESH_PAUSE_TAB':
          return tabState({ paused: true })
        case 'AUTO_REFRESH_RESUME_TAB':
          return initialState
        default:
          throw new Error(`Unexpected message: ${message.type}`)
      }
    },
  )
}

describe('auto-refresh/AutoRefreshPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    tabsQuery.mockResolvedValue([
      {
        id: 1,
        url: 'https://example.com/',
        status: 'complete',
        discarded: false,
        frozen: false,
      },
    ])
  })

  it('starts a session for a page without a rule', async () => {
    const user = userEvent.setup()
    mockMessages(tabState())

    render(<AutoRefreshPanel />)

    expect(await screen.findByText('未设置')).toBeVisible()
    await user.click(screen.getByRole('button', { name: /开始临时刷新/ }))

    await waitFor(() => {
      expect(sendAutoRefreshMessage).toHaveBeenCalledWith({
        type: 'AUTO_REFRESH_START_SESSION',
        tabId: 1,
        intervalSeconds: 10,
      })
    })
    expect(await screen.findByText(/临时刷新 · 每 10 秒/)).toBeVisible()
  })

  it('shows the persistent rule state and pause action', async () => {
    mockMessages(
      tabState({
        effective: 'rule',
        rule,
      }),
    )

    render(<AutoRefreshPanel />)

    expect(await screen.findByText(/持久规则 · 每 1 分钟/)).toBeVisible()
    expect(screen.getByRole('button', { name: /暂停此标签页/ })).toBeVisible()
  })

  it('shows the global-off state', async () => {
    mockMessages(
      tabState({
        masterEnabled: false,
        effective: 'none',
        rule,
      }),
    )

    render(<AutoRefreshPanel />)

    expect(await screen.findByText(/自动刷新已全局关闭/)).toBeVisible()
    expect(screen.getByRole('button', { name: '打开管理页' })).toBeVisible()
  })

  it('reports unsupported pages', async () => {
    mockMessages(
      tabState({
        supported: false,
        url: null,
      }),
    )

    render(<AutoRefreshPanel />)

    expect(await screen.findByText('此页面不支持')).toBeVisible()
    expect(screen.getByText(/仅支持 http\(s\) 网页/)).toBeVisible()
  })
})
