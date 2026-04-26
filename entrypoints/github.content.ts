import { defineContentScript } from 'wxt/utils/define-content-script';
import { installGitHubZreadButton } from '@/lib/github/zread-button';

export default defineContentScript({
  matches: ['*://github.com/*'],
  runAt: 'document_end',
  main() {
    installGitHubZreadButton(window, document);
  },
});
