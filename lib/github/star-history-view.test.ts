import { afterEach, describe, expect, it, vi } from 'vitest';
import type { StarHistorySvgResponse } from './star-history-background';
import {
  STAR_HISTORY_BUTTON_ID,
  STAR_HISTORY_POPOVER_ID,
  installGitHubStarHistoryView,
  syncStarHistoryView,
} from './star-history-view';

function renderRepositoryMeta(owner = 'ultraworkers', repo = 'claw-code'): void {
  document.head.innerHTML = `
    <meta
      name="octolytics-dimension-repository_nwo"
      content="${owner}/${repo}"
    />
  `;
  document.body.innerHTML = '<main><article>README</article></main>';
}

function createFakeWindow(pathname = '/ultraworkers/claw-code'): Window & {
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

function createRuntime(svgByTheme: Record<'light' | 'dark', string>) {
  return {
    sendMessage: vi.fn((message: unknown, callback: (response: StarHistorySvgResponse) => void) => {
      const { theme } = message as { theme: 'light' | 'dark' };
      callback({
        ok: true,
        svg: svgByTheme[theme],
      });
    }),
  };
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  document.head.innerHTML = '';
  document.body.innerHTML = '';
});

describe('syncStarHistoryView', () => {
  it('renders a floating icon button on repository home pages', () => {
    renderRepositoryMeta();

    expect(syncStarHistoryView(document, '/ultraworkers/claw-code')).toBe(true);

    const button = document.querySelector<HTMLButtonElement>(`#${STAR_HISTORY_BUTTON_ID}`);
    expect(button).not.toBeNull();
    expect(button?.textContent).toBe('');
    expect(button?.title).toBe('Star History');
    expect(button?.getAttribute('aria-label')).toBe('Open Star History');
    expect(button?.getAttribute('aria-expanded')).toBe('false');
  });

  it('does not render on repository subpages', () => {
    renderRepositoryMeta();

    expect(syncStarHistoryView(document, '/ultraworkers/claw-code/issues')).toBe(false);

    expect(document.querySelector(`#${STAR_HISTORY_BUTTON_ID}`)).toBeNull();
  });

  it('does not render on non-repository two-segment paths', () => {
    renderRepositoryMeta();
    document.head.innerHTML = '';

    expect(syncStarHistoryView(document, '/features/copilot')).toBe(false);

    expect(document.querySelector(`#${STAR_HISTORY_BUTTON_ID}`)).toBeNull();
  });

  it('opens a popover with a CSP-safe current repository chart and detail link', async () => {
    renderRepositoryMeta('Yeachan-Heo', 'oh-my-codex');
    const runtime = createRuntime({
      light: '<svg><text>light chart</text></svg>',
      dark: '<svg><text>dark chart</text></svg>',
    });
    syncStarHistoryView(document, '/Yeachan-Heo/oh-my-codex', { runtime });

    document.querySelector<HTMLButtonElement>(`#${STAR_HISTORY_BUTTON_ID}`)?.click();

    await vi.waitFor(() => {
      expect(document.querySelector(`#${STAR_HISTORY_POPOVER_ID} img`)).not.toBeNull();
    });

    const popover = document.querySelector(`#${STAR_HISTORY_POPOVER_ID}`);
    const chartLink = popover?.querySelector<HTMLAnchorElement>('.qhelper-star-history__link');
    const headerLink = popover?.querySelector<HTMLAnchorElement>(
      '.qhelper-star-history__external',
    );
    const image = popover?.querySelector<HTMLImageElement>('img');
    const darkSource = popover?.querySelector<HTMLSourceElement>(
      'source[media="(prefers-color-scheme: dark)"]',
    );

    expect(popover).not.toBeNull();
    expect(popover?.getAttribute('role')).toBe('dialog');
    expect(chartLink?.href).toBe('https://star-history.com/#Yeachan-Heo/oh-my-codex&Date');
    expect(headerLink?.href).toBe('https://star-history.com/#Yeachan-Heo/oh-my-codex&Date');
    expect(headerLink?.target).toBe('_blank');
    expect(headerLink?.rel).toBe('noopener noreferrer');
    expect(headerLink?.getAttribute('aria-label')).toBe('Open Star History');
    expect(headerLink?.querySelector('svg')).not.toBeNull();
    expect(headerLink?.parentElement?.className).toBe('qhelper-star-history__title-row');
    expect(
      popover?.querySelector('.qhelper-star-history__actions [aria-label="Close Star History"]'),
    ).not.toBeNull();
    expect(image?.src).toContain('data:image/svg+xml;charset=utf-8,');
    expect(image?.src).toContain('light%20chart');
    expect(chartLink?.className).toBe('qhelper-star-history__link');
    expect(image?.alt).toBe('Star history for Yeachan-Heo/oh-my-codex');
    expect(darkSource?.srcset).toContain('data:image/svg+xml;charset=utf-8,');
    expect(darkSource?.srcset).toContain('dark%20chart');
    expect(image?.src).not.toContain('https://api.star-history.com');
    expect(darkSource?.srcset).not.toContain('https://api.star-history.com');
    expect(runtime.sendMessage).toHaveBeenCalledWith(
      {
        type: 'QHELPER_STAR_HISTORY_SVG',
        repo: { owner: 'Yeachan-Heo', repo: 'oh-my-codex' },
        theme: 'light',
      },
      expect.any(Function),
    );
    expect(runtime.sendMessage).toHaveBeenCalledWith(
      {
        type: 'QHELPER_STAR_HISTORY_SVG',
        repo: { owner: 'Yeachan-Heo', repo: 'oh-my-codex' },
        theme: 'dark',
      },
      expect.any(Function),
    );
  });

  it('shows an animated loading indicator while the chart is loading', () => {
    renderRepositoryMeta();
    syncStarHistoryView(document, '/ultraworkers/claw-code', {
      runtime: {
        sendMessage: vi.fn(),
      },
    });

    document.querySelector<HTMLButtonElement>(`#${STAR_HISTORY_BUTTON_ID}`)?.click();

    expect(document.querySelector('.qhelper-star-history__loading-text')?.textContent).toBe(
      'Loading Star History...',
    );
    expect(document.querySelector('.qhelper-star-history__loading')).not.toBeNull();
    expect(document.querySelector('.qhelper-star-history__spinner')).not.toBeNull();
  });

  it('closes the popover with the close button, outside click, and Escape', () => {
    renderRepositoryMeta();
    syncStarHistoryView(document, '/ultraworkers/claw-code', {
      runtime: createRuntime({
        light: '<svg>light</svg>',
        dark: '<svg>dark</svg>',
      }),
    });
    const button = document.querySelector<HTMLButtonElement>(`#${STAR_HISTORY_BUTTON_ID}`);

    button?.click();
    expect(document.querySelector(`#${STAR_HISTORY_POPOVER_ID}`)).not.toBeNull();
    document.querySelector<HTMLButtonElement>('[aria-label="Close Star History"]')?.click();
    expect(document.querySelector(`#${STAR_HISTORY_POPOVER_ID}`)).toBeNull();
    expect(button?.getAttribute('aria-expanded')).toBe('false');

    button?.click();
    expect(document.querySelector(`#${STAR_HISTORY_POPOVER_ID}`)).not.toBeNull();
    document.body.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(document.querySelector(`#${STAR_HISTORY_POPOVER_ID}`)).toBeNull();

    button?.click();
    expect(document.querySelector(`#${STAR_HISTORY_POPOVER_ID}`)).not.toBeNull();
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(document.querySelector(`#${STAR_HISTORY_POPOVER_ID}`)).toBeNull();
  });

  it('shows a fallback link when the Star History image fails to load', async () => {
    renderRepositoryMeta();
    syncStarHistoryView(document, '/ultraworkers/claw-code', {
      runtime: {
        sendMessage: vi.fn((_message: unknown, callback: (response: StarHistorySvgResponse) => void) => {
          callback({ ok: false, error: 'CSP-safe load failed' });
        }),
      },
    });

    document.querySelector<HTMLButtonElement>(`#${STAR_HISTORY_BUTTON_ID}`)?.click();

    await vi.waitFor(() => {
      expect(document.querySelector('.qhelper-star-history__error-link')).not.toBeNull();
    });

    const fallback = document.querySelector<HTMLAnchorElement>('.qhelper-star-history__error-link');
    expect(fallback?.textContent).toBe('Open Star History');
    expect(fallback?.href).toBe('https://star-history.com/#ultraworkers/claw-code&Date');
    expect(document.querySelector('img')).toBeNull();
  });

  it('re-renders without duplicating the floating button', () => {
    renderRepositoryMeta();

    syncStarHistoryView(document, '/ultraworkers/claw-code');
    syncStarHistoryView(document, '/ultraworkers/claw-code');

    expect(document.querySelectorAll(`#${STAR_HISTORY_BUTTON_ID}`)).toHaveLength(1);
  });
});

