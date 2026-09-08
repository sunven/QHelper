import { describe, expect, it, vi } from 'vitest'
import {
  createWebSummaryPanelProtocol,
  ensureWebSummaryContextMenu,
  type WebSummaryBackgroundDeps,
  WEB_SUMMARY_CONTEXT_MENU_ID,
} from './background'

function createDeps(overrides: Partial<WebSummaryBackgroundDeps> = {}) {
  return {
    getActiveTabId: vi.fn(),
    openSidePanel: vi.fn(() => Promise.resolve()),
    ...overrides,
  }
}

describe('web-summary/background', () => {
  it('opens the sidepanel for the requested tab and stores a pending action', async () => {
    const deps = createDeps()
    const protocol = createWebSummaryPanelProtocol(deps)

    const action = await protocol.openPanel({
      type: 'OPEN_WEB_SUMMARY',
      tabId: 42,
    })

    expect(action).toEqual({ type: 'SUMMARIZE_ACTIVE_PAGE', tabId: 42 })
    expect(deps.openSidePanel).toHaveBeenCalledWith({ tabId: 42 })
    expect(await protocol.consumeReady(42)).toEqual(action)
  })

  it('falls back to the current active tab when the popup omits tabId', async () => {
    const deps = createDeps({ getActiveTabId: vi.fn(() => Promise.resolve(7)) })
    const protocol = createWebSummaryPanelProtocol(deps)

    await protocol.openPanel({ type: 'OPEN_WEB_SUMMARY' })

    expect(deps.getActiveTabId).toHaveBeenCalled()
    expect(deps.openSidePanel).toHaveBeenCalledWith({ tabId: 7 })
  })

  it('rejects when no active tab can be resolved', async () => {
    const protocol = createWebSummaryPanelProtocol(createDeps())

    await expect(
      protocol.openPanel({ type: 'OPEN_WEB_SUMMARY' }),
    ).rejects.toThrow('未找到当前活动标签页。')
  })

  it('consumes pending actions only once', async () => {
    const protocol = createWebSummaryPanelProtocol(createDeps())

    await protocol.openPanel({ type: 'OPEN_WEB_SUMMARY', tabId: 3 })

    expect(protocol.consumeReady(3)).toEqual({
      type: 'SUMMARIZE_ACTIVE_PAGE',
      tabId: 3,
    })
    expect(protocol.consumeReady(3)).toBeNull()
    expect(protocol.consumeReady(undefined)).toBeNull()
  })

  it('keeps pending actions per tab isolated', async () => {
    const protocol = createWebSummaryPanelProtocol(createDeps())

    await protocol.openPanel({ type: 'OPEN_WEB_SUMMARY', tabId: 3 })
    await protocol.openPanel({ type: 'OPEN_WEB_SUMMARY', tabId: 4 })

    expect(protocol.consumeReady(4)).toEqual({
      type: 'SUMMARIZE_ACTIVE_PAGE',
      tabId: 4,
    })
    expect(protocol.consumeReady(3)).toEqual({
      type: 'SUMMARIZE_ACTIVE_PAGE',
      tabId: 3,
    })
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
