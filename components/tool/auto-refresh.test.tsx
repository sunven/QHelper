import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type {
  AutoRefreshMessage,
  AutoRefreshRuleView,
  AutoRefreshSnapshot,
} from '@/types/auto-refresh'
import { AutoRefreshTool } from './auto-refresh'

const { sendAutoRefreshMessage } = vi.hoisted(() => ({
  sendAutoRefreshMessage: vi.fn(),
}))

vi.mock('@/lib/auto-refresh/client', () => ({
  sendAutoRefreshMessage,
}))

const rule: AutoRefreshRuleView = {
  id: 'rule-1',
  url: 'https://example.com/',
  intervalSeconds: 60,
  enabled: true,
  createdAt: 1,
  updatedAt: 1,
  activeTabCount: 1,
}

function snapshotWith(
  rules: AutoRefreshRuleView[],
  masterEnabled = true,
): AutoRefreshSnapshot {
  return { masterEnabled, rules }
}

function mockMessages(initialSnapshot: AutoRefreshSnapshot) {
  sendAutoRefreshMessage.mockImplementation(
    async (message: AutoRefreshMessage) => {
      switch (message.type) {
        case 'AUTO_REFRESH_GET_SNAPSHOT':
          return initialSnapshot
        case 'AUTO_REFRESH_SAVE_RULE':
          return {
            created: true,
            rule,
            snapshot: snapshotWith([rule]),
          }
        case 'AUTO_REFRESH_SET_RULE_ENABLED':
          return snapshotWith([{ ...rule, enabled: message.enabled }])
        case 'AUTO_REFRESH_DELETE_RULE':
          return snapshotWith([])
        case 'AUTO_REFRESH_SET_MASTER':
          return snapshotWith(initialSnapshot.rules, message.enabled)
        default:
          throw new Error(`Unexpected message: ${message.type}`)
      }
    },
  )
}

describe('auto-refresh/AutoRefreshTool', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(window, 'confirm').mockReturnValue(true)
  })

  it('renders the empty state from the background snapshot', async () => {
    mockMessages(snapshotWith([]))

    render(<AutoRefreshTool />)

    expect(await screen.findByText('还没有持久规则')).toBeVisible()
    expect(sendAutoRefreshMessage).toHaveBeenCalledWith({
      type: 'AUTO_REFRESH_GET_SNAPSHOT',
    })
  })

  it('adds a rule with a normalized URL and the default interval', async () => {
    const user = userEvent.setup()
    mockMessages(snapshotWith([]))

    render(<AutoRefreshTool />)
    await screen.findByText('还没有持久规则')

    await user.type(screen.getByLabelText('网页 URL'), 'https://example.com')
    await user.click(screen.getByRole('button', { name: '添加规则' }))

    await waitFor(() => {
      expect(sendAutoRefreshMessage).toHaveBeenCalledWith({
        type: 'AUTO_REFRESH_SAVE_RULE',
        id: undefined,
        url: 'https://example.com/',
        intervalSeconds: 60,
        enabled: true,
      })
    })
    expect(await screen.findByText('规则已添加')).toBeVisible()
    expect(await screen.findByText(rule.url)).toBeVisible()
  })

  it('rejects an out-of-range interval instead of saving the previous value', async () => {
    const user = userEvent.setup()
    mockMessages(snapshotWith([]))

    render(<AutoRefreshTool />)
    await screen.findByText('还没有持久规则')

    await user.type(screen.getByLabelText('网页 URL'), 'https://example.com')
    const intervalInput = screen.getByLabelText('自定义刷新间隔（秒）')
    await user.clear(intervalInput)
    await user.type(intervalInput, '10')
    expect(intervalInput).toHaveValue(10)
    await user.click(screen.getByRole('button', { name: '添加规则' }))

    expect(
      await screen.findByText('间隔需在 30 秒 到 24 小时 之间'),
    ).toBeVisible()
    expect(intervalInput).toHaveValue(10)
    expect(sendAutoRefreshMessage).not.toHaveBeenCalledWith(
      expect.objectContaining({ type: 'AUTO_REFRESH_SAVE_RULE' }),
    )
  })

  it('toggles an existing rule', async () => {
    const user = userEvent.setup()
    mockMessages(snapshotWith([rule]))

    render(<AutoRefreshTool />)
    await screen.findByText(rule.url)

    await user.click(screen.getByRole('switch', { name: '停用规则' }))

    await waitFor(() => {
      expect(sendAutoRefreshMessage).toHaveBeenCalledWith({
        type: 'AUTO_REFRESH_SET_RULE_ENABLED',
        id: rule.id,
        enabled: false,
      })
    })
  })

  it('deletes a rule after confirmation', async () => {
    const user = userEvent.setup()
    mockMessages(snapshotWith([rule]))

    render(<AutoRefreshTool />)
    await screen.findByText(rule.url)

    await user.click(screen.getByRole('button', { name: /删除/ }))

    expect(window.confirm).toHaveBeenCalled()
    await waitFor(() => {
      expect(sendAutoRefreshMessage).toHaveBeenCalledWith({
        type: 'AUTO_REFRESH_DELETE_RULE',
        id: rule.id,
      })
    })
  })
})
