import {
  parseRepositoryUrl,
  type RepoCoordinates,
} from '@/lib/github/repository'
import type {
  PageHelperAdapter,
  PageHelperSiteProfile,
} from '@/lib/page-helper-lifecycle'

export const OPEN_IN_WRAPPER_SELECTOR =
  '[data-qhelper-repository-result="true"]'
export const GOOGLE_SEARCH_SITE_PROFILE: PageHelperSiteProfile = {
  windowEvents: ['popstate'],
}

const EXCLUDED_MODULE_SELECTOR = [
  '#tads',
  '#tadsb',
  '#bottomads',
  '#rhs',
  '[data-text-ad]',
  '.uEierd',
  '.kp-wholepage',
  '.related-question-pair',
  '[aria-label="Ads"]',
  '[aria-label="广告"]',
].join(', ')

export type SearchPageLocation = Pick<
  Location,
  'hostname' | 'pathname' | 'search'
>

export function isGoogleWebSearchPage(location: SearchPageLocation): boolean {
  if (!isGoogleWebSearchHost(location.hostname)) {
    return false
  }

  const pathname = location.pathname.replace(/\/+$/, '') || '/'
  if (pathname !== '/search') {
    return false
  }

  const params = new URLSearchParams(location.search)
  if (params.get('tbm')) {
    return false
  }

  const udm = params.get('udm')
  return !udm || udm === '14'
}

export function unwrapResultHref(href: string): string {
  try {
    const url = new URL(href, 'https://www.google.com/')
    if (url.pathname === '/url') {
      const target = url.searchParams.get('q') ?? url.searchParams.get('url')
      if (target) {
        return target
      }
    }

    return url.href
  } catch {
    return href
  }
}

function isGoogleWebSearchHost(hostname: string): boolean {
  const host = hostname.toLowerCase()
  return (
    host === 'google.com' ||
    host.startsWith('google.') ||
    host.startsWith('www.google.')
  )
}

function findMainResultsRoot(doc: Document): Element | null {
  return (
    doc.querySelector('#rso') ??
    doc.querySelector('#search') ??
    doc.querySelector('#center_col')
  )
}

function isExcludedModule(element: Element): boolean {
  return element.closest(EXCLUDED_MODULE_SELECTOR) !== null
}

function findTitleHeading(link: HTMLAnchorElement): HTMLHeadingElement | null {
  if (link.parentElement?.tagName === 'H3') {
    return link.parentElement as HTMLHeadingElement
  }

  return link.querySelector('h3')
}

export function findOrganicTitleLinks(doc: Document): HTMLAnchorElement[] {
  const root = findMainResultsRoot(doc)
  if (!root) {
    return []
  }

  const links: HTMLAnchorElement[] = []
  for (const heading of root.querySelectorAll('h3')) {
    if (isExcludedModule(heading)) {
      continue
    }

    const link = heading.closest('a') ?? heading.querySelector('a')
    if (!(link instanceof HTMLAnchorElement) || isExcludedModule(link)) {
      continue
    }

    links.push(link)
  }

  return links
}

export function removeInjectedOpenInMenus(doc: Document): void {
  doc.querySelectorAll(OPEN_IN_WRAPPER_SELECTOR).forEach((element) => {
    element.remove()
  })
}

function buildZreadUrl({ owner, repo }: RepoCoordinates): string {
  return `https://zread.ai/${owner}/${repo}`
}

function buildDeepWikiUrl({ owner, repo }: RepoCoordinates): string {
  return `https://deepwiki.com/${owner}/${repo}`
}

function buildGithubDevUrl({ owner, repo }: RepoCoordinates): string {
  return `https://github.dev/${owner}/${repo}`
}

function createMenuLink(
  doc: Document,
  href: string,
  label: string,
  linkId: string,
): HTMLAnchorElement {
  const anchor = doc.createElement('a')
  anchor.href = href
  anchor.target = '_blank'
  anchor.rel = 'noopener noreferrer'
  anchor.dataset.qhelperReaderLink = linkId
  anchor.setAttribute('role', 'menuitem')
  anchor.textContent = label
  anchor.style.display = 'block'
  anchor.style.padding = '6px 12px'
  anchor.style.color = '#202124'
  anchor.style.textDecoration = 'none'
  anchor.style.fontSize = '13px'
  anchor.style.lineHeight = '1.4'
  anchor.addEventListener('click', (event) => {
    event.stopPropagation()
  })
  return anchor
}