describe('installGitHubStarHistoryView', () => {
  it('renders immediately and registers GitHub navigation listeners', () => {
    renderRepositoryMeta();
    const mutationObserver = stubMutationObserver();
    const fakeWindow = createFakeWindow();
    const runtime = createRuntime({
      light: '<svg>light</svg>',
      dark: '<svg>dark</svg>',
    });

    installGitHubStarHistoryView(fakeWindow, document, { runtime });

    expect(document.querySelector(`#${STAR_HISTORY_BUTTON_ID}`)).not.toBeNull();
    expect(fakeWindow.addEventListener).toHaveBeenCalledWith('popstate', expect.any(Function));
    expect(mutationObserver.observe).toHaveBeenCalledWith(document.documentElement, {
      childList: true,
      subtree: true,
    });
  });

  it('removes the helper when navigating from a repository home page to a subpage', () => {
    renderRepositoryMeta();
    stubMutationObserver();
    const fakeWindow = createFakeWindow();
    const runtime = createRuntime({
      light: '<svg>light</svg>',
      dark: '<svg>dark</svg>',
    });

    installGitHubStarHistoryView(fakeWindow, document, { runtime });
    expect(document.querySelector(`#${STAR_HISTORY_BUTTON_ID}`)).not.toBeNull();

    fakeWindow.setPathname('/ultraworkers/claw-code/issues');
    document.dispatchEvent(new Event('turbo:load'));

    expect(document.querySelector(`#${STAR_HISTORY_BUTTON_ID}`)).toBeNull();
  });

  it('recovers a missing floating button on repository home pages', () => {
    renderRepositoryMeta();
    const mutationObserver = stubMutationObserver();
    const fakeWindow = createFakeWindow();
    const runtime = createRuntime({
      light: '<svg>light</svg>',
      dark: '<svg>dark</svg>',
    });

    installGitHubStarHistoryView(fakeWindow, document, { runtime });
    document.querySelector('[data-qhelper-star-history-root="true"]')?.remove();

    mutationObserver.notify();

    expect(document.querySelector(`#${STAR_HISTORY_BUTTON_ID}`)).not.toBeNull();
  });
});
