import { act, renderHook, waitFor } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import type { SettingDefinition } from '@/lib/settings'
import { createFakeSettingDefinition } from './testing/createFakeSettingDefinition'
import { useToolSettingControl } from './useToolSettingControl'

describe('useToolSettingControl', () => {
  it('loads the stored value on mount', async () => {
    const definition = createFakeSettingDefinition(
      { enabled: false },
      { enabled: true },
    )
    const { result } = renderHook(() => useToolSettingControl(definition))

    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.value).toEqual({ enabled: true })
    expect(result.current.error).toBeNull()
  })

  it('reports a load failure instead of leaving defaults silently', async () => {
    const definition = createFakeSettingDefinition(
      { enabled: false },
      { enabled: true },
    )
    definition.get = async () => {
      throw new Error('storage unavailable')
    }
    const { result } = renderHook(() => useToolSettingControl(definition))

    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.error).toBe('设置加载失败')
  })

  it('applies optimistic updates and commits the saved value', async () => {
    const definition = createFakeSettingDefinition(
      { enabled: false },
      { enabled: false },
    )
    const { result } = renderHook(() => useToolSettingControl(definition))

    await waitFor(() => expect(result.current.loading).toBe(false))
    await act(async () => {
      await result.current.change({ enabled: true })
    })

    expect(result.current.value).toEqual({ enabled: true })
    expect(result.current.saving).toBe(false)
    expect(result.current.error).toBeNull()
    expect(result.current.syncNotice).toBeNull()
  })

  it('rolls back to the stored value when the save fails', async () => {
    const definition = createFakeSettingDefinition(
      { enabled: false },
      { enabled: false },
    )
    definition.failNextSave()
    const { result } = renderHook(() => useToolSettingControl(definition))

    await waitFor(() => expect(result.current.loading).toBe(false))
    await act(async () => {
      await result.current.change({ enabled: true })
    })

    expect(result.current.error).toBe('保存失败，请重试')
    expect(result.current.value).toEqual({ enabled: false })
  })

  it('shows the Local Setting Fallback notice when saved locally', async () => {
    const definition = createFakeSettingDefinition(
      { enabled: false },
      { enabled: false },
    )
    definition.forceLocalSaves()
    const { result } = renderHook(() => useToolSettingControl(definition))

    await waitFor(() => expect(result.current.loading).toBe(false))
    await act(async () => {
      await result.current.change({ enabled: true })
    })

    expect(result.current.syncNotice).toBe('已保存到本机，暂未同步')
    expect(result.current.value).toEqual({ enabled: true })
  })

  it('applies functional changes against the latest value', async () => {
    const definition = createFakeSettingDefinition<{ ids: string[] }>(
      { ids: [] },
      { ids: [] },
    )
    const { result } = renderHook(() => useToolSettingControl(definition))
    await waitFor(() => expect(result.current.loading).toBe(false))

    await act(async () => {
      await result.current.change((previous) => ({
        ids: [...previous.ids, 'a'],
      }))
      await result.current.change((previous) => ({
        ids: [...previous.ids, 'b'],
      }))
    })

    expect(result.current.value).toEqual({ ids: ['a', 'b'] })
  })

  it('ignores a stale save result when a newer change is issued', async () => {
    type Settings = { enabled: boolean; note: string }
    const pendingSaves: Array<{
      next: Partial<Settings>
      resolve: (settings: Settings) => void
    }> = []
    const definition: SettingDefinition<Settings> = {
      key: 'race-setting',
      defaults: { enabled: false, note: '' },
      get: async () => ({ enabled: false, note: '' }),
      set: (next) =>
        new Promise((resolve) => {
          pendingSaves.push({
            next,
            resolve: (settings) => resolve({ settings, storageArea: 'sync' }),
          })
        }),
      subscribe: () => () => undefined,
      reset: async () => ({
        settings: { enabled: false, note: '' },
        storageArea: 'sync',
      }),
    }

    const { result } = renderHook(() => useToolSettingControl(definition))
    await waitFor(() => expect(result.current.loading).toBe(false))

    let firstChange: Promise<void> | undefined
    let secondChange: Promise<void> | undefined
    await act(async () => {
      firstChange = result.current.change({ enabled: true })
      secondChange = result.current.change({ note: 'latest' })
    })
    await waitFor(() => expect(pendingSaves).toHaveLength(2))

    await act(async () => {
      pendingSaves[1].resolve({ enabled: true, note: 'latest' })
      await secondChange
      pendingSaves[0].resolve({ enabled: true, note: '' })
      await firstChange
    })

    expect(result.current.value).toEqual({ enabled: true, note: 'latest' })
    expect(result.current.saving).toBe(false)
  })

  it('follows external changes through the subscription', async () => {
    const definition = createFakeSettingDefinition(
      { enabled: false },
      { enabled: false },
    )
    const { result } = renderHook(() => useToolSettingControl(definition))

    await waitFor(() => expect(result.current.loading).toBe(false))
    act(() => {
      definition.emit({ enabled: true })
    })

    expect(result.current.value).toEqual({ enabled: true })
  })
})
