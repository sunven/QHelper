import { describe, expect, it, vi } from 'vitest'
import {
  consumePendingWebSummaryAction,
  ensureWebSummaryContextMenu,
  openWebSummaryPanel,
  type WebSummaryBackgroundDeps,
  WEB_SUMMARY_CONTEXT_MENU_ID,
} from './background'

describe('web-summary/background', () => {
  it('opens the sidepanel for the requested tab and stores a pending action', async () => {
    const pendingActions = new Map()
    const deps: WebSummaryBackgroundDeps = {
      getActiveTabId: vi.fn(),
      openSidePanel: vi.fn(() => Promise.resolve()),
    }

    const action = await openWebSummaryPanel(
      { type: 'OPEN_WEB_SUMMARY', tabId: 42 },
      pendingActions,
      deps,
    )

    expect(action).toEqual({ type: 'SUMMARIZE_ACTIVE_PAGE', tabId: 42 })
    expect(deps.openSidePanel).toHaveBeenCalledWith({ tabId: 42 })
    expect(pendingActions.get(42)).toEqual(action)
  })

  it('falls back to the current active tab when the popup omits tabId', async () => {
    const pendingActions = new Map()
    const deps: WebSummaryBackgroundDeps = {
      getActiveTabId: vi.fn(() => Promise.resolve(7)),
      openSidePanel: vi.fn(() => Promise.resolve()),
    }

    await openWebSummaryPanel(
      { type: 'OPEN_WEB_SUMMARY' },
      pendingActions,
      deps,
    )

    expect(deps.getActiveTabId).toHaveBeenCalled()
    expect(deps.openSidePanel).toHaveBeenCalledWith({ tabId: 7 })
  })

  it('consumes pending actions only once', () => {
    const pendingActions = new Map([
      [3, { type: 'SUMMARIZE_ACTIVE_PAGE' as const, tabId: 3 }],
    ])

    expect(consumePendingWebSummaryAction(3, pendingActions)).toEqual({
      type: 'SUMMARIZE_ACTIVE_PAGE',
      tabId: 3,
    })
    expect(consumePendingWebSummaryAction(3, pendingActions)).toBeNull()
  })

  it('registers a dedicated context-menu entry for opening the sidepanel', async () => {
    const deps = {
      removeMenu: vi.fn(() => Promise.resolve()),
      createMenu: vi.fn(),
    }

    await ensureWebSummaryContextMenu(deps)

    expect(deps.removeMenu).toHaveBeenCalledWith(WEB_SUMMARY_CONTEXT_MENU_ID)
    expect(deps.createMenu).toHaveBeenCalledWith({
      id: WEB_SUMMARY_CONTEXT_MENU_ID,
      title: '使用 QHelper 总结当前网页',
      contexts: ['all'],
      documentUrlPatterns: ['http://*/*', 'https://*/*'],
    })
  })
})
