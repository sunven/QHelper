import { beforeEach, describe, expect, it, vi } from 'vitest'

const { installMarkdownFilePreview } = vi.hoisted(() => ({
  installMarkdownFilePreview: vi.fn(),
}))

vi.mock('wxt/utils/define-content-script', () => ({
  defineContentScript: <T>(config: T) => config,
}))

vi.mock('@/lib/markdown-file-preview/preview', () => ({
  installMarkdownFilePreview,
}))

import markdownFileContentScript from '../entrypoints/markdown-file.content'

describe('entrypoints/markdown-file.content.ts', () => {
  beforeEach(() => {
    installMarkdownFilePreview.mockClear()
  })

  it('registers the local markdown file preview content script and delegates to the installer', () => {
    expect(markdownFileContentScript.matches).toEqual(['file:///*'])
    expect(markdownFileContentScript.runAt).toBe('document_idle')

    markdownFileContentScript.main({} as never)

    expect(installMarkdownFilePreview).toHaveBeenCalledWith(window, document)
  })
})
