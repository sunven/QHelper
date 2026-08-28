import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useToolHistory } from './useToolHistory'
import { getToolStateStorageKey } from '@/lib/chrome/local-persisted-data'

type Snapshot = { value: string }

describe('useToolHistory', () => {
  const toolId = 'cron'
  const storageKey = getToolStateStorageKey(toolId, 'cron-state')

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('mirrors persisted entries once loaded', async () => {
    vi.mocked(chrome.storage.local.get).mockImplementation(
      () =>
        Promise.resolve({
          [storageKey]: [
            { id: 'one', timestamp: 1, input: { value: 'a' } },
          ],
        }) as never,
    )

    const { result } = renderHook(() =>
      useToolHistory<Snapshot>(toolId, { max: 10, key: 'cron-state' }),
    )

    expect(result.current.loading).toBe(true)
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.history).toEqual([
      { id: 'one', timestamp: 1, input: { value: 'a' } },
    ])
  })

  it('updates the mirrored history when a snapshot is added', async () => {
    vi.mocked(chrome.storage.local.get).mockImplementation(
      () => Promise.resolve({}) as never,
    )

    const { result } = renderHook(() =>
      useToolHistory<Snapshot>(toolId, { key: 'cron-state' }),
    )

    await waitFor(() => expect(result.current.loading).toBe(false))

    act(() => {
      result.current.add({ value: 'a' }, { note: 'first' })
    })

    expect(result.current.history).toHaveLength(1)
    expect(result.current.history[0]).toMatchObject({
      input: { value: 'a' },
      metadata: { note: 'first' },
    })
    expect(chrome.storage.local.set).toHaveBeenCalledWith({
      [storageKey]: [
        expect.objectContaining({ input: { value: 'a' } }),
      ],
    })
  })
})
