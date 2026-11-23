import { getCurrent } from '@/lib/chrome/tabs'
import type {
  OpenWebSummaryMessage,
  WebSummaryOpenRequestedMessage,
  WebSummaryPendingAction,
} from '@/types/web-summary'

export const WEB_SUMMARY_CONTEXT_MENU_ID = 'web-summary-context-open'

export type WebSummaryBackgroundDeps = {
  getActiveTabId: () => Promise<number | undefined>
  openSidePanel: (options: { tabId: number }) => Promise<void>
  notifyPanel?: (tabId: number) => Promise<void>
}

export type WebSummaryContextMenuDeps = {
  removeMenu: (menuId: string) => Promise<void>
  createMenu: (properties: chrome.contextMenus.CreateProperties) => void
}

async function openSidePanel(options: { tabId: number }) {
  if (!chrome.sidePanel?.open) {
    throw new Error('当前浏览器不支持 Side Panel API。')
  }

  await chrome.sidePanel.open(options)
}

async function notifyPanelOpen(tabId: number): Promise<void> {
  try {
    await chrome.runtime.sendMessage({
      type: 'WEB_SUMMARY_OPEN_REQUESTED',
      tabId,
    } satisfies WebSummaryOpenRequestedMessage)
  } catch {
    // The panel may still be mounting; its READY bootstrap consumes the action.
  }
}

export const defaultWebSummaryBackgroundDeps: WebSummaryBackgroundDeps = {
  getActiveTabId: async () => (await getCurrent())?.id,
  openSidePanel,
  notifyPanel: notifyPanelOpen,
}

export const defaultWebSummaryContextMenuDeps: WebSummaryContextMenuDeps = {
  removeMenu: (menuId) =>
    new Promise((resolve) => {
      chrome.contextMenus.remove(menuId, () => {
        void chrome.runtime.lastError
        resolve()
      })
    }),
  createMenu: (properties) => {
    chrome.contextMenus.create(properties)
  },
}

export type WebSummaryPanelProtocol = {
  /** 打开（或重新聚焦）某标签页的 Side Panel，并登记该页待执行的总结动作 */
  openPanel: (
    message: OpenWebSummaryMessage,
  ) => Promise<WebSummaryPendingAction>
  /** Side Panel 就绪后领取该标签页的待执行动作，领取即删除 */
  consumeReady: (tabId: number | undefined) => WebSummaryPendingAction | null
  /** 标签页关闭时丢弃其待执行动作 */
  clearTab: (tabId: number) => void
}

export type WebSummaryPanelProtocolOptions = {
  now?: () => number
  pendingTtlMs?: number
}

// 只允许面板刚被请求打开时消费，避免失败/关闭后的陈旧动作自动上传网页内容。
const WEB_SUMMARY_PENDING_ACTION_TTL_MS = 30_000

type PendingActionEntry = {
  action: WebSummaryPendingAction
  expiresAt: number
}

/**
 * Web Summary 面板握手：pendingActions 状态自持在实例内，
 * 调用方（background entrypoint）只做消息接线。
 */
export function createWebSummaryPanelProtocol(
  deps: WebSummaryBackgroundDeps = defaultWebSummaryBackgroundDeps,
  options: WebSummaryPanelProtocolOptions = {},
): WebSummaryPanelProtocol {
  const now = options.now ?? Date.now
  const pendingTtlMs = options.pendingTtlMs ?? WEB_SUMMARY_PENDING_ACTION_TTL_MS
  const pendingActions = new Map<number, PendingActionEntry>()

  const pruneExpired = () => {
    const currentTime = now()
    for (const [tabId, entry] of pendingActions) {
      if (entry.expiresAt <= currentTime) {
        pendingActions.delete(tabId)
      }
    }
  }

  return {
    async openPanel(message) {
      const tabId = message.tabId ?? (await deps.getActiveTabId())
      if (!tabId) {
        throw new Error('未找到当前活动标签页。')
      }

      pruneExpired()

      const pendingAction: WebSummaryPendingAction = {
        type: 'SUMMARIZE_ACTIVE_PAGE',
        tabId,
      }
      const entry: PendingActionEntry = {
        action: pendingAction,
        expiresAt: now() + pendingTtlMs,
      }
      pendingActions.set(tabId, entry)

      try {
        await deps.openSidePanel({ tabId })
      } catch (error) {
        if (pendingActions.get(tabId) === entry) {
          pendingActions.delete(tabId)
        }
        throw error
      }

      await deps.notifyPanel?.(tabId).catch(() => undefined)

      return pendingAction
    },

    consumeReady(tabId) {
      if (!tabId) {
        return null
      }

      pruneExpired()

      const entry = pendingActions.get(tabId)
      if (!entry) {
        return null
      }

      pendingActions.delete(tabId)
      return entry.action
    },

    clearTab(tabId) {
      pendingActions.delete(tabId)
    },
  }
}

export async function ensureWebSummaryContextMenu(
  deps: WebSummaryContextMenuDeps = defaultWebSummaryContextMenuDeps,
) {
  await deps.removeMenu(WEB_SUMMARY_CONTEXT_MENU_ID)
  deps.createMenu({
    id: WEB_SUMMARY_CONTEXT_MENU_ID,
    title: '使用 QHelper 总结当前网页',
    contexts: ['all'],
    documentUrlPatterns: ['http://*/*', 'https://*/*'],
  })
}
