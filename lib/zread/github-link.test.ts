import { afterEach, describe, expect, it, vi } from 'vitest';
import { installZreadGithubLink, syncZreadGithubLink } from './github-link';

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

describe('syncZreadGithubLink', () => {
  it('renders a GitHub link on Zread repository root pages', () => {
    document.body.innerHTML = '<main>Zread repository summary</main>';

    expect(syncZreadGithubLink(document, '/Yeachan-Heo/oh-my-codex')).toBe(true);

    const githubLink = document.querySelector<HTMLAnchorElement>(
      'a[href="https://github.com/Yeachan-Heo/oh-my-codex"]',
    );

    expect(githubLink).not.toBeNull();
    expect(githubLink?.textContent).toBe('GitHub');
    expect(githubLink?.target).toBe('_blank');
    expect(githubLink?.rel).toContain('noopener');
    expect(githubLink?.rel).toContain('noreferrer');
  });

  it('removes a stale GitHub link after leaving a Zread repository page', () => {
    document.body.innerHTML = '<main>Zread repository summary</main>';

    syncZreadGithubLink(document, '/Yeachan-Heo/oh-my-codex');
    expect(
      document.querySelector('a[href="https://github.com/Yeachan-Heo/oh-my-codex"]'),
    ).not.toBeNull();

    expect(syncZreadGithubLink(document, '/')).toBe(false);

    expect(
      document.querySelector('a[href="https://github.com/Yeachan-Heo/oh-my-codex"]'),
    ).toBeNull();
  });

  it('renders the GitHub link in the Zread page header when one is available', () => {
    document.body.innerHTML = `
      <header>
        <nav>Zread navigation</nav>
      </header>
      <main>Zread repository summary</main>
    `;

    syncZreadGithubLink(document, '/Yeachan-Heo/oh-my-codex');

    const githubLink = document.querySelector<HTMLAnchorElement>(
      'a[href="https://github.com/Yeachan-Heo/oh-my-codex"]',
    );

    expect(githubLink?.closest('header')).toBe(document.querySelector('header'));
  });

  it('renders the GitHub link inside the Zread repository controls when they are available', () => {
    document.body.innerHTML = `
      <header>
        <div data-testid="repo-controls">
          <button type="button">
            <span>Yeachan-Heo/oh-my-codex</span>
          </button>
          <svg data-testid="subscription"></svg>
          <svg data-testid="bookmark"></svg>
        </div>
      </header>
      <main>Zread repository summary</main>
    `;

    syncZreadGithubLink(document, '/Yeachan-Heo/oh-my-codex');

    const repoControls = document.querySelector('[data-testid="repo-controls"]');
    const githubLink = document.querySelector<HTMLAnchorElement>(
      'a[href="https://github.com/Yeachan-Heo/oh-my-codex"]',
    );

    expect(githubLink?.parentElement).toBe(repoControls);
    expect(repoControls?.lastElementChild).toBe(githubLink);
  });
});

describe('installZreadGithubLink', () => {
  it('renders the GitHub link when the Zread helper installs', () => {
    document.body.innerHTML = '<main>Zread repository summary</main>';

    installZreadGithubLink(createFakeWindow(), document);

    expect(
      document.querySelector('a[href="https://github.com/Yeachan-Heo/oh-my-codex"]'),
    ).not.toBeNull();
  });

  it('updates the GitHub link after Zread navigation changes the pathname', () => {
    document.body.innerHTML = '<main>Zread repository summary</main>';
    const fakeWindow = createFakeWindow();

    installZreadGithubLink(fakeWindow, document);
    fakeWindow.setPathname('/abhigyanpatwari/GitNexus');
    fakeWindow.listeners.popstate?.[0]?.();

    expect(
      document.querySelector('a[href="https://github.com/Yeachan-Heo/oh-my-codex"]'),
    ).toBeNull();
    expect(
      document.querySelector('a[href="https://github.com/abhigyanpatwari/GitNexus"]'),
    ).not.toBeNull();
  });

  it('moves the GitHub link into the header when Zread mounts the header later', () => {
    document.body.innerHTML = '<main>Zread repository summary</main>';
    const mutationObserver = stubMutationObserver();

    installZreadGithubLink(createFakeWindow(), document);
    expect(
      document.querySelector('a[href="https://github.com/Yeachan-Heo/oh-my-codex"]')?.closest(
        'header',
      ),
    ).toBeNull();

    const header = document.createElement('header');
    header.textContent = 'Zread navigation';
    document.body.prepend(header);
    mutationObserver.notify();

    const githubLinks = document.querySelectorAll(
      'a[href="https://github.com/Yeachan-Heo/oh-my-codex"]',
    );
    expect(githubLinks).toHaveLength(1);
    expect(githubLinks[0]?.closest('header')).toBe(header);
    expect(mutationObserver.observe).toHaveBeenCalledWith(document.documentElement, {
      childList: true,
      subtree: true,
    });
  });
});
