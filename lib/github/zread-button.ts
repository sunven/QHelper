import {
  getRepositoryCoordinates,
  parseRepoCoordinates,
  type RepoCoordinates,
} from './repository';

export const ZREAD_BUTTON_ID = 'qhelper-zread-button';
export const ZREAD_WRAPPER_SELECTOR = '[data-qhelper-zread-wrapper="true"]';
const ZREAD_ICON_PATH = 'icons/zread-favicon.ico';
const PREVIOUS_VSCODE_URL_PREFIX = 'https://vscode.dev/github/';
const GLOBAL_HEADER_TARGET_SELECTORS = [
  '.AppHeader-actions',
  '.AppHeader-globalBar-end',
  'header [data-testid="app-header-actions"]',
  'header .Header-item:last-child',
];
const LOGGED_OUT_HEADER_LINK_SELECTORS = [
  'header .HeaderMenu-link--sign-in',
  'header .HeaderMenu-link--sign-up',
];
const HEADER_SEARCH_SELECTORS = [
  'header [data-testid="top-nav-center"] button[aria-label^="Search or jump"]',
  'header [data-testid="top-nav-center"] [class*="Search-module__searchButtonGroup"]',
  'header .AppHeader-search',
  'header .AppHeader-search qbsearch-input',
  'header qbsearch-input.search-input',
  'header qbsearch-input',
  'header .search-input',
  'header .search-input-container',
];
const PREFERRED_ACTION_LIST_SELECTORS = [
  '#repository-details-container .pagehead-actions',
  '#repository-container-header .pagehead-actions',
  '.pagehead-actions',
];
const HEADER_FALLBACK_SELECTORS = [
  '#repository-details-container',
  '#repository-container-header',
  'main [itemprop="name"]',
];
const PREVIOUS_VSCODE_HEADER_SELECTORS = [
  '#repository-details-container',
  '#repository-container-header',
  '.Header-item.mr-0.mr-md-3.flex-order-1.flex-md-order-none',
];

export { parseRepoCoordinates };
export type { RepoCoordinates };

interface InsertionTarget {
  container: HTMLElement;
  before: Element | null;
  wrapperClassName?: string;
}

export function buildZreadUrl({ owner, repo }: RepoCoordinates): string {
  return `https://zread.ai/${owner}/${repo}`;
}

function buildDeepWikiUrl({ owner, repo }: RepoCoordinates): string {
  return `https://deepwiki.com/${owner}/${repo}`;
}

function removeInjectedZreadButton(doc: Document): void {
  doc.querySelectorAll(ZREAD_WRAPPER_SELECTOR).forEach((element) => {
    element.remove();
  });
}

function isPreviousVscodeButton(anchor: HTMLAnchorElement): boolean {
  return (
    anchor.classList.contains('btn') &&
    anchor.textContent?.trim() === 'vscode.dev' &&
    anchor.href.startsWith(PREVIOUS_VSCODE_URL_PREFIX)
  );
}

function isInPreviousHeaderPlacement(anchor: HTMLAnchorElement): boolean {
  return PREVIOUS_VSCODE_HEADER_SELECTORS.some((selector) => anchor.closest(selector) !== null);
}

export function removePreviousVscodeButtons(doc: Document): void {
  doc
    .querySelectorAll<HTMLAnchorElement>(`a[href^="${PREVIOUS_VSCODE_URL_PREFIX}"]`)
    .forEach((anchor) => {
      if (!isPreviousVscodeButton(anchor)) {
        return;
      }

      const parentListItem = anchor.closest('li');
      if (parentListItem?.parentElement?.matches('.pagehead-actions')) {
        parentListItem.remove();
        return;
      }

      if (isInPreviousHeaderPlacement(anchor)) {
        anchor.remove();
      }
    });
}

function getZreadIconUrl(): string | null {
  const getURL = globalThis.chrome?.runtime?.getURL;
  if (!getURL) {
    return null;
  }

  return getURL(ZREAD_ICON_PATH);
}

function appendZreadIcon(doc: Document, element: HTMLElement): void {
  const iconUrl = getZreadIconUrl();
  if (!iconUrl) {
    return;
  }

  const icon = doc.createElement('img');
  icon.src = iconUrl;
  icon.alt = '';
  icon.width = 16;
  icon.height = 16;
  icon.loading = 'lazy';
  icon.decoding = 'async';
  element.append(icon);
}

