import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  ZREAD_BUTTON_ID,
  buildZreadUrl,
  installGitHubZreadButton,
  parseRepoCoordinates,
  syncZreadButton,
} from './zread-button';

function renderGitHubHeader(hasActionList = true): void {
  document.head.innerHTML = `
    <meta
      name="octolytics-dimension-repository_nwo"
      content="Yeachan-Heo/oh-my-codex"
    />
  `;
  document.body.innerHTML = `
    <div id="repository-container-header">
      <div id="repository-details-container">
        ${
          hasActionList
            ? `
          <ul class="pagehead-actions flex-shrink-0 d-none d-md-inline">
            <li><a id="repository-details-watch-button" class="btn-sm btn">Watch</a></li>
            <li><a id="fork-button" class="btn-sm btn">Fork</a></li>
            <li><a class="btn-sm btn">Star</a></li>
          </ul>
        `
            : ''
        }
      </div>
    </div>
  `;
}

function renderGitHubGlobalHeader(pathname = '/Yeachan-Heo/oh-my-codex/blob/main/README.md'): void {
  const [, owner, repo] = pathname.split('/');
  document.head.innerHTML = `
    <meta
      name="octolytics-dimension-repository_nwo"
      content="${owner}/${repo}"
    />
  `;
  document.body.innerHTML = `
    <header>
      <div class="AppHeader-actions">
        <button type="button" id="create-menu">Create</button>
        <button type="button" id="profile-menu">Profile</button>
      </div>
    </header>
    <main>
      <article>README</article>
    </main>
  `;
}

function createGitHubLoggedOutHeader(): HTMLElement {
  const template = document.createElement('template');
  template.innerHTML = `
    <header class="HeaderMktg">
      <div class="d-flex flex-items-center">
        <nav>Navigation</nav>
        <qbsearch-input class="search-input">
          <div class="search-input-container">Search or jump to...</div>
        </qbsearch-input>
        <div class="position-relative HeaderMenu-link-wrap d-lg-inline-block">
          <a class="HeaderMenu-link HeaderMenu-link--sign-in HeaderMenu-button">Sign in</a>
        </div>
        <a class="HeaderMenu-link HeaderMenu-link--sign-up HeaderMenu-button">Sign up</a>
        <div class="AppHeader-appearanceSettings">
          <button type="button">Appearance settings</button>
        </div>
      </div>
    </header>
  `;

  return template.content.firstElementChild as HTMLElement;
}

function renderGitHubLoggedOutHeader(): void {
  renderGitHubHeader();
  document.body.prepend(createGitHubLoggedOutHeader());
}

function renderGitHubLoggedInHeader(): void {
  renderGitHubHeader();
  const template = document.createElement('template');
  template.innerHTML = `
    <header class="AppHeader">
      <div class="AppHeader-globalBar d-flex flex-items-center">
        <div class="AppHeader-globalBar-start">
          <a href="/">GitHub</a>
        </div>
        <div data-testid="top-nav-center" class="styles-module__center__R3QRv">
          <div class="Search-module__searchButtonGroup__aetw5" data-component="ButtonGroup">
            <div>
              <button type="button" aria-label="Search or jump to...">Type / to search</button>
            </div>
          </div>
          <button type="button" aria-label="Search or jump to..." class="Search-module__smallSearchButton___8Gvn">
            Search
          </button>
          <div class="d-none">
            <qbsearch-input class="search-input">
              <div class="search-input-container">Hidden search dialog</div>
            </qbsearch-input>
          </div>
        </div>
        <div class="AppHeader-globalBar-end">
          <div class="AppHeader-actions">
            <button type="button" id="create-menu">Create</button>
            <button type="button" id="profile-menu">Profile</button>
          </div>
        </div>
      </div>
    </header>
  `;
  document.body.prepend(template.content.firstElementChild as HTMLElement);
}

function renderRepositoryMeta(owner = 'Yeachan-Heo', repo = 'oh-my-codex'): void {
  document.head.innerHTML = `
    <meta
      name="octolytics-dimension-repository_nwo"
      content="${owner}/${repo}"
    />
  `;
}

