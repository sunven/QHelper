import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { usePersistedValue } from './usePersistedValue'

describe('usePersistedValue', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    ;(chrome.storage.local.get as any).mockImplementation(() =>
      Promise.resolve({}),
    )
    ;(chrome.storage.local.set as any).mockImplementation(() =>
      Promise.resolve(),
    )
  })

  it('starts loading, then mirrors the persisted value', async () => {
    ;(chrome.storage.local.get as any).mockImplementation(() =>
      Promise.resolve({ myKey: { count: 3 } }),
    )

    const { result } = renderHook(() =>
      usePersistedValue('myKey', { count: 0 }),
    )

    expect(result.current.loading).toBe(true)

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })
    expect(result.current.value).toEqual({ count: 3 })
  })

  it('falls back to the initial value when nothing is persisted', async () => {
    const { result } = renderHook(() =>
      usePersistedValue('myKey', { count: 7 }),
    )

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })
    expect(result.current.value).toEqual({ count: 7 })
  })

  it('optimistically updates the value and writes it through', async () => {
    const { result } = renderHook(() =>
      usePersistedValue('myKey', { count: 0 }),
    )
    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    await act(async () => {
      await result.current.setValue({ count: 1 })
    })

    expect(result.current.value).toEqual({ count: 1 })
    expect(chrome.storage.local.set).toHaveBeenCalledWith({
      myKey: { count: 1 },
    })
  })

  it('supports functional updates from the previous value', async () => {
    ;(chrome.storage.local.get as any).mockImplementation(() =>
      Promise.resolve({ myKey: { count: 5 } }),
    )
    const { result } = renderHook(() =>
      usePersistedValue('myKey', { count: 0 }),
    )
    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    await act(async () => {
      await result.current.setValue((prev) => ({ count: prev.count + 2 }))
    })

    expect(result.current.value).toEqual({ count: 7 })
  })

  it('keeps the new value when the write fails (optimistic)', async () => {
    // chrome 与 localStorage 两层都写失败
    ;(chrome.storage.local.set as any).mockImplementation(() =>
      Promise.reject(new Error('quota')),
    )
    const setItemSpy = vi
      .spyOn(Storage.prototype, 'setItem')
      .mockImplementation(() => {
        throw new Error('localStorage full')
      })

    const { result } = renderHook(() =>
      usePersistedValue('myKey', { count: 0 }),
    )
    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    await act(async () => {
      await result.current.setValue({ count: 9 })
    })

    expect(result.current.value).toEqual({ count: 9 })
    setItemSpy.mockRestore()
  })

  it('mirrors cross-tab updates through the storage change listener', async () => {
    let listener:
      | ((
          changes: Record<string, chrome.storage.StorageChange>,
          area: string,
        ) => void)
      | undefined
    ;(chrome.storage.onChanged.addListener as any).mockImplementation(
      (fn: typeof listener) => {
        listener = fn
      },
    )

    const { result } = renderHook(() =>
      usePersistedValue('myKey', { count: 0 }),
    )
    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    act(() => {
      listener?.(
        { myKey: { newValue: { count: 42 } } } as Record<
          string,
          chrome.storage.StorageChange
        >,
        'local',
      )
    })

    expect(result.current.value).toEqual({ count: 42 })
  })
})
