import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  installRepositoryPageHelper,
  installRepositoryPageHelpers,
} from './repository-page-helper';

function createFakeWindow(pathname = '/owner/repo'): Window & {
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

describe('installRepositoryPageHelper', () => {
  it('renders immediately and registers GitHub navigation listeners', () => {
    const mutationObserver = stubMutationObserver();
    const fakeWindow = createFakeWindow();
    const render = vi.fn(() => true);

    installRepositoryPageHelper(fakeWindow, document, {
      render,
      shouldRetry: () => true,
      shouldRecoverFromMutation: () => false,
    });

    expect(render).toHaveBeenCalledWith('/owner/repo');
    expect(fakeWindow.addEventListener).toHaveBeenCalledWith('popstate', expect.any(Function));
    expect(mutationObserver.observe).toHaveBeenCalledWith(document.documentElement, {
      childList: true,
      subtree: true,
    });
  });

  it('rerenders after GitHub navigation changes the pathname', () => {
    stubMutationObserver();
    const fakeWindow = createFakeWindow();
    const render = vi.fn(() => true);

    installRepositoryPageHelper(fakeWindow, document, {
      render,
      shouldRetry: () => true,
      shouldRecoverFromMutation: () => false,
    });

    fakeWindow.setPathname('/owner/repo/issues');
    document.dispatchEvent(new Event('turbo:load'));

    expect(render).toHaveBeenLastCalledWith('/owner/repo/issues');
    expect(render).toHaveBeenCalledTimes(2);
  });

  it('retries renderable repository pages when the adapter cannot render yet', () => {
    stubMutationObserver();
    const fakeWindow = createFakeWindow();
    let retryCallback: (() => void) | undefined;
    vi.mocked(fakeWindow.setTimeout).mockImplementation((callback: TimerHandler) => {
      retryCallback = callback as () => void;
      return 123;
    });
    const render = vi.fn(() => false);

    installRepositoryPageHelper(fakeWindow, document, {
      render,
      shouldRetry: () => true,
      shouldRecoverFromMutation: () => false,
    });

    expect(fakeWindow.setTimeout).toHaveBeenCalledWith(expect.any(Function), 250);
    render.mockReturnValue(true);
    retryCallback?.();

    expect(fakeWindow.clearTimeout).toHaveBeenCalledWith(123);
    expect(render).toHaveBeenCalledTimes(2);
  });

  it('lets adapters recover from same-path mutations', () => {
    const mutationObserver = stubMutationObserver();
    const fakeWindow = createFakeWindow();
    const render = vi.fn(() => true);
    const shouldRecoverFromMutation = vi.fn(() => true);

    installRepositoryPageHelper(fakeWindow, document, {
      render,
      shouldRetry: () => true,
      shouldRecoverFromMutation,
    });

    mutationObserver.notify();

    expect(shouldRecoverFromMutation).toHaveBeenCalledWith('/owner/repo');
    expect(render).toHaveBeenCalledTimes(2);
  });

  it('installs multiple helper adapters with one GitHub lifecycle', () => {
    const mutationObserver = stubMutationObserver();
    const fakeWindow = createFakeWindow();
    const firstRender = vi.fn(() => true);
    const secondRender = vi.fn(() => true);

    installRepositoryPageHelpers(fakeWindow, document, [
      {
        render: firstRender,
        shouldRetry: () => false,
        shouldRecoverFromMutation: () => false,
      },
      {
        render: secondRender,
        shouldRetry: () => false,
        shouldRecoverFromMutation: () => true,
      },
    ]);

    expect(fakeWindow.addEventListener).toHaveBeenCalledTimes(1);
    expect(mutationObserver.observe).toHaveBeenCalledTimes(1);

    mutationObserver.notify();

    expect(firstRender).toHaveBeenCalledTimes(1);
    expect(secondRender).toHaveBeenCalledTimes(2);
  });

  it('keeps one adapter retry pending while another adapter recovers from mutation', () => {
    const mutationObserver = stubMutationObserver();
    const fakeWindow = createFakeWindow();
    let retryCallback: (() => void) | undefined;
    vi.mocked(fakeWindow.setTimeout).mockImplementation((callback: TimerHandler) => {
      retryCallback = callback as () => void;
      return 123;
    });
    const firstRender = vi.fn(() => false);
    const secondRender = vi.fn(() => true);

    installRepositoryPageHelpers(fakeWindow, document, [
      {
        render: firstRender,
        shouldRetry: () => true,
        shouldRecoverFromMutation: () => false,
      },
      {
        render: secondRender,
        shouldRetry: () => false,
        shouldRecoverFromMutation: () => true,
      },
    ]);

    mutationObserver.notify();
    firstRender.mockReturnValue(true);
    retryCallback?.();

    expect(firstRender).toHaveBeenCalledTimes(2);
    expect(secondRender).toHaveBeenCalledTimes(2);
  });
});
