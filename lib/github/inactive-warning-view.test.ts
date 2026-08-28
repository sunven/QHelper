import { afterEach, describe, expect, it, vi } from 'vitest'
import type { InactiveWarningResponse } from './inactive-warning-background'
import {
  INACTIVE_WARNING_TIMESTAMP_CLASS,
  installGitHubInactiveWarningView,
  syncInactiveWarningView,
} from './inactive-warning-view'

const INACTIVE_COMMIT_DATE = '2026-01-01T00:00:00.000Z'
const OTHER_COMMIT_DATE = '2025-06-01T00:00:00.000Z'

function renderRepositoryMeta(
  owner = 'ultraworkers',
  repo = 'claw-code',
): void {
  document.head.innerHTML = `
    <meta
      name="octolytics-dimension-repository_nwo"
      content="${owner}/${repo}"
    />
  `
  document.body.innerHTML = `
    <main>
      <div class="react-directory-row">
        <relative-time datetime="${INACTIVE_COMMIT_DATE}">
          <span part="root">8 months ago</span>
        </relative-time>
      </div>
      <div data-testid="latest-commit-details">
        <relative-time datetime="${INACTIVE_COMMIT_DATE}">
          <span part="root">8 months ago</span>
        </relative-time>
      </div>
      <section aria-label="About">
        <relative-time datetime="${OTHER_COMMIT_DATE}">
          <span part="root">on 1 Jun 2025</span>
        </relative-time>
      </section>
    </main>
  `
  window.history.pushState({}, '', `/${owner}/${repo}`)
}

function highlightedCount(): number {
  return document.querySelectorAll(
    `relative-time.${INACTIVE_WARNING_TIMESTAMP_CLASS}`,
  ).length
}

function createFakeWindow(pathname = '/ultraworkers/claw-code'): Window & {
  listeners: Record<string, Array<() => void>>
  setPathname: (nextPathname: string) => void
} {
  const listeners: Record<string, Array<() => void>> = {}
  let currentPathname = pathname

  return {
    listeners,
    location: {
      get pathname() {
        return currentPathname
      },
    },
    setPathname(nextPathname: string) {
      currentPathname = nextPathname
    },
    setTimeout: vi.fn(() => 123),
    clearTimeout: vi.fn(),
    addEventListener: vi.fn((eventName: string, listener: () => void) => {
      listeners[eventName] ??= []
      listeners[eventName].push(listener)
    }),
  } as unknown as Window & {
    listeners: Record<string, Array<() => void>>
    setPathname: (nextPathname: string) => void
  }
}

function stubMutationObserver() {
  let mutationCallback: MutationCallback | undefined
  const observe = vi.fn()

  class MockMutationObserver {
    observe = observe

    constructor(callback: MutationCallback) {
      mutationCallback = callback
    }
  }

  vi.stubGlobal('MutationObserver', MockMutationObserver)

  return {
    observe,
    notify: () => mutationCallback?.([], {} as MutationObserver),
  }
}

function createRuntime(response: InactiveWarningResponse) {
  return {
    sendMessage: vi.fn(
      (
        _message: unknown,
        callback: (value: InactiveWarningResponse) => void,
      ) => {
        callback(response)
      },
    ),
  }
}

function createDeferredRuntime() {
  let pending: Array<(value: InactiveWarningResponse) => void> = []
  const sendMessage = vi.fn(
    (_message: unknown, callback: (value: InactiveWarningResponse) => void) => {
      pending.push(callback)
    },
  )

  return {
    sendMessage,
    respond: (response: InactiveWarningResponse) => {
      const callbacks = pending
      pending = []
      for (const callback of callbacks) {
        callback(response)
      }
    },
  }
}

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
  document.head.innerHTML = ''
  document.body.innerHTML = ''
  window.history.pushState({}, '', '/')
})

