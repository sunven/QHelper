import { defineContentScript } from 'wxt/utils/define-content-script';
import { installRepositoryPageHelpers } from '@/lib/github/repository-page-helper';
import { createGitHubStarHistoryViewHelper } from '@/lib/github/star-history-view';
import { createGitHubZreadButtonHelper } from '@/lib/github/zread-button';

export default defineContentScript({
  matches: ['*://github.com/*'],
  runAt: 'document_end',
  main() {
    installRepositoryPageHelpers(window, document, [
      createGitHubZreadButtonHelper(document),
      createGitHubStarHistoryViewHelper(document),
    ]);
  },
});
