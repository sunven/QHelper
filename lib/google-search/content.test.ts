import { afterEach, describe, expect, it, vi } from 'vitest'
import { installGoogleSearchOpenInController } from './content'
import { OPEN_IN_WRAPPER_SELECTOR } from './open-in'

const WEB_SEARCH_HREF =
  'https://www.google.com/search?q=facebook%2Freact+github'

function renderSerp(): void {
  document.body.innerHTML = `
    <div id="rso">
      <a href="https://github.com/facebook/react"><h3>facebook/react</h3></a>
    </div>
  `
}

afterEach(() => {
  document.body.innerHTML = ''
  vi.unstubAllGlobals()
})

describe('installGoogleSearchOpenInController', () => {
  it('does not install the helper when the setting is off', async () => {
    vi.stubGlobal('location', new URL(WEB_SEARCH_HREF))
    renderSerp()

    installGoogleSearchOpenInController(window, document, {
      getSettings: () => Promise.resolve({ openInEnabled: false }),
      onSettingsChanged: () => () => undefined,
    })
    await Promise.resolve()

    expect(document.querySelector(OPEN_IN_WRAPPER_SELECTOR)).toBeNull()
  })

  it('installs on enable and removes menus when the setting turns off', async () => {
    vi.stubGlobal('location', new URL(WEB_SEARCH_HREF))
    renderSerp()

    let settingsListener:
      | ((settings: { openInEnabled: boolean }) => void)
      | undefined

    const dispose = installGoogleSearchOpenInController(window, document, {
      getSettings: () => Promise.resolve({ openInEnabled: true }),
      onSettingsChanged: (listener) => {
        settingsListener = listener
        return () => undefined
      },
    })
    await Promise.resolve()

    expect(document.querySelector(OPEN_IN_WRAPPER_SELECTOR)).not.toBeNull()

    settingsListener?.({ openInEnabled: false })
    expect(document.querySelector(OPEN_IN_WRAPPER_SELECTOR)).toBeNull()

    dispose()
  })
})