function createFakeWindow(pathname = '/Yeachan-Heo/oh-my-codex'): Window & {
  listeners: Record<string, Array<() => void>>;
  documentListeners: Record<string, Array<(event: Event) => void>>;
  setPathname: (nextPathname: string) => void;
} {
  const listeners: Record<string, Array<() => void>> = {};
  const documentListeners: Record<string, Array<(event: Event) => void>> = {};
  let currentPathname = pathname;

  vi.spyOn(document, 'addEventListener').mockImplementation(
    (eventName: string, listener: EventListenerOrEventListenerObject) => {
      documentListeners[eventName] ??= [];
      documentListeners[eventName].push(listener as (event: Event) => void);
    },
  );

  return {
    listeners,
    documentListeners,
    location: {
      get pathname() {
        return currentPathname;
      },
    },
    setPathname(nextPathname: string) {
      currentPathname = nextPathname;
    },
    setTimeout: vi.fn(() => 123),
    clearTimeout: vi.fn(),
    addEventListener: vi.fn((eventName: string, listener: () => void) => {
      listeners[eventName] ??= [];
      listeners[eventName].push(listener);
    }),
  } as unknown as Window & {
    listeners: Record<string, Array<() => void>>;
    documentListeners: Record<string, Array<(event: Event) => void>>;
    setPathname: (nextPathname: string) => void;
  };
}

function stubMutationObserver() {
  let mutationCallback: MutationCallback | undefined;
  const observe = vi.fn();

  class MockMutationObserver {
    observe = observe;

    constructor(callback: MutationCallback) {
      mutationCallback = callback;
    }
  }

  vi.stubGlobal('MutationObserver', MockMutationObserver);

  return {
    observe,
    notify: () => mutationCallback?.([], {} as MutationObserver),
  };
}

function stubChromeRuntimeGetUrl() {
  const getURL = vi.fn((path: string) => `chrome-extension://qhelper-test/${path}`);

  vi.stubGlobal('chrome', {
    runtime: {
      getURL,
    },
  });

  return { getURL };
}

