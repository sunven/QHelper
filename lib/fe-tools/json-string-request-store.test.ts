import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  LEGACY_REQUEST_DATA_STORAGE_KEY,
  MAX_CAPTURED_JSON_STRING_REQUESTS,
  REQUEST_DATA_STORAGE_KEY,
  appendCapturedJsonStringRequest,
  clearCapturedJsonStringRequests,
  getCapturedJsonStringRequests,
  setCapturedJsonStringRequests,
  subscribeCapturedJsonStringRequests,
  type CapturedJsonStringRequest,
} from './json-string-request-store'

const capturedRequest: CapturedJsonStringRequest = {
  request: { url: 'http://localhost:3000/api' },
  response: { status: 200 },
  content: '{"payload":"{\\"ok\\":true}"}',
}

describe('fe-tools/json-string-request-store', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(chrome.storage.local.get).mockImplementation(
      () => Promise.resolve({}) as never,
    )
    vi.mocked(chrome.storage.local.set).mockImplementation(
      () => Promise.resolve() as never,
    )
    vi.mocked(chrome.storage.sync.get).mockImplementation(
      () => Promise.resolve({}) as never,
    )
    vi.mocked(chrome.storage.sync.set).mockImplementation(
      () => Promise.resolve() as never,
    )
  })

  it('reads captured requests from local storage', async () => {
    vi.mocked(chrome.storage.local.get).mockImplementationOnce(
      () =>
        Promise.resolve({
          [REQUEST_DATA_STORAGE_KEY]: [capturedRequest],
        }) as never,
    )

    await expect(getCapturedJsonStringRequests()).resolves.toEqual([
      capturedRequest,
    ])
    expect(chrome.storage.local.get).toHaveBeenCalledWith(
      REQUEST_DATA_STORAGE_KEY,
    )
    expect(chrome.storage.sync.get).not.toHaveBeenCalled()
  })

  it('migrates legacy captured requests to the namespaced key', async () => {
    vi.mocked(chrome.storage.local.get)
      .mockImplementationOnce(() => Promise.resolve({}) as never)
      .mockImplementationOnce(
        () =>
          Promise.resolve({
            [LEGACY_REQUEST_DATA_STORAGE_KEY]: [capturedRequest],
          }) as never,
      )

    await expect(getCapturedJsonStringRequests()).resolves.toEqual([
      capturedRequest,
    ])
    expect(chrome.storage.local.set).toHaveBeenCalledWith({
      [REQUEST_DATA_STORAGE_KEY]: [capturedRequest],
    })
    expect(chrome.storage.local.remove).toHaveBeenCalledWith(
      LEGACY_REQUEST_DATA_STORAGE_KEY,
    )
  })

  it('writes captured requests only to local storage', async () => {
    await setCapturedJsonStringRequests([capturedRequest])

    expect(chrome.storage.local.set).toHaveBeenCalledWith({
      [REQUEST_DATA_STORAGE_KEY]: [capturedRequest],
    })
    expect(chrome.storage.sync.set).not.toHaveBeenCalled()
  })

  it('appends captured requests', async () => {
    const previousRequest = {
      ...capturedRequest,
      request: { url: 'http://localhost:3000/previous' },
    }
    vi.mocked(chrome.storage.local.get).mockImplementationOnce(
      () =>
        Promise.resolve({
          [REQUEST_DATA_STORAGE_KEY]: [previousRequest],
        }) as never,
    )

    await appendCapturedJsonStringRequest(capturedRequest)

    expect(chrome.storage.local.set).toHaveBeenCalledWith({
      [REQUEST_DATA_STORAGE_KEY]: [previousRequest, capturedRequest],
    })
  })

  it('keeps only the newest captured requests', async () => {
    const capturedRequests = Array.from(
      { length: MAX_CAPTURED_JSON_STRING_REQUESTS },
      (_, index) => ({
        ...capturedRequest,
        request: { url: `http://localhost:3000/${index}` },
      }),
    )
    vi.mocked(chrome.storage.local.get).mockImplementationOnce(
      () =>
        Promise.resolve({
          [REQUEST_DATA_STORAGE_KEY]: capturedRequests,
        }) as never,
    )
    const nextRequest = {
      ...capturedRequest,
      request: { url: 'http://localhost:3000/newest' },
    }

    await appendCapturedJsonStringRequest(nextRequest)

    const storedValue = vi.mocked(chrome.storage.local.set).mock.calls[0]
      ?.[0] as Record<string, CapturedJsonStringRequest[]>
    const storedRequests = storedValue[REQUEST_DATA_STORAGE_KEY]
    expect(storedRequests).toHaveLength(MAX_CAPTURED_JSON_STRING_REQUESTS)
    expect(storedRequests[0].request.url).toBe('http://localhost:3000/1')
    expect(storedRequests[storedRequests.length - 1]).toEqual(nextRequest)
  })

  it('clears captured requests', async () => {
    await clearCapturedJsonStringRequests()

    expect(chrome.storage.local.set).toHaveBeenCalledWith({
      [REQUEST_DATA_STORAGE_KEY]: [],
    })
    expect(chrome.storage.local.remove).toHaveBeenCalledWith(
      LEGACY_REQUEST_DATA_STORAGE_KEY,
    )
  })

  it('subscribes to local captured request changes', () => {
    const listener = vi.fn()
    const unsubscribe = subscribeCapturedJsonStringRequests(listener)
    const calls = vi.mocked(chrome.storage.onChanged.addListener).mock.calls
    const handleChange = calls[calls.length - 1]?.[0]

    handleChange?.(
      {
        [REQUEST_DATA_STORAGE_KEY]: {
          newValue: [capturedRequest],
        },
      },
      'local',
    )
    handleChange?.(
      {
        [REQUEST_DATA_STORAGE_KEY]: {
          newValue: [],
        },
      },
      'sync',
    )

    expect(listener).toHaveBeenCalledTimes(1)
    expect(listener).toHaveBeenCalledWith([capturedRequest])
    unsubscribe()
    expect(chrome.storage.onChanged.removeListener).toHaveBeenCalledWith(
      handleChange,
    )
  })
})
