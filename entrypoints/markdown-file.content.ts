import { installMarkdownFilePreview } from '@/lib/markdown-file-preview/preview'
import { defineContentScript } from 'wxt/utils/define-content-script'

export default defineContentScript({
  matches: ['file:///*'],
  runAt: 'document_idle',
  main() {
    installMarkdownFilePreview(window, document)
  },
})
