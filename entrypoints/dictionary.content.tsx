import { defineContentScript } from 'wxt/utils/define-content-script'
import { installDictionarySelectionLookup } from '@/lib/dictionary/content'

export default defineContentScript({
  matches: ['<all_urls>'],
  runAt: 'document_end',
  main() {
    installDictionarySelectionLookup(window, document)
  },
})

