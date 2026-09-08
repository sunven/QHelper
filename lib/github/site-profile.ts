import type { PageHelperSiteProfile } from '@/lib/page-helper-lifecycle'

/** GitHub 页面的 SPA 导航模型：turbo/pjax 推进 + 浏览器后退前进 */
export const GITHUB_SITE_PROFILE: PageHelperSiteProfile = {
  documentEvents: ['turbo:load', 'pjax:end'],
  windowEvents: ['popstate'],
}
