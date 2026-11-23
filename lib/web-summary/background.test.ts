import { describe, expect, it, vi } from 'vitest'
import {
  createWebSummaryPanelProtocol,
  ensureWebSummaryContextMenu,
  WEB_SUMMARY_CONTEXT_MENU_ID,
  type WebSummaryBackgroundDeps,
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

  it('can be consumed while the sidepanel open promise is still pending', async () => {
    let resolveOpen: () => void = () => undefined
    const deps = createDeps({
      openSidePanel: vi.fn(
        () =>
          new Promise<void>((resolve) => {
            resolveOpen = resolve
          }),
      ),
    })
    const protocol = createWebSummaryPanelProtocol(deps)

    const opening = protocol.openPanel({
      type: 'OPEN_WEB_SUMMARY',
      tabId: 15,
    })

    expect(protocol.consumeReady(15)).toEqual({
      type: 'SUMMARIZE_ACTIVE_PAGE',
      tabId: 15,
    })

    resolveOpen()
    await expect(opening).resolves.toEqual({
      type: 'SUMMARIZE_ACTIVE_PAGE',
      tabId: 15,
    })
  })

  it('notifies an already-mounted sidepanel after opening', async () => {
    const notifyPanel = vi.fn(() => Promise.resolve())
    const protocol = createWebSummaryPanelProtocol(createDeps({ notifyPanel }))

    await protocol.openPanel({ type: 'OPEN_WEB_SUMMARY', tabId: 21 })

    expect(notifyPanel).toHaveBeenCalledWith(21)
  })

  it('keeps the pending action when notifying the panel fails', async () => {
    const notifyPanel = vi.fn(() => Promise.reject(new Error('no receiver')))
    const protocol = createWebSummaryPanelProtocol(createDeps({ notifyPanel }))

    await protocol.openPanel({ type: 'OPEN_WEB_SUMMARY', tabId: 22 })

    expect(protocol.consumeReady(22)).toEqual({
      type: 'SUMMARIZE_ACTIVE_PAGE',
      tabId: 22,
    })
  })

  it('drops the pending action when the sidepanel cannot be opened', async () => {
    const deps = createDeps({
      openSidePanel: vi.fn(() => Promise.reject(new Error('denied'))),
    })
    const protocol = createWebSummaryPanelProtocol(deps)

    await expect(
      protocol.openPanel({ type: 'OPEN_WEB_SUMMARY', tabId: 9 }),
    ).rejects.toThrow('denied')

    expect(protocol.consumeReady(9)).toBeNull()
  })

  it('expires pending actions that are never consumed', async () => {
    let currentTime = 1_000
    const protocol = createWebSummaryPanelProtocol(createDeps(), {
      now: () => currentTime,
      pendingTtlMs: 5_000,
    })

    await protocol.openPanel({ type: 'OPEN_WEB_SUMMARY', tabId: 11 })
    currentTime += 4_999
    expect(protocol.consumeReady(11)).not.toBeNull()

    await protocol.openPanel({ type: 'OPEN_WEB_SUMMARY', tabId: 12 })
    currentTime += 5_000
    expect(protocol.consumeReady(12)).toBeNull()
  })

  it('clears a pending action when its tab closes', async () => {
    const protocol = createWebSummaryPanelProtocol(createDeps())

    await protocol.openPanel({ type: 'OPEN_WEB_SUMMARY', tabId: 13 })
    protocol.clearTab(13)

    expect(protocol.consumeReady(13)).toBeNull()
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
