import { defineContentScript } from 'wxt/utils/define-content-script';
import { installPageHelpers } from '@/lib/page-helper-lifecycle';
import { createZreadGithubLinkHelper } from '@/lib/zread/github-link';

/** Zread 的 SPA 导航只推进浏览器历史，没有 turbo/pjax 事件 */
const ZREAD_SITE_PROFILE = {
  windowEvents: ['popstate'],
};

export default defineContentScript({
  matches: ['*://zread.ai/*'],
  runAt: 'document_end',
  main() {
    installPageHelpers(window, document, ZREAD_SITE_PROFILE, [
      createZreadGithubLinkHelper(document),
    ]);
  },
});
