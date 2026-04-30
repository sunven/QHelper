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
  setPathname: (nextPathname: string) => void;
} {
  const listeners: Record<string, Array<() => void>> = {};
  let currentPathname = pathname;

  return {
    listeners,
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

  it('rejects GitHub root paths', () => {
    expect(parseRepoCoordinates('/')).toBeNull();
  });

  it('rejects GitHub repository subpages', () => {
    expect(parseRepoCoordinates('/Yeachan-Heo/oh-my-codex/issues')).toBeNull();
    expect(parseRepoCoordinates('/Yeachan-Heo/oh-my-codex/blob/main/README.md')).toBeNull();
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

describe('syncZreadButton', () => {
  it('renders a single Zread button on repository root pages', () => {
    renderGitHubHeader();

    expect(syncZreadButton(document, '/Yeachan-Heo/oh-my-codex')).toBe(true);

    const button = document.querySelector<HTMLAnchorElement>(`#${ZREAD_BUTTON_ID}`);
    expect(button).not.toBeNull();
    expect(button?.textContent).toBe('Zread');
    expect(button?.href).toBe('https://zread.ai/Yeachan-Heo/oh-my-codex');
    expect(document.querySelectorAll(`#${ZREAD_BUTTON_ID}`)).toHaveLength(1);
  });

  it('does not render on repository subpages', () => {
    renderGitHubHeader();

    expect(syncZreadButton(document, '/Yeachan-Heo/oh-my-codex/issues')).toBe(false);
    expect(document.querySelector(`#${ZREAD_BUTTON_ID}`)).toBeNull();
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

    expect(syncZreadButton(document, '/Yeachan-Heo/oh-my-codex/issues')).toBe(false);

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

    expect(syncZreadButton(document, '/Yeachan-Heo/oh-my-codex/issues')).toBe(false);

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

    expect(syncZreadButton(document, '/Yeachan-Heo/oh-my-codex/issues')).toBe(false);

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

    expect(syncZreadButton(document, '/Yeachan-Heo/oh-my-codex/issues')).toBe(false);

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

    const fallbackButton = document.querySelector<HTMLAnchorElement>(`#${ZREAD_BUTTON_ID}`);
    expect(fallbackButton).not.toBeNull();
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

  it('removes the injected Zread button after leaving the repository root page', () => {
    renderGitHubHeader();

    syncZreadButton(document, '/Yeachan-Heo/oh-my-codex');
    expect(document.querySelector(`#${ZREAD_BUTTON_ID}`)).not.toBeNull();

    syncZreadButton(document, '/Yeachan-Heo/oh-my-codex/issues');

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

    fakeWindow.setPathname('/Yeachan-Heo/oh-my-codex/issues');
    document.dispatchEvent(new Event('pjax:end'));

    expect(document.querySelector(`#${ZREAD_BUTTON_ID}`)).toBeNull();
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

  it('does not rerender from mutation observations when the button is already present', () => {
    renderGitHubHeader();
    const mutationObserver = stubMutationObserver();
    const fakeWindow = createFakeWindow();

    installGitHubZreadButton(fakeWindow, document);
    mutationObserver.notify();

    expect(document.querySelectorAll(`#${ZREAD_BUTTON_ID}`)).toHaveLength(1);
  });
});
