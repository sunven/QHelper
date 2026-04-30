import {
  consumePendingWebSummaryAction,
  ensureWebSummaryContextMenu,
  openWebSummaryPanel,
  WEB_SUMMARY_CONTEXT_MENU_ID,
} from '@/lib/web-summary/background'
import {
  COPY_PAGE_TITLE_MENU_ID,
  copyPageTitleFromContextClick,
  ensureCopyPageTitleContextMenu,
} from '@/lib/legacy-fe-tools/context-menu'
import type {
  OpenWebSummaryMessage,
  OpenWebSummaryResponse,
  WebSummarySidePanelReadyMessage,
} from '@/types/web-summary'

const pendingActions = new Map()

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message
  }

  return '未知错误'
}

export default defineBackground(() => {
  const syncContextMenus = () => {
    void Promise.all([
      ensureWebSummaryContextMenu(),
      ensureCopyPageTitleContextMenu(),
    ]).catch(() => undefined)
  }

  syncContextMenus()
  chrome.runtime.onInstalled.addListener(syncContextMenus)
  chrome.runtime.onStartup.addListener(syncContextMenus)
  chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === COPY_PAGE_TITLE_MENU_ID) {
      void copyPageTitleFromContextClick(info, tab).catch(() => undefined)
      return
    }

    if (info.menuItemId !== WEB_SUMMARY_CONTEXT_MENU_ID) {
      return
    }

    void openWebSummaryPanel(
      {
        type: 'OPEN_WEB_SUMMARY',
        tabId: tab?.id,
      },
      pendingActions,
    ).catch(() => undefined)
  })

  chrome.runtime.onMessage.addListener((message: unknown, sender, sendResponse) => {
    if ((message as OpenWebSummaryMessage | undefined)?.type === 'OPEN_WEB_SUMMARY') {
      void openWebSummaryPanel(
        message as OpenWebSummaryMessage,
        pendingActions,
      )
        .then((action) => {
          const response: OpenWebSummaryResponse = {
            ok: true,
            tabId: action.tabId,
          }
          sendResponse(response)
        })
        .catch((error) => {
          const response: OpenWebSummaryResponse = {
            ok: false,
            error: getErrorMessage(error),
          }
          sendResponse(response)
        })

      return true
    }

    if ((message as WebSummarySidePanelReadyMessage | undefined)?.type === 'WEB_SUMMARY_SIDE_PANEL_READY') {
      const readyMessage = message as WebSummarySidePanelReadyMessage
      sendResponse(
        consumePendingWebSummaryAction(
          readyMessage.tabId ?? sender.tab?.id,
          pendingActions,
        ),
      )
      return false
    }

    return undefined
  })
})
