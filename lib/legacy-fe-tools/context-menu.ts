export const COPY_PAGE_TITLE_MENU_ID = 'copy-page-title'

type CopyPageTitleInjection = {
  target: { tabId: number }
  func: (text: string) => void
  args: [string]
}

export type CopyPageTitleContextMenuDeps = {
  removeMenu: (menuId: string) => Promise<void>
  createMenu: (properties: chrome.contextMenus.CreateProperties) => void
  executeScript: (injection: CopyPageTitleInjection) => Promise<unknown>
}

export const defaultCopyPageTitleContextMenuDeps: CopyPageTitleContextMenuDeps = {
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
  executeScript: (injection) => chrome.scripting.executeScript(injection),
}

export async function ensureCopyPageTitleContextMenu(
  deps: Pick<CopyPageTitleContextMenuDeps, 'removeMenu' | 'createMenu'> =
    defaultCopyPageTitleContextMenuDeps,
) {
  await deps.removeMenu(COPY_PAGE_TITLE_MENU_ID)
  deps.createMenu({
    id: COPY_PAGE_TITLE_MENU_ID,
    title: 'copy page title',
    contexts: ['all'],
  })
}

export async function copyPageTitleFromContextClick(
  info: Pick<chrome.contextMenus.OnClickData, 'menuItemId'>,
  tab: Pick<chrome.tabs.Tab, 'id' | 'title'> | undefined,
  deps: Pick<CopyPageTitleContextMenuDeps, 'executeScript'> = defaultCopyPageTitleContextMenuDeps,
): Promise<boolean> {
  if (info.menuItemId !== COPY_PAGE_TITLE_MENU_ID || !tab?.id) {
    return false
  }

  await deps.executeScript({
    target: { tabId: tab.id },
    func: (text: string) => {
      void navigator.clipboard.writeText(text)
    },
    args: [tab.title ?? ''],
  })

  return true
}