function createReaderMenuLink(doc: Document, href: string, label: string, linkId: string): HTMLAnchorElement {
  const anchor = doc.createElement('a');
  anchor.href = href;
  anchor.target = '_blank';
  anchor.rel = 'noopener noreferrer';
  anchor.className = 'dropdown-item d-flex flex-items-center gap-2';
  anchor.dataset.qhelperReaderLink = linkId;
  anchor.setAttribute('role', 'menuitem');
  anchor.textContent = label;

  return anchor;
}

function createReaderDropdown(doc: Document, zreadHref: string, deepwikiHref: string): HTMLDetailsElement {
  const details = doc.createElement('details');
  details.className = 'details-reset details-overlay position-relative d-inline-block';

  const summary = doc.createElement('summary');
  summary.id = ZREAD_BUTTON_ID;
  summary.className = 'btn-sm btn d-inline-flex flex-items-center gap-1';
  summary.setAttribute('aria-haspopup', 'menu');
  summary.setAttribute('aria-label', 'Open reader links');

  appendZreadIcon(doc, summary);

  const label = doc.createElement('span');
  label.textContent = 'Open in';
  summary.append(label);

  const caret = doc.createElement('span');
  caret.className = 'dropdown-caret';
  caret.setAttribute('aria-hidden', 'true');
  summary.append(caret);

  const menu = doc.createElement('div');
  menu.className = 'dropdown-menu dropdown-menu-sw p-1';
  menu.style.minWidth = '144px';
  menu.style.marginTop = '4px';
  menu.style.zIndex = '1000';
  menu.setAttribute('role', 'menu');
  menu.append(
    createReaderMenuLink(doc, zreadHref, 'Zread', 'zread'),
    createReaderMenuLink(doc, deepwikiHref, 'DeepWiki', 'deepwiki'),
  );

  details.append(summary, menu);
  return details;
}

function createActionListItem(doc: Document, zreadHref: string, deepwikiHref: string): HTMLLIElement {
  const listItem = doc.createElement('li');
  listItem.dataset.qhelperZreadWrapper = 'true';
  listItem.append(createReaderDropdown(doc, zreadHref, deepwikiHref));
  return listItem;
}

function createGlobalHeaderItem(
  doc: Document,
  zreadHref: string,
  deepwikiHref: string,
  className = 'AppHeader-actions-item',
): HTMLDivElement {
  const wrapper = doc.createElement('div');
  wrapper.dataset.qhelperZreadWrapper = 'true';
  wrapper.className = className;
  wrapper.append(createReaderDropdown(doc, zreadHref, deepwikiHref));
  return wrapper;
}

function createHeaderFallback(doc: Document, zreadHref: string, deepwikiHref: string): HTMLDivElement {
  const wrapper = doc.createElement('div');
  wrapper.dataset.qhelperZreadWrapper = 'true';
  wrapper.className = 'mt-2';
  wrapper.append(createReaderDropdown(doc, zreadHref, deepwikiHref));
  return wrapper;
}

function findFirstMatch<T extends Element>(doc: Document, selectors: string[]): T | null {
  for (const selector of selectors) {
    const match = doc.querySelector<T>(selector);
    if (match) {
      return match;
    }
  }

  return null;
}

function hasHiddenAncestor(element: Element): boolean {
  return element.closest('[hidden], [aria-hidden="true"], .d-none') !== null;
}

function findFirstVisibleMatch<T extends Element>(doc: Document, selectors: string[]): T | null {
  for (const selector of selectors) {
    const matches = doc.querySelectorAll<T>(selector);
    for (const match of matches) {
      if (!hasHiddenAncestor(match)) {
        return match;
      }
    }
  }

  return null;
}

function getSearchReferenceElement(element: HTMLElement): HTMLElement {
  return element.closest<HTMLElement>('[data-component="ButtonGroup"]') ?? element;
}

