import { afterEach, describe, expect, it } from 'vitest'
import {
  closeOpenInMenus,
  findOrganicTitleLinks,
  isGoogleWebSearchPage,
  OPEN_IN_WRAPPER_SELECTOR,
  syncGoogleSearchOpenIn,
  unwrapResultHref,
} from './open-in'

const WEB_SEARCH = {
  hostname: 'www.google.com',
  pathname: '/search',
  search: '?q=facebook%2Freact+github',
}

function renderSerp(): void {
  document.body.innerHTML = `
    <div id="center_col">
      <div id="search">
        <div id="rso">
          <div>
            <a href="https://github.com/facebook/react">
              <h3>GitHub - facebook/react</h3>
            </a>
            <div>
              <a href="https://github.com/facebook/react/issues">Issues</a>
              <a href="https://github.com/facebook/react/blob/main/README.md">README.md</a>
            </div>
          </div>
          <div>
            <a href="https://react.dev/"><h3>React</h3></a>
          </div>
          <div>
            <h3>
              <a href="https://github.com/facebook/react/blob/main/packages/react/src/ReactHooks.js">
                ReactHooks.js
              </a>
            </h3>
          </div>
          <div>
            <a href="/url?q=https://github.com/vercel/next.js&amp;sa=U">
              <h3>vercel/next.js</h3>
            </a>
          </div>
        </div>
      </div>
    </div>
    <div id="tads">
      <a href="https://github.com/facebook/react"><h3>Sponsored GitHub</h3></a>
    </div>
    <div id="rhs">
      <a href="https://github.com/facebook/react"><h3>Knowledge panel</h3></a>
    </div>
  `
}

function getMenu(wrapper: Element) {
  return {
    trigger: wrapper.querySelector('button[aria-label="Open in"]'),
    zread: wrapper.querySelector<HTMLAnchorElement>(
      '[data-qhelper-reader-link="zread"]',
    ),
    deepwiki: wrapper.querySelector<HTMLAnchorElement>(
      '[data-qhelper-reader-link="deepwiki"]',
    ),
    githubDev: wrapper.querySelector<HTMLAnchorElement>(
      '[data-qhelper-reader-link="github-dev"]',
    ),
  }
}

afterEach(() => {
  document.body.innerHTML = ''
})

describe('isGoogleWebSearchPage', () => {
  it('accepts regional Google web search including the All tab and web filter', () => {
    expect(isGoogleWebSearchPage(WEB_SEARCH)).toBe(true)
    expect(
      isGoogleWebSearchPage({
        hostname: 'www.google.com.hk',
        pathname: '/search',
        search: '?q=react&udm=14',
      }),
    ).toBe(true)
    expect(
      isGoogleWebSearchPage({
        hostname: 'google.co.jp',
        pathname: '/search/',
        search: '?q=react',
      }),
    ).toBe(true)
  })

  it('rejects vertical search and non-Google hosts', () => {
    expect(
      isGoogleWebSearchPage({
        ...WEB_SEARCH,
        search: '?q=react&tbm=isch',
      }),
    ).toBe(false)
    expect(
      isGoogleWebSearchPage({
        ...WEB_SEARCH,
        search: '?q=react&udm=2',
      }),
    ).toBe(false)
    expect(
      isGoogleWebSearchPage({
        hostname: 'scholar.google.com',
        pathname: '/search',
        search: '?q=react',
      }),
    ).toBe(false)
    expect(
      isGoogleWebSearchPage({
        hostname: 'www.google.com',
        pathname: '/',
        search: '',
      }),
    ).toBe(false)
  })
})

describe('unwrapResultHref', () => {
  it('unwraps Google redirect URLs', () => {
    expect(
      unwrapResultHref('/url?q=https://github.com/facebook/react&sa=U'),
    ).toBe('https://github.com/facebook/react')
    expect(unwrapResultHref('https://github.com/facebook/react')).toBe(
      'https://github.com/facebook/react',
    )
  })
})

