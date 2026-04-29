import { extractPageContent } from '@/lib/web-summary/content'
import type { WebSummaryExtractPageMessage } from '@/types/web-summary'
import { defineContentScript } from 'wxt/utils/define-content-script'

export default defineContentScript({
  matches: ['<all_urls>'],
  runAt: 'document_idle',
  main() {
    chrome.runtime.onMessage.addListener((message: unknown, _sender, sendResponse) => {
      if ((message as WebSummaryExtractPageMessage | undefined)?.type !== 'WEB_SUMMARY_EXTRACT_PAGE') {
        return undefined
      }

      sendResponse(extractPageContent(window, document))
      return true
    })
  },
})
