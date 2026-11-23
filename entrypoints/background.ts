import { createAutoRefreshController } from '@/lib/auto-refresh/background'
import { handleDictionaryFetchMessage } from '@/lib/dictionary/background'
import {
  COPY_PAGE_TITLE_MENU_ID,
  copyPageTitleFromContextClick,
  ensureCopyPageTitleContextMenu,
} from '@/lib/fe-tools/context-menu'
import { handleInactiveWarningMessage } from '@/lib/github/inactive-warning-background'
import { handleStarHistorySvgMessage } from '@/lib/github/star-history-background'
import { getErrorMessage } from '@/lib/utils'
import {
  createWebSummaryPanelProtocol,
  ensureWebSummaryContextMenu,
  WEB_SUMMARY_CONTEXT_MENU_ID,
} from '@/lib/web-summary/background'
import type {
  OpenWebSummaryMessage,
  OpenWebSummaryResponse,
  WebSummarySidePanelReadyMessage,
} from '@/types/web-summary'

export default defineBackground(() => {
  const panelProtocol = createWebSummaryPanelProtocol()
  const autoRefresh = createAutoRefreshController()

  void autoRefresh.initialize()

  chrome.alarms.onAlarm.addListener((alarm) => {
    void autoRefresh.handleAlarm(alarm)
  })

  chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    void autoRefresh.handleTabUpdated(tabId, changeInfo, tab)
  })

  chrome.tabs.onRemoved.addListener((tabId) => {
    panelProtocol.clearTab(tabId)
    void autoRefresh.handleTabRemoved(tabId)
  })

  chrome.storage.onChanged.addListener((changes, areaName) => {
    autoRefresh.handleStorageChanged(changes, areaName)
  })

  const syncContextMenus = () => {
    void Promise.all([
      ensureWebSummaryContextMenu(),
      ensureCopyPageTitleContextMenu(),
    ]).catch(() => undefined)
  }

  syncContextMenus()
  chrome.runtime.onInstalled.addListener(() => {
    syncContextMenus()
    void autoRefresh.reconcile()
  })
  chrome.runtime.onStartup.addListener(() => {
    syncContextMenus()
    void autoRefresh.reconcile()
  })
  chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === COPY_PAGE_TITLE_MENU_ID) {
      void copyPageTitleFromContextClick(info, tab).catch(() => undefined)
      return
    }

    if (info.menuItemId !== WEB_SUMMARY_CONTEXT_MENU_ID) {
      return
    }

    void panelProtocol
      .openPanel({
        type: 'OPEN_WEB_SUMMARY',
        tabId: tab?.id,
      })
      .catch(() => undefined)
  })

  chrome.runtime.onMessage.addListener(
    (message: unknown, sender, sendResponse) => {
      if (autoRefresh.handleMessage(message, sender, sendResponse)) {
        return true
      }

      if (handleDictionaryFetchMessage(message, sendResponse)) {
        return true
      }

      if (handleStarHistorySvgMessage(message, sendResponse)) {
        return true
      }

      if (handleInactiveWarningMessage(message, sendResponse)) {
        return true
      }

      if (
        (message as OpenWebSummaryMessage | undefined)?.type ===
        'OPEN_WEB_SUMMARY'
      ) {
        void panelProtocol
          .openPanel(message as OpenWebSummaryMessage)
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

      if (
        (message as WebSummarySidePanelReadyMessage | undefined)?.type ===
        'WEB_SUMMARY_SIDE_PANEL_READY'
      ) {
        const readyMessage = message as WebSummarySidePanelReadyMessage
        sendResponse(
          panelProtocol.consumeReady(readyMessage.tabId ?? sender.tab?.id),
        )
        return false
      }

      return undefined
    },
  )
})