describe('syncGoogleSearchOpenIn', () => {
  it('injects one Open in menu on matching organic titles and skips other modules', () => {
    renderSerp()

    expect(syncGoogleSearchOpenIn(document, WEB_SEARCH)).toBe(true)

    const wrappers = [...document.querySelectorAll(OPEN_IN_WRAPPER_SELECTOR)]
    expect(wrappers).toHaveLength(3)
    expect(
      wrappers.map((wrapper) => wrapper.getAttribute('data-qhelper-repo')),
    ).toEqual(['facebook/react', 'facebook/react', 'vercel/next.js'])

    const [firstWrapper] = wrappers
    expect(firstWrapper).toBeInstanceOf(HTMLElement)
    if (!(firstWrapper instanceof HTMLElement)) {
      return
    }
    const { trigger, zread, deepwiki, githubDev } = getMenu(firstWrapper)
    expect(trigger).not.toBeNull()
    expect(zread?.href).toBe('https://zread.ai/facebook/react')
    expect(deepwiki?.href).toBe('https://deepwiki.com/facebook/react')
    expect(githubDev?.href).toBe('https://github.dev/facebook/react')
    expect(githubDev?.textContent).toBe('github.dev')
    expect(githubDev?.target).toBe('_blank')

    const blobHeading = document
      .querySelector('h3 a[href*="ReactHooks.js"]')
      ?.closest('h3')
    expect(
      blobHeading
        ?.querySelector(OPEN_IN_WRAPPER_SELECTOR)
        ?.getAttribute('data-qhelper-repo'),
    ).toBe('facebook/react')

    expect(
      document
        .querySelector('#tads h3')
        ?.querySelector(OPEN_IN_WRAPPER_SELECTOR),
    ).toBeNull()
    expect(
      document
        .querySelector('#rhs h3')
        ?.querySelector(OPEN_IN_WRAPPER_SELECTOR),
    ).toBeNull()
    expect(
      [...document.querySelectorAll('#rso a')]
        .find((link) => link.textContent === 'Issues')
        ?.closest('div')
        ?.querySelector(OPEN_IN_WRAPPER_SELECTOR),
    ).toBeNull()

    const titleLinks = findOrganicTitleLinks(document)
    expect(titleLinks.some((link) => link.textContent === 'React')).toBe(true)
    expect(
      titleLinks
        .find((link) => link.textContent === 'React')
        ?.closest('div')
        ?.querySelector(OPEN_IN_WRAPPER_SELECTOR),
    ).toBeNull()
  })

  it('places the trigger after the title heading text', () => {
    renderSerp()
    syncGoogleSearchOpenIn(document, WEB_SEARCH)

    const heading = document.querySelector(
      'a[href="https://github.com/facebook/react"] h3',
    )
    expect(heading?.lastElementChild?.matches(OPEN_IN_WRAPPER_SELECTOR)).toBe(
      true,
    )
  })

  it('opens destinations from the menu without leaving duplicate controls', () => {
    renderSerp()
    syncGoogleSearchOpenIn(document, WEB_SEARCH)
    syncGoogleSearchOpenIn(document, WEB_SEARCH)

    expect(document.querySelectorAll(OPEN_IN_WRAPPER_SELECTOR)).toHaveLength(3)

    const wrapper = document.querySelector(OPEN_IN_WRAPPER_SELECTOR)
    const trigger = wrapper?.querySelector('button')
    const menu = wrapper?.querySelector<HTMLElement>(
      '[data-qhelper-open-in-menu]',
    )
    expect(wrapper).not.toBeNull()
    expect(trigger).not.toBeNull()
    expect(menu?.hidden).toBe(true)

    trigger?.dispatchEvent(
      new MouseEvent('click', { bubbles: true, cancelable: true }),
    )
    expect(menu?.hidden).toBe(false)
    expect(trigger).toHaveAttribute('aria-expanded', 'true')

    closeOpenInMenus(document)
    expect(menu.hidden).toBe(true)
  })

  it('does not inject on image search even when GitHub titles exist', () => {
    renderSerp()

    expect(
      syncGoogleSearchOpenIn(document, {
        ...WEB_SEARCH,
        search: '?q=react&tbm=isch',
      }),
    ).toBe(true)
    expect(document.querySelector(OPEN_IN_WRAPPER_SELECTOR)).toBeNull()
  })

  it('retries when the results root has not mounted yet', () => {
    document.body.innerHTML = '<main></main>'
    expect(syncGoogleSearchOpenIn(document, WEB_SEARCH)).toBe(false)
  })
})
