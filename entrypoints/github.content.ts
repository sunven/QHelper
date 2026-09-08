import { defineContentScript } from 'wxt/utils/define-content-script'
import { installPageHelpers } from '@/lib/page-helper-lifecycle'
import { GITHUB_SITE_PROFILE } from '@/lib/github/site-profile'
import { createGitHubInactiveWarningHelper } from '@/lib/github/inactive-warning-view'
import { createGitHubStarHistoryViewHelper } from '@/lib/github/star-history-view'
import { createGitHubZreadButtonHelper } from '@/lib/github/zread-button'

export default defineContentScript({
  matches: ['*://github.com/*'],
  runAt: 'document_end',
  main() {
    installPageHelpers(window, document, GITHUB_SITE_PROFILE, [
      createGitHubZreadButtonHelper(document),
      createGitHubStarHistoryViewHelper(document),
      createGitHubInactiveWarningHelper(document),
    ])
  },
})
