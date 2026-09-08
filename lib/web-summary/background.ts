import { getCurrent } from '@/lib/chrome/tabs'
import type {
  OpenWebSummaryMessage,
  WebSummaryPendingAction,
} from '@/types/web-summary'

export const WEB_SUMMARY_CONTEXT_MENU_ID = 'web-summary-context-open'

export type WebSummaryBackgroundDeps = {
  getActiveTabId: () => Promise<number | undefined>
  openSidePanel: (options: { tabId: number }) => Promise<void>
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

export const defaultWebSummaryBackgroundDeps: WebSummaryBackgroundDeps = {
  getActiveTabId: async () => (await getCurrent())?.id,
  openSidePanel,
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
  openPanel: (message: OpenWebSummaryMessage) => Promise<WebSummaryPendingAction>
  /** Side Panel 就绪后领取该标签页的待执行动作，领取即删除 */
  consumeReady: (tabId: number | undefined) => WebSummaryPendingAction | null
}

/**
 * Web Summary 面板握手：pendingActions 状态自持在实例内，
 * 调用方（background entrypoint）只做消息接线。
 */
export function createWebSummaryPanelProtocol(
  deps: WebSummaryBackgroundDeps = defaultWebSummaryBackgroundDeps,
): WebSummaryPanelProtocol {
  const pendingActions = new Map<number, WebSummaryPendingAction>()

  return {
    async openPanel(message) {
      const tabId = message.tabId ?? (await deps.getActiveTabId())
      if (!tabId) {
        throw new Error('未找到当前活动标签页。')
      }

      const pendingAction: WebSummaryPendingAction = {
        type: 'SUMMARIZE_ACTIVE_PAGE',
        tabId,
      }

      pendingActions.set(tabId, pendingAction)
      await deps.openSidePanel({ tabId })

      return pendingAction
    },

    consumeReady(tabId) {
      if (!tabId) {
        return null
      }

      const action = pendingActions.get(tabId) ?? null
      if (action) {
        pendingActions.delete(tabId)
      }

      return action
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
