import { beforeEach, describe, expect, it, vi } from 'vitest'

const { installDictionarySelectionLookupController } = vi.hoisted(() => ({
  installDictionarySelectionLookupController: vi.fn(),
}))

vi.mock('wxt/utils/define-content-script', () => ({
  defineContentScript: <T>(config: T) => config,
}))

vi.mock('@/lib/dictionary/content', () => ({
  installDictionarySelectionLookupController,
}))

import dictionaryContentScript from '../entrypoints/dictionary.content'

describe('entrypoints/dictionary.content.tsx', () => {
  beforeEach(() => {
    installDictionarySelectionLookupController.mockClear()
  })

  it('registers the dictionary content script on all pages and delegates to the installer', () => {
    expect(dictionaryContentScript.matches).toEqual(['<all_urls>'])
    expect(dictionaryContentScript.runAt).toBe('document_end')

    dictionaryContentScript.main({} as never)

    expect(installDictionarySelectionLookupController).toHaveBeenCalledWith(
      window,
      document,
    )
  })
})
