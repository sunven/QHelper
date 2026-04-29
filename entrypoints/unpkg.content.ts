import { defineContentScript } from 'wxt/utils/define-content-script';
import { installUnpkgCopyActions } from '@/lib/unpkg/copy-actions';

export default defineContentScript({
  matches: [
    'https://www.unpkg.com/browse/*',
    'https://unpkg.com/browse/*',
    'https://app.unpkg.com/*',
  ],
  runAt: 'document_end',
  main() {
    installUnpkgCopyActions(window, document);
  },
});
