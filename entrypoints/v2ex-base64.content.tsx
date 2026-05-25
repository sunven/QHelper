import { defineContentScript } from 'wxt/utils/define-content-script'
import { installV2exBase64OverlayController } from '@/lib/v2ex-base64/content'

export default defineContentScript({
  matches: ['*://www.v2ex.com/*'],
  runAt: 'document_end',
  main() {
    installV2exBase64OverlayController(window, document)
  },
})
