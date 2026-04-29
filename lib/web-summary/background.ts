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

async function getActiveTabId(): Promise<number | undefined> {
  const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true })
  return activeTab?.id
}

async function openSidePanel(options: { tabId: number }) {
  if (!chrome.sidePanel?.open) {
    throw new Error('当前浏览器不支持 Side Panel API。')
  }

  await chrome.sidePanel.open(options)
}

export const defaultWebSummaryBackgroundDeps: WebSummaryBackgroundDeps = {
  getActiveTabId,
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

export async function openWebSummaryPanel(
  message: OpenWebSummaryMessage,
  pendingActions: Map<number, WebSummaryPendingAction>,
  deps: WebSummaryBackgroundDeps = defaultWebSummaryBackgroundDeps,
): Promise<WebSummaryPendingAction> {
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

export function consumePendingWebSummaryAction(
  tabId: number | undefined,
  pendingActions: Map<number, WebSummaryPendingAction>,
): WebSummaryPendingAction | null {
  if (!tabId) {
    return null
  }

  const action = pendingActions.get(tabId) ?? null
  if (action) {
    pendingActions.delete(tabId)
  }

  return action
}
