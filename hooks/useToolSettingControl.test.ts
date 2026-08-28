import { act, renderHook, waitFor } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { useToolSettingControl } from './useToolSettingControl'
import { createFakeSettingDefinition } from './testing/createFakeSettingDefinition'

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
