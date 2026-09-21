import { defineContentScript } from 'wxt/utils/define-content-script'
import { installGoogleSearchOpenInController } from '@/lib/google-search/content'

export const GOOGLE_SEARCH_INCLUDE_GLOBS = [
  '*://google.*/search*',
  '*://www.google.*/search*',
]

export default defineContentScript({
  matches: ['*://*/*'],
  includeGlobs: GOOGLE_SEARCH_INCLUDE_GLOBS,
  runAt: 'document_end',
  main() {
    installGoogleSearchOpenInController(window, document)
  },
})
