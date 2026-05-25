import { beforeEach, describe, expect, it, vi } from 'vitest'

const { installV2exBase64OverlayController } = vi.hoisted(() => ({
  installV2exBase64OverlayController: vi.fn(),
}))

vi.mock('wxt/utils/define-content-script', () => ({
  defineContentScript: <T>(config: T) => config,
}))

vi.mock('@/lib/v2ex-base64/content', () => ({
  installV2exBase64OverlayController,
}))

import v2exBase64ContentScript from '../entrypoints/v2ex-base64.content'

describe('entrypoints/v2ex-base64.content.tsx', () => {
  beforeEach(() => {
    installV2exBase64OverlayController.mockClear()
  })

  it('registers only on V2EX and delegates to the installer', () => {
    expect(v2exBase64ContentScript.matches).toEqual(['*://www.v2ex.com/*'])
    expect(v2exBase64ContentScript.runAt).toBe('document_end')

    v2exBase64ContentScript.main({} as never)

    expect(installV2exBase64OverlayController).toHaveBeenCalledWith(
      window,
      document,
    )
  })
})