function findGlobalHeaderInsertionTarget(doc: Document): InsertionTarget | null {
  const searchElement = findFirstVisibleMatch<HTMLElement>(doc, HEADER_SEARCH_SELECTORS);
  const searchReferenceElement = searchElement ? getSearchReferenceElement(searchElement) : null;
  if (searchReferenceElement?.parentElement instanceof HTMLElement) {
    return {
      container: searchReferenceElement.parentElement,
      before: searchReferenceElement,
      wrapperClassName: 'AppHeader-actions-item mr-2',
    };
  }

  const actionsContainer = findFirstMatch<HTMLElement>(doc, GLOBAL_HEADER_TARGET_SELECTORS);
  if (actionsContainer) {
    return {
      container: actionsContainer,
      before: actionsContainer.firstElementChild,
    };
  }

  const authLink = findFirstMatch<HTMLElement>(doc, LOGGED_OUT_HEADER_LINK_SELECTORS);
  const referenceElement = authLink?.closest<HTMLElement>('.HeaderMenu-link-wrap') ?? authLink;
  if (!referenceElement || !(referenceElement.parentElement instanceof HTMLElement)) {
    return null;
  }

  return {
    container: referenceElement.parentElement,
    before: referenceElement,
  };
}

function shouldPromoteToGlobalHeader(doc: Document): boolean {
  const wrapper = doc.querySelector<HTMLElement>(ZREAD_WRAPPER_SELECTOR);
  if (!wrapper) {
    return false;
  }

  const globalHeaderTarget = findGlobalHeaderInsertionTarget(doc);
  return globalHeaderTarget !== null && wrapper.parentElement !== globalHeaderTarget.container;
}

function closeReaderDropdowns(doc: Document): void {
  doc.querySelectorAll<HTMLDetailsElement>(`${ZREAD_WRAPPER_SELECTOR} details[open]`).forEach((details) => {
    details.removeAttribute('open');
  });
}

function closeReaderDropdownsOnOutsideClick(doc: Document, event: MouseEvent): void {
  if (event.target instanceof Element && event.target.closest(ZREAD_WRAPPER_SELECTOR)) {
    return;
  }

  closeReaderDropdowns(doc);
}

export function syncZreadButton(doc: Document, pathname: string): boolean {
  removePreviousVscodeButtons(doc);
  removeInjectedZreadButton(doc);

  const repoCoordinates = getRepositoryCoordinates(doc, pathname);
  if (!repoCoordinates) {
    return false;
  }

  const zreadHref = buildZreadUrl(repoCoordinates);
  const deepwikiHref = buildDeepWikiUrl(repoCoordinates);
  const globalHeaderTarget = findGlobalHeaderInsertionTarget(doc);
  if (globalHeaderTarget) {
    globalHeaderTarget.container.insertBefore(
      createGlobalHeaderItem(doc, zreadHref, deepwikiHref, globalHeaderTarget.wrapperClassName),
      globalHeaderTarget.before,
    );
    return true;
  }

  const actionList = findFirstMatch<HTMLElement>(doc, PREFERRED_ACTION_LIST_SELECTORS);

  if (actionList) {
    actionList.insertBefore(createActionListItem(doc, zreadHref, deepwikiHref), actionList.firstElementChild);
    return true;
  }

  const headerFallback = findFirstMatch<HTMLElement>(doc, HEADER_FALLBACK_SELECTORS);
  if (headerFallback) {
    headerFallback.append(createHeaderFallback(doc, zreadHref, deepwikiHref));
    return true;
  }

  return false;
}

export function installGitHubZreadButton(win: Window, doc: Document): void {
  let lastPathname = win.location.pathname;
  let retryTimer: number | undefined;

  const attemptRender = () => {
    if (retryTimer !== undefined) {
      win.clearTimeout(retryTimer);
      retryTimer = undefined;
    }

    const rendered = syncZreadButton(doc, win.location.pathname);
    if (getRepositoryCoordinates(doc, win.location.pathname) && !rendered) {
      retryTimer = win.setTimeout(attemptRender, 250);
    }
  };

  const rerenderIfPathChanged = () => {
    if (win.location.pathname === lastPathname) {
      return;
    }

    lastPathname = win.location.pathname;
    attemptRender();
  };

  attemptRender();

  doc.addEventListener('turbo:load', rerenderIfPathChanged as EventListener);
  doc.addEventListener('pjax:end', rerenderIfPathChanged as EventListener);
  doc.addEventListener('click', (event) => closeReaderDropdownsOnOutsideClick(doc, event));
  win.addEventListener('popstate', rerenderIfPathChanged);

  const observer = new MutationObserver(() => {
    rerenderIfPathChanged();

    if (
      getRepositoryCoordinates(doc, win.location.pathname) &&
      (!doc.querySelector(ZREAD_WRAPPER_SELECTOR) || shouldPromoteToGlobalHeader(doc))
    ) {
      attemptRender();
    }
  });

  observer.observe(doc.documentElement, {
    childList: true,
    subtree: true,
  });
}