describe('syncInactiveWarningView', () => {
  it('requests the activity verdict on repository home pages', () => {
    renderRepositoryMeta('sunven', 'qhelper')
    const runtime = createRuntime({ ok: true, inactive: false })

    expect(
      syncInactiveWarningView(document, '/sunven/qhelper', { runtime }),
    ).toBe(true)

    expect(runtime.sendMessage).toHaveBeenCalledWith(
      {
        type: 'QHELPER_INACTIVE_WARNING',
        repo: { owner: 'sunven', repo: 'qhelper' },
      },
      expect.any(Function),
    )
    expect(highlightedCount()).toBe(0)
  })

  it('highlights the last commit timestamp when the repository is inactive', () => {
    renderRepositoryMeta('ultraworkers', 'claw-code')

    syncInactiveWarningView(document, '/ultraworkers/claw-code', {
      runtime: createRuntime({
        ok: true,
        inactive: true,
        lastCommitDate: INACTIVE_COMMIT_DATE,
      }),
    })

    const highlighted = document.querySelectorAll(
      `relative-time.${INACTIVE_WARNING_TIMESTAMP_CLASS}`,
    )
    expect(highlighted).toHaveLength(1)
    expect(highlighted[0]?.getAttribute('datetime')).toBe(INACTIVE_COMMIT_DATE)
    expect(
      highlighted[0]?.closest('[data-testid="latest-commit-details"]'),
    ).not.toBeNull()
    expect(
      document.querySelector('section[aria-label="About"] relative-time')
        ?.classList,
    ).not.toContain(INACTIVE_WARNING_TIMESTAMP_CLASS)
    expect(
      document.getElementById('qhelper-inactive-warning-style'),
    ).not.toBeNull()
  })

  it('leaves timestamps untouched when the repository is active', () => {
    renderRepositoryMeta('vercel', 'next.js')

    syncInactiveWarningView(document, '/vercel/next.js', {
      runtime: createRuntime({
        ok: true,
        inactive: false,
        lastCommitDate: INACTIVE_COMMIT_DATE,
      }),
    })

    expect(highlightedCount()).toBe(0)
  })

  it('leaves timestamps untouched when the background check fails', () => {
    renderRepositoryMeta('facebook', 'react')

    syncInactiveWarningView(document, '/facebook/react', {
      runtime: createRuntime({ ok: false, error: 'rate limited' }),
    })

    expect(highlightedCount()).toBe(0)
  })

  it('does not highlight or request on repository subpages', () => {
    renderRepositoryMeta('sindresorhus', 'is')
    const runtime = createRuntime({ ok: true, inactive: false })

    expect(
      syncInactiveWarningView(document, '/sindresorhus/is/pull/12', {
        runtime,
      }),
    ).toBe(false)

    expect(runtime.sendMessage).not.toHaveBeenCalled()
    expect(highlightedCount()).toBe(0)
  })

  it('does not highlight on non-repository two-segment paths', () => {
    renderRepositoryMeta()
    document.head.innerHTML = ''

    expect(
      syncInactiveWarningView(document, '/features/copilot', {
        runtime: createRuntime({ ok: true, inactive: false }),
      }),
    ).toBe(false)

    expect(highlightedCount()).toBe(0)
  })

  it('re-applies the highlight without duplicating it', () => {
    renderRepositoryMeta('microsoft', 'typescript')
    const runtime = createRuntime({
      ok: true,
      inactive: true,
      lastCommitDate: INACTIVE_COMMIT_DATE,
    })
    const deps = { runtime }

    syncInactiveWarningView(document, '/microsoft/typescript', deps)
    syncInactiveWarningView(document, '/microsoft/typescript', deps)

    expect(highlightedCount()).toBe(1)
    expect(
      document.querySelectorAll('#qhelper-inactive-warning-style'),
    ).toHaveLength(1)
  })

  it('uses a known verdict without a second request', () => {
    renderRepositoryMeta('denoland', 'deno')
    const runtime = createRuntime({
      ok: true,
      inactive: true,
      lastCommitDate: INACTIVE_COMMIT_DATE,
    })
    const deps = { runtime }

    syncInactiveWarningView(document, '/denoland/deno', deps)
    expect(runtime.sendMessage).toHaveBeenCalledTimes(1)

    document
      .querySelector(`relative-time.${INACTIVE_WARNING_TIMESTAMP_CLASS}`)
      ?.classList.remove(INACTIVE_WARNING_TIMESTAMP_CLASS)
    syncInactiveWarningView(document, '/denoland/deno', deps)

    expect(runtime.sendMessage).toHaveBeenCalledTimes(1)
    expect(highlightedCount()).toBe(1)
  })

  it('does not apply a stale verdict after navigating to another repository', () => {
    renderRepositoryMeta('old-owner', 'old-repo')
    const runtime = createDeferredRuntime()

    syncInactiveWarningView(document, '/old-owner/old-repo', { runtime })
    expect(runtime.sendMessage).toHaveBeenCalledTimes(1)

    renderRepositoryMeta('new-owner', 'new-repo')

    runtime.respond({
      ok: true,
      inactive: true,
      lastCommitDate: INACTIVE_COMMIT_DATE,
    })

    expect(highlightedCount()).toBe(0)
  })
})

describe('installGitHubInactiveWarningView', () => {
  it('registers GitHub navigation listeners', async () => {
    renderRepositoryMeta('ultraworkers', 'claw-code')
    const mutationObserver = stubMutationObserver()
    const fakeWindow = createFakeWindow()

    installGitHubInactiveWarningView(fakeWindow, document, {
      runtime: createRuntime({
        ok: true,
        inactive: true,
        lastCommitDate: INACTIVE_COMMIT_DATE,
      }),
    })

    await vi.waitFor(() => {
      expect(highlightedCount()).toBe(1)
    })
    expect(fakeWindow.addEventListener).toHaveBeenCalledWith(
      'popstate',
      expect.any(Function),
    )
    expect(mutationObserver.observe).toHaveBeenCalledWith(
      document.documentElement,
      {
        childList: true,
        subtree: true,
      },
    )
  })

  it('clears the highlight when navigating from a repository home page to a subpage', async () => {
    renderRepositoryMeta('ultraworkers', 'claw-code')
    stubMutationObserver()
    const fakeWindow = createFakeWindow()

    installGitHubInactiveWarningView(fakeWindow, document, {
      runtime: createRuntime({
        ok: true,
        inactive: true,
        lastCommitDate: INACTIVE_COMMIT_DATE,
      }),
    })

    await vi.waitFor(() => {
      expect(highlightedCount()).toBe(1)
    })

    fakeWindow.setPathname('/ultraworkers/claw-code/issues')
    document.dispatchEvent(new Event('turbo:load'))

    expect(highlightedCount()).toBe(0)
  })

  it('recovers the highlight after DOM mutation', async () => {
    renderRepositoryMeta('ultraworkers', 'claw-code')
    const mutationObserver = stubMutationObserver()
    const fakeWindow = createFakeWindow()

    installGitHubInactiveWarningView(fakeWindow, document, {
      runtime: createRuntime({
        ok: true,
        inactive: true,
        lastCommitDate: INACTIVE_COMMIT_DATE,
      }),
    })

    await vi.waitFor(() => {
      expect(highlightedCount()).toBe(1)
    })
    document
      .querySelector(`relative-time.${INACTIVE_WARNING_TIMESTAMP_CLASS}`)
      ?.classList.remove(INACTIVE_WARNING_TIMESTAMP_CLASS)

    mutationObserver.notify()

    expect(highlightedCount()).toBe(1)
  })
})
