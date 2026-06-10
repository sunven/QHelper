import { defineContentScript } from 'wxt/utils/define-content-script';
import { installZreadGithubLink } from '@/lib/zread/github-link';

export default defineContentScript({
  matches: ['*://zread.ai/*'],
  runAt: 'document_end',
  main() {
    installZreadGithubLink(window, document);
  },
});
