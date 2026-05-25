import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  installV2exBase64Overlay,
  installV2exBase64OverlayController,
} from './content'

vi.mock('@/components/v2ex-base64/styles.css?inline', () => ({
  default: '.qhelper-v2ex-base64{}',
}))

describe('v2ex-base64/content', () => {
  beforeEach(() => {
    document.documentElement.innerHTML = '<head></head><body></body>'
  })

  it('does not mount when empty', () => {
    const root = {
      render: vi.fn(),
      unmount: vi.fn(),
    }
    const overlay = installV2exBase64Overlay(document, {
      createRoot: () => root,
    })

    overlay.renderOverlay({ entries: [] })

    expect(root.render).not.toHaveBeenCalled()
    expect(
      document.querySelector('[data-qhelper-v2ex-base64-root="true"]'),
    ).not.toBeInTheDocument()
  })

  it('mounts entries into a closed shadow root host', () => {
    const attachShadow = vi.spyOn(HTMLElement.prototype, 'attachShadow')
    const root = {
      render: vi.fn(),
      unmount: vi.fn(),
    }
    const overlay = installV2exBase64Overlay(document, {
      createRoot: () => root,
    })

    overlay.renderOverlay({
      entries: ['user@example.com'],
    })

    expect(attachShadow).toHaveBeenCalledWith({ mode: 'closed' })
    expect(
      document.querySelector('[data-qhelper-v2ex-base64-root="true"]'),
    ).toBeInTheDocument()
    expect(root.render).toHaveBeenCalledOnce()
    expect(document.body).not.toHaveTextContent('user@example.com')
  })

  it('updates and unmounts when settings change', async () => {
    const root = {
      render: vi.fn(),
      unmount: vi.fn(),
    }
    const unsubscribe = vi.fn()
    let listener: ((settings: { entries: string[] }) => void) | undefined
    const cleanup = installV2exBase64OverlayController(window, document, {
      createRoot: () => root,
      getSettings: async () => ({
        entries: ['user@example.com'],
      }),
      onSettingsChanged: (nextListener) => {
        listener = nextListener
        return unsubscribe
      },
    })

    await vi.waitFor(() => {
      expect(root.render).toHaveBeenCalledOnce()
    })

    listener?.({ entries: [] })

    expect(root.unmount).toHaveBeenCalledOnce()
    cleanup()
    expect(unsubscribe).toHaveBeenCalledOnce()
  })
})
