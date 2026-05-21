import { defineContentScript } from 'wxt/utils/define-content-script';
import { installGitHubStarHistoryView } from '@/lib/github/star-history-view';
import { installGitHubZreadButton } from '@/lib/github/zread-button';

export default defineContentScript({
  matches: ['*://github.com/*'],
  runAt: 'document_end',
  main() {
    installGitHubZreadButton(window, document);
    installGitHubStarHistoryView(window, document);
  },
});
