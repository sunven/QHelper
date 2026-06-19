import { createRoot, type Root } from 'react-dom/client'
import { DictionaryOverlay } from '@/components/dictionary/DictionaryOverlay'
import '@/components/dictionary/styles.css'
import { ballStore, panelStore } from './stores'
import {
  DEFAULT_DICTIONARY_SETTINGS,
  getDictionarySettings,
  subscribeDictionarySettings,
  type DictionarySettings,
} from './settings'
import { createDictionaryFetchMessage, createYoudaoUrl } from './youdao'
import type { DictionaryData } from './types'

const ROOT_ID = 'qhelper-dictionary-root'
const ENGLISH_SELECTION_RE = /\b[a-zA-Z]{2,}\b/gm

type RuntimeLike = {
  sendMessage: (
    message: unknown,
    callback?: (response: unknown) => void,
  ) => void | Promise<unknown>
}

export type DictionarySelectionDeps = {
  runtime?: RuntimeLike
  createRoot?: (container: Element | DocumentFragment) => Root
}

export type DictionarySelectionControllerDeps = DictionarySelectionDeps & {
  getSettings?: () => Promise<DictionarySettings>
  onSettingsChanged?: (
    listener: (settings: DictionarySettings) => void,
  ) => () => void
}

function isInDictPanel(element: Node | EventTarget | null): boolean {
  if (!element) {
    return false
  }

  const start = element instanceof Node ? element : null
  for (let node: Node | null = start; node; node = node.parentNode) {
    if (node instanceof Element && node.classList.contains('cranberry-panel')) {
      return true
    }
  }

  return false
}

function ensureRoot(
  documentRef: Document,
  createRootFn: (container: Element) => Root,
) {
  const existing = documentRef.getElementById(ROOT_ID)
  if (existing) {
    return { rootElement: existing, reactRoot: undefined }
  }

  const rootElement = documentRef.createElement('div')
  rootElement.id = ROOT_ID
  rootElement.className = 'cranberry-panel'
  documentRef.documentElement.appendChild(rootElement)
  const reactRoot = createRootFn(rootElement)
  reactRoot.render(<DictionaryOverlay />)
  return { rootElement, reactRoot }
}

function parseDictionaryData(response: unknown): DictionaryData | undefined {
  if (typeof response !== 'string') {
    return undefined
  }

  try {
    const data = JSON.parse(response) as unknown
    if (!data || typeof data !== 'object' || Array.isArray(data)) {
      return undefined
    }

    return data as DictionaryData
  } catch {
    return undefined
  }
}

export function installDictionarySelectionLookup(
  windowRef: Window,
  documentRef: Document,
  deps: DictionarySelectionDeps = {},
) {
  const runtime = deps.runtime || chrome.runtime
  const mountedRoot = ensureRoot(documentRef, deps.createRoot || createRoot)

  const handleMouseUp = () => {
    const selection = windowRef.getSelection()
    const text = selection?.toString().trim() || ''
    ENGLISH_SELECTION_RE.lastIndex = 0
    if (!text || !ENGLISH_SELECTION_RE.test(text)) {
      ballStore.setBall({ show: false, onActive: () => undefined })
      return
    }

    const range = selection?.rangeCount ? selection.getRangeAt(0) : undefined
    if (!range) {
      ballStore.setBall({ show: false, onActive: () => undefined })
      return
    }

    const rect = range.getBoundingClientRect()
    const x = rect.right
    const y = rect.top || 0

    ballStore.setBall({
      show: true,
      x,
      y: y - 16,
      onActive: () => {
        ballStore.close()
        panelStore.mergeData({
          show: true,
          x,
          y: y - 80,
          query: text,
          data: undefined,
          range,
        })

        runtime.sendMessage(
          createDictionaryFetchMessage(createYoudaoUrl(text)),
          (response: unknown) => {
            const data = parseDictionaryData(response)
            if (data) {
              panelStore.mergeData({ data })
            }
          },
        )
      },
    })
  }

  const handleMouseDown = (event: MouseEvent) => {
    if (isInDictPanel(event.target)) {
      return
    }
    panelStore.mergeData({ show: false })
  }

  documentRef.addEventListener('mouseup', handleMouseUp)
  documentRef.addEventListener('mousedown', handleMouseDown)

  return () => {
    documentRef.removeEventListener('mouseup', handleMouseUp)
    documentRef.removeEventListener('mousedown', handleMouseDown)
    ballStore.close()
    panelStore.mergeData({ show: false })
    mountedRoot.reactRoot?.unmount()
    if (mountedRoot.reactRoot) {
      mountedRoot.rootElement.remove()
    }
  }
}

export function installDictionarySelectionLookupController(
  windowRef: Window,
  documentRef: Document,
  deps: DictionarySelectionControllerDeps = {},
) {
  const getSettings = deps.getSettings || getDictionarySettings
  const onSettingsChanged =
    deps.onSettingsChanged || subscribeDictionarySettings
  let disposed = false
  let cleanupLookup: (() => void) | undefined

  function applySettings(settings: DictionarySettings) {
    if (disposed) {
      return
    }

    if (settings.selectionLookupEnabled) {
      if (!cleanupLookup) {
        cleanupLookup = installDictionarySelectionLookup(
          windowRef,
          documentRef,
          deps,
        )
      }
      return
    }

    cleanupLookup?.()
    cleanupLookup = undefined
  }

  void getSettings()
    .then(applySettings)
    .catch(() => {
      applySettings(DEFAULT_DICTIONARY_SETTINGS)
    })

  const cleanupSettings = onSettingsChanged(applySettings)

  return () => {
    disposed = true
    cleanupSettings()
    cleanupLookup?.()
    cleanupLookup = undefined
  }
}
