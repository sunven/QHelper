import { installPageHelpers } from '@/lib/page-helper-lifecycle'
import { type SettingWatchDeps, watchSetting } from '@/lib/settings'
import {
  closeOpenInMenus,
  createGoogleSearchOpenInHelper,
  GOOGLE_SEARCH_SITE_PROFILE,
  OPEN_IN_WRAPPER_SELECTOR,
  removeInjectedOpenInMenus,
} from './open-in'
import { type GoogleSearchSettings, googleSearchSettings } from './settings'

export type GoogleSearchContentDeps = SettingWatchDeps<GoogleSearchSettings>

export function installGoogleSearchOpenInController(
  windowRef: Window,
  documentRef: Document,
  deps: GoogleSearchContentDeps = {},
): () => void {
  let disposeHelpers: (() => void) | undefined

  const handleDocumentClick = (event: MouseEvent) => {
    if (
      event.target instanceof Element &&
      event.target.closest(OPEN_IN_WRAPPER_SELECTOR)
    ) {
      return
    }

    closeOpenInMenus(documentRef)
  }

  const stopHelpers = () => {
    if (disposeHelpers) {
      documentRef.removeEventListener('click', handleDocumentClick)
      disposeHelpers()
      disposeHelpers = undefined
    }
    removeInjectedOpenInMenus(documentRef)
  }

  const disposeWatch = watchSetting(
    googleSearchSettings,
    (settings) => {
      if (settings.openInEnabled) {
        if (!disposeHelpers) {
          documentRef.addEventListener('click', handleDocumentClick)
          disposeHelpers = installPageHelpers(
            windowRef,
            documentRef,
            GOOGLE_SEARCH_SITE_PROFILE,
            [createGoogleSearchOpenInHelper(windowRef, documentRef)],
          )
        }
        return
      }

      stopHelpers()
    },
    deps,
  )

  return () => {
    disposeWatch()
    stopHelpers()
  }
}
