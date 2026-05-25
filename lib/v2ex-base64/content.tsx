import { createRoot, type Root } from 'react-dom/client'
import { V2exBase64Overlay } from '@/components/v2ex-base64/V2exBase64Overlay'
import overlayStyles from '@/components/v2ex-base64/styles.css?inline'
import {
  DEFAULT_V2EX_BASE64_SETTINGS,
  getV2exBase64Settings,
  subscribeV2exBase64Settings,
  type V2exBase64Settings,
} from './settings'

const ROOT_ATTRIBUTE = 'data-qhelper-v2ex-base64-root'

export type V2exBase64ContentDeps = {
  createRoot?: (container: Element | DocumentFragment) => Root
  getSettings?: () => Promise<V2exBase64Settings>
  onSettingsChanged?: (
    listener: (settings: V2exBase64Settings) => void,
  ) => () => void
}

function removeExistingRoots(documentRef: Document): void {
  documentRef
    .querySelectorAll(`[${ROOT_ATTRIBUTE}="true"]`)
    .forEach((element) => {
      element.remove()
    })
}

function createOverlayHost(documentRef: Document) {
  const host = documentRef.createElement('div')
  host.setAttribute(ROOT_ATTRIBUTE, 'true')
  const shadowRoot = host.attachShadow({ mode: 'closed' })
  const style = documentRef.createElement('style')
  style.textContent = overlayStyles
  const mount = documentRef.createElement('div')

  shadowRoot.append(style, mount)
  documentRef.documentElement.appendChild(host)

  return { host, mount }
}

export function installV2exBase64Overlay(
  documentRef: Document,
  deps: V2exBase64ContentDeps = {},
) {
  const createRootFn = deps.createRoot || createRoot
  let mounted:
    | {
        host: HTMLElement
        root: Root
      }
    | undefined

  function unmountOverlay() {
    mounted?.root.unmount()
    mounted?.host.remove()
    mounted = undefined
  }

  function renderOverlay(settings: V2exBase64Settings) {
    if (settings.entries.length === 0) {
      unmountOverlay()
      return
    }

    if (!mounted) {
      removeExistingRoots(documentRef)
      const { host, mount } = createOverlayHost(documentRef)
      mounted = {
        host,
        root: createRootFn(mount),
      }
    }

    mounted.root.render(<V2exBase64Overlay entries={settings.entries} />)
  }

  return {
    renderOverlay,
    unmountOverlay,
  }
}

export function installV2exBase64OverlayController(
  _windowRef: Window,
  documentRef: Document,
  deps: V2exBase64ContentDeps = {},
) {
  const getSettings = deps.getSettings || getV2exBase64Settings
  const onSettingsChanged =
    deps.onSettingsChanged || subscribeV2exBase64Settings
  const overlay = installV2exBase64Overlay(documentRef, deps)
  let disposed = false

  function applySettings(settings: V2exBase64Settings) {
    if (disposed) {
      return
    }

    overlay.renderOverlay(settings)
  }

  void getSettings()
    .then(applySettings)
    .catch(() => {
      applySettings(DEFAULT_V2EX_BASE64_SETTINGS)
    })

  const unsubscribeSettings = onSettingsChanged(applySettings)

  return () => {
    disposed = true
    unsubscribeSettings()
    overlay.unmountOverlay()
  }
}