function createClickEvent(target: Element): MouseEvent {
  const event = new MouseEvent('click', {
    bubbles: true,
  });
  Object.defineProperty(event, 'target', {
    value: target,
  });

  return event;
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('parseRepoCoordinates', () => {
  it('parses repository root paths', () => {
    expect(parseRepoCoordinates('/Yeachan-Heo/oh-my-codex')).toEqual({
      owner: 'Yeachan-Heo',
      repo: 'oh-my-codex',
    });
    expect(parseRepoCoordinates('/Yeachan-Heo/oh-my-codex/')).toEqual({
      owner: 'Yeachan-Heo',
      repo: 'oh-my-codex',
    });
  });

  it('parses repository subpage paths from the first two segments', () => {
    expect(parseRepoCoordinates('/Yeachan-Heo/oh-my-codex/issues')).toEqual({
      owner: 'Yeachan-Heo',
      repo: 'oh-my-codex',
    });
    expect(parseRepoCoordinates('/Yeachan-Heo/oh-my-codex/blob/main/README.md')).toEqual({
      owner: 'Yeachan-Heo',
      repo: 'oh-my-codex',
    });
  });

  it('rejects GitHub root paths', () => {
    expect(parseRepoCoordinates('/')).toBeNull();
    expect(parseRepoCoordinates('/Yeachan-Heo')).toBeNull();
  });
});

describe('buildZreadUrl', () => {
  it('maps owner/repo to zread.ai', () => {
    expect(
      buildZreadUrl({
        owner: 'Yeachan-Heo',
        repo: 'oh-my-codex',
      }),
    ).toBe('https://zread.ai/Yeachan-Heo/oh-my-codex');
  });
});

function getReaderDropdown() {
  const trigger = document.querySelector<HTMLElement>(`#${ZREAD_BUTTON_ID}`);
  const dropdown = trigger?.closest('details');
  const menu = dropdown?.querySelector<HTMLElement>('.dropdown-menu');
  const zreadLink = dropdown?.querySelector<HTMLAnchorElement>('[data-qhelper-reader-link="zread"]');
  const deepwikiLink = dropdown?.querySelector<HTMLAnchorElement>('[data-qhelper-reader-link="deepwiki"]');

  return {
    trigger,
    dropdown,
    menu,
    zreadLink,
    deepwikiLink,
  };
}

describe('syncZreadButton', () => {
  it('renders a single Zread button on repository root pages', () => {
    const { getURL } = stubChromeRuntimeGetUrl();
    renderGitHubHeader();

    expect(syncZreadButton(document, '/Yeachan-Heo/oh-my-codex')).toBe(true);

    const { trigger, dropdown, menu, zreadLink, deepwikiLink } = getReaderDropdown();
    const icon = trigger?.querySelector('img');
    expect(trigger).not.toBeNull();
    expect(trigger?.textContent).toBe('Open in');
    expect(trigger?.tagName).toBe('SUMMARY');
    expect(trigger?.className).toContain('d-inline-flex');
    expect(trigger?.className).toContain('flex-items-center');
    expect(dropdown?.className).toContain('details-overlay');
    expect(menu?.className).toContain('dropdown-menu');
    expect(zreadLink?.href).toBe('https://zread.ai/Yeachan-Heo/oh-my-codex');
    expect(deepwikiLink?.href).toBe('https://deepwiki.com/Yeachan-Heo/oh-my-codex');
    expect(deepwikiLink?.textContent).toBe('DeepWiki');
    expect(getURL).toHaveBeenCalledWith('icons/zread-favicon.ico');
    expect(icon?.src).toBe('chrome-extension://qhelper-test/icons/zread-favicon.ico');
    expect(icon?.alt).toBe('');
    expect(icon?.width).toBe(16);
    expect(icon?.height).toBe(16);
    expect(document.querySelectorAll(`#${ZREAD_BUTTON_ID}`)).toHaveLength(1);
  });

  it('renders the Zread button without an icon when extension runtime APIs are unavailable', () => {
    renderGitHubHeader();

    expect(syncZreadButton(document, '/Yeachan-Heo/oh-my-codex')).toBe(true);

    const { trigger, zreadLink } = getReaderDropdown();
    expect(trigger).not.toBeNull();
    expect(trigger?.textContent).toBe('Open in');
    expect(zreadLink?.href).toBe('https://zread.ai/Yeachan-Heo/oh-my-codex');
    expect(trigger?.querySelector('img')).toBeNull();
  });

  it('renders a Zread button in the global header on repository subpages', () => {
    renderGitHubGlobalHeader('/abhigyanpatwari/GitNexus/blob/main/README.md');

    expect(syncZreadButton(document, '/abhigyanpatwari/GitNexus/blob/main/README.md')).toBe(true);

    const { trigger, zreadLink, deepwikiLink } = getReaderDropdown();
    expect(trigger).not.toBeNull();
    expect(zreadLink?.href).toBe('https://zread.ai/abhigyanpatwari/GitNexus');
    expect(deepwikiLink?.href).toBe('https://deepwiki.com/abhigyanpatwari/GitNexus');
    expect(document.querySelector('.AppHeader-actions > [data-qhelper-zread-wrapper="true"]')).not.toBeNull();
    expect(document.querySelector('.AppHeader-actions')?.firstElementChild).toBe(
      document.querySelector('[data-qhelper-zread-wrapper="true"]'),
    );
  });

  it('renders the Zread button in the logged-out GitHub header before repository actions', () => {
    renderGitHubLoggedOutHeader();

    expect(syncZreadButton(document, '/Yeachan-Heo/oh-my-codex')).toBe(true);

    const wrapper = document.querySelector('[data-qhelper-zread-wrapper="true"]');
    expect(wrapper?.closest('header')).not.toBeNull();
    expect(wrapper?.className).toContain('mr-2');
    expect(wrapper?.nextElementSibling).toBe(document.querySelector('qbsearch-input.search-input'));
    expect(document.querySelector('.pagehead-actions > [data-qhelper-zread-wrapper="true"]')).toBeNull();
  });

  it('renders the Zread button before the search field in logged-in GitHub headers', () => {
    renderGitHubLoggedInHeader();

    expect(syncZreadButton(document, '/Yeachan-Heo/oh-my-codex')).toBe(true);

    const wrapper = document.querySelector('[data-qhelper-zread-wrapper="true"]');
    expect(wrapper?.closest('header')).not.toBeNull();
    expect(wrapper?.className).toContain('mr-2');
    expect(wrapper?.nextElementSibling).toBe(document.querySelector('[data-component="ButtonGroup"]'));
    expect(wrapper?.closest('.d-none')).toBeNull();
    expect(document.querySelector('.AppHeader-actions > [data-qhelper-zread-wrapper="true"]')).toBeNull();
    expect(document.querySelector('.pagehead-actions > [data-qhelper-zread-wrapper="true"]')).toBeNull();
  });

  it('does not render on non-repository two-segment paths', () => {
    renderGitHubHeader();
    document.head.innerHTML = '';

    expect(syncZreadButton(document, '/features/copilot')).toBe(false);
    expect(document.querySelector(`#${ZREAD_BUTTON_ID}`)).toBeNull();
  });

  it('preserves existing vscode.dev links on unsupported pages', () => {
    renderGitHubHeader();
    const previousAnchor = document.createElement('a');
    previousAnchor.href = 'https://vscode.dev/github/Yeachan-Heo/oh-my-codex';
    previousAnchor.textContent = 'vscode.dev';
    document.querySelector('#repository-details-container')?.append(previousAnchor);

    expect(syncZreadButton(document, '/Yeachan-Heo/different-repo/issues')).toBe(false);

    expect(document.querySelector('a[href^="https://vscode.dev/github/"]')).toBe(previousAnchor);
    expect(document.querySelector(`#${ZREAD_BUTTON_ID}`)).toBeNull();
  });

  it('removes previous vscode.dev buttons on unsupported pages', () => {
    renderGitHubHeader();
    const previousButton = document.createElement('a');
    previousButton.href = 'https://vscode.dev/github/Yeachan-Heo/oh-my-codex';
    previousButton.textContent = 'vscode.dev';
    previousButton.className = 'btn';
    document.querySelector('#repository-details-container')?.append(previousButton);

    expect(syncZreadButton(document, '/Yeachan-Heo/different-repo/issues')).toBe(false);

    expect(document.querySelector('a[href^="https://vscode.dev/github/"]')).toBeNull();
    expect(document.querySelector(`#${ZREAD_BUTTON_ID}`)).toBeNull();
  });

  it('removes previous vscode.dev list items from repository action lists', () => {
    renderGitHubHeader();
    const actionList = document.querySelector('.pagehead-actions');
    const previousListItem = document.createElement('li');
    const previousButton = document.createElement('a');
    previousButton.href = 'https://vscode.dev/github/Yeachan-Heo/oh-my-codex';
    previousButton.textContent = 'vscode.dev';
    previousButton.className = 'btn';
    previousListItem.append(previousButton);
    actionList?.append(previousListItem);

    expect(syncZreadButton(document, '/Yeachan-Heo/different-repo/issues')).toBe(false);

    expect(previousListItem.isConnected).toBe(false);
  });

  it('preserves unrelated vscode.dev buttons outside the repository header', () => {
    renderGitHubHeader();
    const outsideButton = document.createElement('a');
    outsideButton.id = 'outside';
    outsideButton.href = 'https://vscode.dev/github/Yeachan-Heo/oh-my-codex';
    outsideButton.textContent = 'vscode.dev';
    outsideButton.className = 'btn';
    document.body.append(outsideButton);

    expect(syncZreadButton(document, '/Yeachan-Heo/different-repo/issues')).toBe(false);

    expect(document.querySelector('#outside')).toBe(outsideButton);
    expect(document.querySelector(`#${ZREAD_BUTTON_ID}`)).toBeNull();
  });

  it('preserves non-button vscode.dev links on repository root pages', () => {
    renderGitHubHeader();
    const readmeLink = document.createElement('a');
    readmeLink.href = 'https://vscode.dev/github/Yeachan-Heo/oh-my-codex';
    readmeLink.textContent = 'Open docs in vscode.dev';
    document.body.append(readmeLink);

    expect(syncZreadButton(document, '/Yeachan-Heo/oh-my-codex')).toBe(true);

    expect(document.querySelector('a[href="https://vscode.dev/github/Yeachan-Heo/oh-my-codex"]')).toBe(
      readmeLink,
    );
    expect(document.querySelector(`#${ZREAD_BUTTON_ID}`)).not.toBeNull();
  });

  it('falls back to a visible repository header container when the action list is unavailable', () => {
    renderGitHubHeader(false);

    expect(syncZreadButton(document, '/Yeachan-Heo/oh-my-codex')).toBe(true);

    const { trigger } = getReaderDropdown();
    expect(trigger).not.toBeNull();
    expect(document.querySelector('#repository-details-container > div[data-qhelper-zread-wrapper="true"]')).not.toBeNull();
  });

  it('falls back to later GitHub action-list selectors when preferred containers are missing', () => {
    renderRepositoryMeta();
    document.body.innerHTML = `
      <main>
        <ul class="pagehead-actions">
          <li><a class="btn-sm btn">Star</a></li>
        </ul>
      </main>
    `;

    expect(syncZreadButton(document, '/Yeachan-Heo/oh-my-codex')).toBe(true);

    expect(document.querySelector('.pagehead-actions > li[data-qhelper-zread-wrapper="true"]')).not.toBeNull();
  });

  it('falls back to repository name headers when action lists and repository containers are unavailable', () => {
    renderRepositoryMeta();
    document.body.innerHTML = `
      <main>
        <strong itemprop="name">oh-my-codex</strong>
      </main>
    `;

    expect(syncZreadButton(document, '/Yeachan-Heo/oh-my-codex')).toBe(true);

    expect(document.querySelector('[itemprop="name"] > div[data-qhelper-zread-wrapper="true"]')).not.toBeNull();
  });

  it('returns false when no supported GitHub insertion target exists', () => {
    renderRepositoryMeta();
    document.body.innerHTML = '<main></main>';

    expect(syncZreadButton(document, '/Yeachan-Heo/oh-my-codex')).toBe(false);
    expect(document.querySelector(`#${ZREAD_BUTTON_ID}`)).toBeNull();
  });

  it('removes previous vscode.dev buttons before rendering the Zread button', () => {
    renderGitHubHeader();
    const previousAnchor = document.createElement('a');
    previousAnchor.href = 'https://vscode.dev/github/Yeachan-Heo/oh-my-codex';
    previousAnchor.textContent = 'vscode.dev';
    previousAnchor.className = 'btn';
    document.querySelector('#repository-details-container')?.append(previousAnchor);

    syncZreadButton(document, '/Yeachan-Heo/oh-my-codex');

    expect(document.querySelector('a[href^="https://vscode.dev/github/"]')).toBeNull();
    expect(document.querySelector(`#${ZREAD_BUTTON_ID}`)).not.toBeNull();
  });

  it('re-renders without duplicating the injected button', () => {
    renderGitHubHeader();

    syncZreadButton(document, '/Yeachan-Heo/oh-my-codex');
    syncZreadButton(document, '/Yeachan-Heo/oh-my-codex');

    expect(document.querySelectorAll(`#${ZREAD_BUTTON_ID}`)).toHaveLength(1);
  });

  it('keeps the injected Zread button after navigating from a repository root to a repository subpage', () => {
    renderGitHubHeader();

    syncZreadButton(document, '/Yeachan-Heo/oh-my-codex');
    expect(document.querySelector(`#${ZREAD_BUTTON_ID}`)).not.toBeNull();

    syncZreadButton(document, '/Yeachan-Heo/oh-my-codex/issues');

    expect(document.querySelector(`#${ZREAD_BUTTON_ID}`)).not.toBeNull();
  });

  it('removes the injected Zread button after leaving the repository', () => {
    renderGitHubHeader();

    syncZreadButton(document, '/Yeachan-Heo/oh-my-codex');
    expect(document.querySelector(`#${ZREAD_BUTTON_ID}`)).not.toBeNull();

    syncZreadButton(document, '/Yeachan-Heo/different-repo/issues');

    expect(document.querySelector(`#${ZREAD_BUTTON_ID}`)).toBeNull();
  });
});

describe('installGitHubZreadButton', () => {
  it('renders immediately and registers GitHub navigation listeners', () => {
    renderGitHubHeader();
    const mutationObserver = stubMutationObserver();
    const fakeWindow = createFakeWindow();

    installGitHubZreadButton(fakeWindow, document);

    expect(document.querySelector(`#${ZREAD_BUTTON_ID}`)).not.toBeNull();
    expect(document.addEventListener).toHaveBeenCalledWith('click', expect.any(Function));
    expect(fakeWindow.addEventListener).toHaveBeenCalledWith('popstate', expect.any(Function));
    expect(mutationObserver.observe).toHaveBeenCalledWith(document.documentElement, {
      childList: true,
      subtree: true,
    });
  });

  it('rerenders only after GitHub navigation changes the pathname', () => {
    renderGitHubHeader();
    stubMutationObserver();
    const fakeWindow = createFakeWindow();

    installGitHubZreadButton(fakeWindow, document);
    document.dispatchEvent(new Event('turbo:load'));
    expect(document.querySelector(`#${ZREAD_BUTTON_ID}`)).not.toBeNull();

    fakeWindow.setPathname('/Yeachan-Heo/oh-my-codex/blob/main/README.md');
    document.dispatchEvent(new Event('pjax:end'));

    expect(document.querySelector(`#${ZREAD_BUTTON_ID}`)).not.toBeNull();
  });

  it('retries rendering repository roots when GitHub has not mounted the header yet', () => {
    renderRepositoryMeta();
    document.body.innerHTML = '<main></main>';
    stubMutationObserver();
    const fakeWindow = createFakeWindow();
    let retryCallback: (() => void) | undefined;
    vi.mocked(fakeWindow.setTimeout).mockImplementation((callback: TimerHandler) => {
      retryCallback = callback as () => void;
      return 123;
    });

    installGitHubZreadButton(fakeWindow, document);

    expect(fakeWindow.setTimeout).toHaveBeenCalledWith(expect.any(Function), 250);
    document.body.innerHTML = '<div id="repository-details-container"></div>';
    retryCallback?.();

    expect(fakeWindow.clearTimeout).toHaveBeenCalledWith(123);
    expect(document.querySelector(`#${ZREAD_BUTTON_ID}`)).not.toBeNull();
  });

  it('uses mutation observations to recover a missing injected button on repository roots', () => {
    renderGitHubHeader();
    const mutationObserver = stubMutationObserver();
    const fakeWindow = createFakeWindow();

    installGitHubZreadButton(fakeWindow, document);
    document.querySelector('[data-qhelper-zread-wrapper="true"]')?.remove();

    mutationObserver.notify();

    expect(document.querySelector(`#${ZREAD_BUTTON_ID}`)).not.toBeNull();
  });

  it('closes an open reader dropdown after clicking outside it', () => {
    renderGitHubHeader();
    stubMutationObserver();
    const fakeWindow = createFakeWindow();

    installGitHubZreadButton(fakeWindow, document);
    const { dropdown } = getReaderDropdown();
    dropdown?.setAttribute('open', '');

    const outsideButton = document.createElement('button');
    document.body.append(outsideButton);
    fakeWindow.documentListeners.click?.[0]?.(createClickEvent(outsideButton));

    expect(dropdown?.hasAttribute('open')).toBe(false);
  });

  it('keeps an open reader dropdown after clicking inside it', () => {
    renderGitHubHeader();
    stubMutationObserver();
    const fakeWindow = createFakeWindow();

    installGitHubZreadButton(fakeWindow, document);
    const { dropdown, deepwikiLink } = getReaderDropdown();
    dropdown?.setAttribute('open', '');
    fakeWindow.documentListeners.click?.[0]?.(createClickEvent(deepwikiLink as Element));

    expect(dropdown?.hasAttribute('open')).toBe(true);
  });

  it('moves the injected Zread button into the global header when GitHub mounts it late', () => {
    renderGitHubHeader();
    const mutationObserver = stubMutationObserver();
    const fakeWindow = createFakeWindow();

    installGitHubZreadButton(fakeWindow, document);
    expect(document.querySelector('.pagehead-actions > [data-qhelper-zread-wrapper="true"]')).not.toBeNull();

    document.body.prepend(createGitHubLoggedOutHeader());
    mutationObserver.notify();

    const wrapper = document.querySelector('[data-qhelper-zread-wrapper="true"]');
    expect(wrapper?.closest('header')).not.toBeNull();
    expect(document.querySelector('.pagehead-actions > [data-qhelper-zread-wrapper="true"]')).toBeNull();
    expect(document.querySelectorAll(`#${ZREAD_BUTTON_ID}`)).toHaveLength(1);
  });

  it('does not rerender from mutation observations when the button is already present', () => {
    renderGitHubHeader();
    const mutationObserver = stubMutationObserver();
    const fakeWindow = createFakeWindow();

    installGitHubZreadButton(fakeWindow, document);
    mutationObserver.notify();

    expect(document.querySelectorAll(`#${ZREAD_BUTTON_ID}`)).toHaveLength(1);
  });
});