function createOpenInMenu(
  doc: Document,
  repo: RepoCoordinates,
): HTMLSpanElement {
  const wrapper = doc.createElement('span')
  wrapper.dataset.qhelperRepositoryResult = 'true'
  wrapper.dataset.qhelperRepo = `${repo.owner}/${repo.repo}`
  wrapper.style.display = 'inline-block'
  wrapper.style.position = 'relative'
  wrapper.style.verticalAlign = 'middle'
  wrapper.style.marginLeft = '6px'
  wrapper.style.lineHeight = '0'

  const button = doc.createElement('button')
  button.type = 'button'
  button.setAttribute('aria-label', 'Open in')
  button.setAttribute('aria-haspopup', 'menu')
  button.setAttribute('aria-expanded', 'false')
  button.style.width = '22px'
  button.style.height = '22px'
  button.style.padding = '0'
  button.style.border = '1px solid #dadce0'
  button.style.borderRadius = '4px'
  button.style.background = '#fff'
  button.style.color = '#5f6368'
  button.style.cursor = 'pointer'
  button.style.lineHeight = '0'
  button.innerHTML =
    '<svg width="12" height="12" viewBox="0 0 16 16" aria-hidden="true"><path fill="currentColor" d="M6.5 3.5H3.75A1.75 1.75 0 0 0 2 5.25v6.5c0 .97.78 1.75 1.75 1.75h6.5A1.75 1.75 0 0 0 12 11.75V9H10.5v2.75a.25.25 0 0 1-.25.25h-6.5a.25.25 0 0 1-.25-.25v-6.5a.25.25 0 0 1 .25-.25H6.5Zm3-1.5H14v4.5h-1.5V4.56L7.78 9.28 6.72 8.22l4.72-4.72H9.5Z"/></svg>'

  const menu = doc.createElement('div')
  menu.hidden = true
  menu.dataset.qhelperOpenInMenu = 'true'
  menu.setAttribute('role', 'menu')
  menu.style.position = 'absolute'
  menu.style.zIndex = '10000'
  menu.style.left = '0'
  menu.style.top = '100%'
  menu.style.marginTop = '4px'
  menu.style.minWidth = '148px'
  menu.style.background = '#fff'
  menu.style.border = '1px solid #dadce0'
  menu.style.borderRadius = '8px'
  menu.style.boxShadow = '0 2px 6px rgba(32, 33, 36, 0.16)'
  menu.style.padding = '6px 0'
  menu.append(
    createMenuLink(doc, buildZreadUrl(repo), 'Zread', 'zread'),
    createMenuLink(doc, buildDeepWikiUrl(repo), 'DeepWiki', 'deepwiki'),
    createMenuLink(doc, buildGithubDevUrl(repo), 'github.dev', 'github-dev'),
  )

  const toggle = (event: Event) => {
    event.preventDefault()
    event.stopPropagation()
    const willOpen = menu.hidden
    closeOpenInMenus(doc)
    if (willOpen) {
      menu.hidden = false
      button.setAttribute('aria-expanded', 'true')
    }
  }

  button.addEventListener('click', toggle)
  button.addEventListener('mousedown', (event) => {
    event.preventDefault()
    event.stopPropagation()
  })
  button.addEventListener('pointerdown', (event) => {
    event.stopPropagation()
  })

  wrapper.append(button, menu)
  wrapper.addEventListener('click', (event) => {
    event.preventDefault()
    event.stopPropagation()
  })

  return wrapper
}

function insertOpenInMenu(
  heading: HTMLHeadingElement,
  menu: HTMLElement,
): void {
  const nestedLink = [...heading.children].find(
    (child): child is HTMLAnchorElement => child instanceof HTMLAnchorElement,
  )
  if (nestedLink) {
    nestedLink.after(menu)
    return
  }

  heading.append(menu)
}

function matchingOrganicTitles(doc: Document): Array<{
  heading: HTMLHeadingElement
  repo: RepoCoordinates
}> {
  const matches: Array<{ heading: HTMLHeadingElement; repo: RepoCoordinates }> =
    []

  for (const link of findOrganicTitleLinks(doc)) {
    const heading = findTitleHeading(link)
    const repo = parseRepositoryUrl(unwrapResultHref(link.href))
    if (!heading || !repo) {
      continue
    }

    matches.push({ heading, repo })
  }

  return matches
}

export function closeOpenInMenus(doc: Document): void {
  doc
    .querySelectorAll<HTMLElement>(
      `${OPEN_IN_WRAPPER_SELECTOR} [data-qhelper-open-in-menu]`,
    )
    .forEach((menu) => {
      menu.hidden = true
    })
  doc
    .querySelectorAll(
      `${OPEN_IN_WRAPPER_SELECTOR} button[aria-expanded="true"]`,
    )
    .forEach((button) => {
      button.setAttribute('aria-expanded', 'false')
    })
}

export function syncGoogleSearchOpenIn(
  doc: Document,
  location: SearchPageLocation,
): boolean {
  removeInjectedOpenInMenus(doc)

  if (!isGoogleWebSearchPage(location)) {
    return true
  }

  if (!findMainResultsRoot(doc)) {
    return false
  }

  for (const { heading, repo } of matchingOrganicTitles(doc)) {
    insertOpenInMenu(heading, createOpenInMenu(doc, repo))
  }

  return true
}

function menusMatchTitles(doc: Document): boolean {
  const titles = matchingOrganicTitles(doc)
  const menus = [...doc.querySelectorAll<HTMLElement>(OPEN_IN_WRAPPER_SELECTOR)]
  if (menus.length !== titles.length) {
    return false
  }

  return titles.every(({ heading, repo }) => {
    const menu = heading.querySelector<HTMLElement>(OPEN_IN_WRAPPER_SELECTOR)
    return menu?.dataset.qhelperRepo === `${repo.owner}/${repo.repo}`
  })
}

export function createGoogleSearchOpenInHelper(
  win: Window,
  doc: Document,
): PageHelperAdapter {
  return {
    render: () => syncGoogleSearchOpenIn(doc, win.location),
    shouldRetry: () =>
      isGoogleWebSearchPage(win.location) && !findMainResultsRoot(doc),
    shouldRecoverFromMutation: () => {
      if (!isGoogleWebSearchPage(win.location)) {
        return doc.querySelector(OPEN_IN_WRAPPER_SELECTOR) !== null
      }

      return !menusMatchTitles(doc)
    },
  }
}
