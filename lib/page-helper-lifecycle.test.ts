import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  installPageHelpers,
  type PageHelperAdapter,
  type PageHelperSiteProfile,
} from './page-helper-lifecycle'

const GITHUB_PROFILE: PageHelperSiteProfile = {
  documentEvents: ['turbo:load', 'pjax:end'],
  windowEvents: ['popstate'],
}

function createFakeWindow(pathname = '/owner/repo'): Window & {
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
    removeEventListener: vi.fn((eventName: string, listener: () => void) => {
      listeners[eventName] = (listeners[eventName] ?? []).filter(
        (candidate) => candidate !== listener,
      )
    }),
  } as unknown as Window & {
    listeners: Record<string, Array<() => void>>
    setPathname: (nextPathname: string) => void
  }
}

function stubMutationObserver() {
  let mutationCallback: MutationCallback | undefined
  const observe = vi.fn()
  const disconnect = vi.fn()

  class MockMutationObserver {
    observe = observe
    disconnect = disconnect

    constructor(callback: MutationCallback) {
      mutationCallback = callback
    }
  }

  vi.stubGlobal('MutationObserver', MockMutationObserver)

  return {
    observe,
    disconnect,
    notify: () => mutationCallback?.([], {} as MutationObserver),
  }
}

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('installPageHelpers', () => {
  it('renders immediately and registers the site profile listeners', () => {
    const mutationObserver = stubMutationObserver()
    const fakeWindow = createFakeWindow()
    const render = vi.fn(() => true)

    installPageHelpers(fakeWindow, document, GITHUB_PROFILE, [
      { render, shouldRetry: () => true },
    ])

    expect(render).toHaveBeenCalledWith('/owner/repo')
    expect(fakeWindow.addEventListener).toHaveBeenCalledWith(
      'popstate',
      expect.any(Function),
    )
    expect(mutationObserver.observe).toHaveBeenCalledWith(
      document.documentElement,
      { childList: true, subtree: true },
    )
  })

  it('rerenders after a profile navigation event changes the pathname', () => {
    stubMutationObserver()
    const fakeWindow = createFakeWindow()
    const render = vi.fn(() => true)

    installPageHelpers(fakeWindow, document, GITHUB_PROFILE, [
      { render, shouldRetry: () => true },
    ])

    fakeWindow.setPathname('/owner/repo/issues')
    document.dispatchEvent(new Event('turbo:load'))

    expect(render).toHaveBeenLastCalledWith('/owner/repo/issues')
    expect(render).toHaveBeenCalledTimes(2)
  })

  it('retries renderable pages when the adapter cannot render yet', () => {
    stubMutationObserver()
    const fakeWindow = createFakeWindow()
    let retryCallback: (() => void) | undefined
    vi.mocked(fakeWindow.setTimeout).mockImplementation(
      (callback: TimerHandler) => {
        retryCallback = callback as () => void
        return 123
      },
    )
    const render = vi.fn(() => false)

    installPageHelpers(fakeWindow, document, GITHUB_PROFILE, [
      { render, shouldRetry: () => true },
    ])

    expect(fakeWindow.setTimeout).toHaveBeenCalledWith(
      expect.any(Function),
      250,
    )
    render.mockReturnValue(true)
    retryCallback?.()

    expect(fakeWindow.clearTimeout).toHaveBeenCalledWith(123)
    expect(render).toHaveBeenCalledTimes(2)
  })

  it('lets adapters recover from same-path mutations', () => {
    const mutationObserver = stubMutationObserver()
    const fakeWindow = createFakeWindow()
    const render = vi.fn(() => true)
    const shouldRecoverFromMutation = vi.fn(() => true)

    installPageHelpers(fakeWindow, document, GITHUB_PROFILE, [
      { render, shouldRecoverFromMutation },
    ])

    mutationObserver.notify()

    expect(shouldRecoverFromMutation).toHaveBeenCalledWith('/owner/repo')
    expect(render).toHaveBeenCalledTimes(2)
  })

  it('does not recover adapters that omit shouldRecoverFromMutation', () => {
    const mutationObserver = stubMutationObserver()
    const fakeWindow = createFakeWindow()
    const render = vi.fn(() => true)

    installPageHelpers(fakeWindow, document, GITHUB_PROFILE, [{ render }])

    mutationObserver.notify()

    expect(render).toHaveBeenCalledTimes(1)
  })

  it('installs multiple helper adapters with one lifecycle', () => {
    const mutationObserver = stubMutationObserver()
    const fakeWindow = createFakeWindow()
    const firstRender = vi.fn(() => true)
    const secondRender = vi.fn(() => true)

    installPageHelpers(fakeWindow, document, GITHUB_PROFILE, [
      { render: firstRender },
      { render: secondRender, shouldRecoverFromMutation: () => true },
    ])

    expect(fakeWindow.addEventListener).toHaveBeenCalledTimes(1)
    expect(mutationObserver.observe).toHaveBeenCalledTimes(1)

    mutationObserver.notify()

    expect(firstRender).toHaveBeenCalledTimes(1)
    expect(secondRender).toHaveBeenCalledTimes(2)
  })

  it('keeps one adapter retry pending while another adapter recovers from mutation', () => {
    const mutationObserver = stubMutationObserver()
    const fakeWindow = createFakeWindow()
    let retryCallback: (() => void) | undefined
    vi.mocked(fakeWindow.setTimeout).mockImplementation(
      (callback: TimerHandler) => {
        retryCallback = callback as () => void
        return 123
      },
    )
    const firstRender = vi.fn(() => false)
    const secondRender = vi.fn(() => true)

    installPageHelpers(fakeWindow, document, GITHUB_PROFILE, [
      { render: firstRender, shouldRetry: () => true },
      { render: secondRender, shouldRecoverFromMutation: () => true },
    ])

    mutationObserver.notify()
    firstRender.mockReturnValue(true)
    retryCallback?.()

    expect(firstRender).toHaveBeenCalledTimes(2)
    expect(secondRender).toHaveBeenCalledTimes(2)
  })

  it('stops retrying after maxAttempts within one retry chain', () => {
    stubMutationObserver()
    const fakeWindow = createFakeWindow()
    let retryCallback: (() => void) | undefined
    vi.mocked(fakeWindow.setTimeout).mockImplementation(
      (callback: TimerHandler) => {
        retryCallback = callback as () => void
        return 123
      },
    )
    const render = vi.fn(() => false)

    installPageHelpers(
      fakeWindow,
      document,
      GITHUB_PROFILE,
      [{ render, shouldRetry: () => true }],
      { maxAttempts: 3 },
    )

    // 首次 render 计 1 次，retry 链内再计 2 次后达到预算
    retryCallback?.()
    retryCallback?.()
    const scheduleCalls = vi.mocked(fakeWindow.setTimeout).mock.calls.length

    retryCallback?.()

    expect(render).toHaveBeenCalledTimes(3)
    expect(vi.mocked(fakeWindow.setTimeout).mock.calls.length).toBe(
      scheduleCalls,
    )
  })

  it('resumes retrying with a fresh budget after a navigation event', () => {
    stubMutationObserver()
    const fakeWindow = createFakeWindow()
    let retryCallback: (() => void) | undefined
    vi.mocked(fakeWindow.setTimeout).mockImplementation(
      (callback: TimerHandler) => {
        retryCallback = callback as () => void
        return 123
      },
    )
    const render = vi.fn(() => false)

    installPageHelpers(
      fakeWindow,
      document,
      GITHUB_PROFILE,
      [{ render, shouldRetry: () => true }],
      { maxAttempts: 2 },
    )

    retryCallback?.()
    // 预算用尽，重试链停止
    retryCallback?.()
    const renderCountAfterBudget = render.mock.calls.length

    fakeWindow.setPathname('/owner/repo/pulls')
    document.dispatchEvent(new Event('pjax:end'))

    expect(render.mock.calls.length).toBeGreaterThan(renderCountAfterBudget)
    expect(render).toHaveBeenLastCalledWith('/owner/repo/pulls')
  })

  it('dispose removes listeners, disconnects the observer, and clears timers', () => {
    const mutationObserver = stubMutationObserver()
    const fakeWindow = createFakeWindow()
    let retryCallback: (() => void) | undefined
    vi.mocked(fakeWindow.setTimeout).mockImplementation(
      (callback: TimerHandler) => {
        retryCallback = callback as () => void
        return 123
      },
    )
    const render = vi.fn(() => false)

    const dispose = installPageHelpers(fakeWindow, document, GITHUB_PROFILE, [
      { render, shouldRetry: () => true },
    ])

    dispose()

    expect(mutationObserver.disconnect).toHaveBeenCalled()
    expect(fakeWindow.removeEventListener).toHaveBeenCalledWith(
      'popstate',
      expect.any(Function),
    )
    expect(fakeWindow.clearTimeout).toHaveBeenCalledWith(123)

    // dispose 后导航事件与 retry 回调都不再触发渲染
    fakeWindow.setPathname('/owner/repo/issues')
    document.dispatchEvent(new Event('turbo:load'))
    retryCallback?.()

    expect(render).toHaveBeenCalledTimes(1)
  })

  it('supports a popstate-only profile for sites without turbo or pjax', () => {
    stubMutationObserver()
    const fakeWindow = createFakeWindow()
    const render = vi.fn(() => true)
    const popstateOnlyProfile: PageHelperSiteProfile = {
      windowEvents: ['popstate'],
    }

    installPageHelpers(fakeWindow, document, popstateOnlyProfile, [{ render }])

    expect(fakeWindow.addEventListener).toHaveBeenCalledTimes(1)
    expect(fakeWindow.addEventListener).toHaveBeenCalledWith(
      'popstate',
      expect.any(Function),
    )

    // popstate 且 path 未变化：不重复渲染
    fakeWindow.listeners.popstate?.[0]?.()
    expect(render).toHaveBeenCalledTimes(1)

    // popstate 且 path 变化：重新渲染
    fakeWindow.setPathname('/owner/other-repo')
    fakeWindow.listeners.popstate?.[0]?.()
    expect(render).toHaveBeenCalledTimes(2)
    expect(render).toHaveBeenLastCalledWith('/owner/other-repo')
  })

  it('calls onInstall for each helper', () => {
    stubMutationObserver()
    const fakeWindow = createFakeWindow()
    const onInstall = vi.fn()

    const adapter: PageHelperAdapter = { render: () => true, onInstall }

    installPageHelpers(fakeWindow, document, GITHUB_PROFILE, [adapter])

    expect(onInstall).toHaveBeenCalledTimes(1)
  })
})
