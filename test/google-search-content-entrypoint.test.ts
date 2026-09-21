import { beforeEach, describe, expect, it, vi } from 'vitest'

const { installGoogleSearchOpenInController } = vi.hoisted(() => ({
  installGoogleSearchOpenInController: vi.fn(),
}))

vi.mock('wxt/utils/define-content-script', () => ({
  defineContentScript: <T>(config: T) => config,
}))

vi.mock('@/lib/google-search/content', () => ({
  installGoogleSearchOpenInController,
}))

import googleSearchContentScript, {
  GOOGLE_SEARCH_INCLUDE_GLOBS,
} from '../entrypoints/google-search.content'

describe('entrypoints/google-search.content.ts', () => {
  beforeEach(() => {
    installGoogleSearchOpenInController.mockClear()
  })

  it('registers the Google search content script and delegates to the installer', () => {
    expect(googleSearchContentScript.matches).toEqual(['*://*/*'])
    expect(googleSearchContentScript.includeGlobs).toEqual(
      GOOGLE_SEARCH_INCLUDE_GLOBS,
    )
    expect(googleSearchContentScript.runAt).toBe('document_end')

    googleSearchContentScript.main({} as never)

    expect(installGoogleSearchOpenInController).toHaveBeenCalledWith(
      window,
      document,
    )
  })
})
