export const ZREAD_BUTTON_ID = 'qhelper-zread-button';
export const ZREAD_WRAPPER_SELECTOR = '[data-qhelper-zread-wrapper="true"]';
const LEGACY_VSCODE_URL_PREFIX = 'https://vscode.dev/github/';
const REPOSITORY_NWO_META_SELECTOR = 'meta[name="octolytics-dimension-repository_nwo"]';
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
const LEGACY_VSCODE_HEADER_SELECTORS = [
  '#repository-details-container',
  '#repository-container-header',
  '.Header-item.mr-0.mr-md-3.flex-order-1.flex-md-order-none',
];

export interface RepoCoordinates {
  owner: string;
  repo: string;
}

function normalizePathname(pathname: string): string {
  if (pathname === '/') {
    return pathname;
  }

  return pathname.replace(/\/+$/, '');
}

export function parseRepoCoordinates(pathname: string): RepoCoordinates | null {
  const segments = normalizePathname(pathname).split('/').filter(Boolean);

  if (segments.length !== 2) {
    return null;
  }

  const [owner, repo] = segments;
  return { owner, repo };
}

export function buildZreadUrl({ owner, repo }: RepoCoordinates): string {
  return `https://zread.ai/${owner}/${repo}`;
}

function hasRepositoryMetadata(doc: Document, { owner, repo }: RepoCoordinates): boolean {
  return (
    doc.querySelector<HTMLMetaElement>(REPOSITORY_NWO_META_SELECTOR)?.content ===
    `${owner}/${repo}`
  );
}

function getRepositoryCoordinates(doc: Document, pathname: string): RepoCoordinates | null {
  const repoCoordinates = parseRepoCoordinates(pathname);
  if (!repoCoordinates || !hasRepositoryMetadata(doc, repoCoordinates)) {
    return null;
  }

  return repoCoordinates;
}

function removeInjectedZreadButton(doc: Document): void {
  doc.querySelectorAll(ZREAD_WRAPPER_SELECTOR).forEach((element) => {
    element.remove();
  });
}

function isLegacyVscodeButton(anchor: HTMLAnchorElement): boolean {
  return (
    anchor.classList.contains('btn') &&
    anchor.textContent?.trim() === 'vscode.dev' &&
    anchor.href.startsWith(LEGACY_VSCODE_URL_PREFIX)
  );
}

function isInLegacyHeaderPlacement(anchor: HTMLAnchorElement): boolean {
  return LEGACY_VSCODE_HEADER_SELECTORS.some((selector) => anchor.closest(selector) !== null);
}

export function removeLegacyVscodeButtons(doc: Document): void {
  doc
    .querySelectorAll<HTMLAnchorElement>(`a[href^="${LEGACY_VSCODE_URL_PREFIX}"]`)
    .forEach((anchor) => {
      if (!isLegacyVscodeButton(anchor)) {
        return;
      }

      const parentListItem = anchor.closest('li');
      if (parentListItem?.parentElement?.matches('.pagehead-actions')) {
        parentListItem.remove();
        return;
      }

      if (isInLegacyHeaderPlacement(anchor)) {
        anchor.remove();
      }
    });
}

function createZreadAnchor(doc: Document, href: string): HTMLAnchorElement {
  const anchor = doc.createElement('a');
  anchor.id = ZREAD_BUTTON_ID;
  anchor.href = href;
  anchor.target = '_blank';
  anchor.rel = 'noopener noreferrer';
  anchor.className = 'btn-sm btn';
  anchor.textContent = 'Zread';
  return anchor;
}

function createActionListItem(doc: Document, href: string): HTMLLIElement {
  const listItem = doc.createElement('li');
  listItem.dataset.qhelperZreadWrapper = 'true';
  listItem.append(createZreadAnchor(doc, href));
  return listItem;
}

function createHeaderFallback(doc: Document, href: string): HTMLDivElement {
  const wrapper = doc.createElement('div');
  wrapper.dataset.qhelperZreadWrapper = 'true';
  wrapper.className = 'mt-2';
  wrapper.append(createZreadAnchor(doc, href));
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

export function syncZreadButton(doc: Document, pathname: string): boolean {
  removeLegacyVscodeButtons(doc);
  removeInjectedZreadButton(doc);

  const repoCoordinates = getRepositoryCoordinates(doc, pathname);
  if (!repoCoordinates) {
    return false;
  }

  const href = buildZreadUrl(repoCoordinates);
  const actionList = findFirstMatch<HTMLElement>(doc, PREFERRED_ACTION_LIST_SELECTORS);

  if (actionList) {
    actionList.insertBefore(createActionListItem(doc, href), actionList.firstElementChild);
    return true;
  }

  const headerFallback = findFirstMatch<HTMLElement>(doc, HEADER_FALLBACK_SELECTORS);
  if (headerFallback) {
    headerFallback.append(createHeaderFallback(doc, href));
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
  win.addEventListener('popstate', rerenderIfPathChanged);

  const observer = new MutationObserver(() => {
    rerenderIfPathChanged();

    if (
      getRepositoryCoordinates(doc, win.location.pathname) &&
      !doc.querySelector(ZREAD_WRAPPER_SELECTOR)
    ) {
      attemptRender();
    }
  });

  observer.observe(doc.documentElement, {
    childList: true,
    subtree: true,
  });
}
