import { act, renderHook, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { useAutosaveToolSetting } from './useAutosaveToolSetting'
import { createFakeSettingDefinition } from './testing/createFakeSettingDefinition'

type Entries = { entries: string[] }

const DELAY_MS = 500
const serialize = (value: Entries) => value.entries.join('\n')
const parse = (draft: string): Entries => ({
  entries: draft
    .split('\n')
    .map((entry) => entry.trim())
    .filter(Boolean),
})

function renderAutosave(definition: ReturnType<typeof createFakeSettingDefinition<Entries>>) {
  return renderHook(() =>
    useAutosaveToolSetting(definition, {
      serialize,
      parse,
      delayMs: DELAY_MS,
    }),
  )
}

describe('useAutosaveToolSetting', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('loads the stored value into the draft on mount', async () => {
    const definition = createFakeSettingDefinition<Entries>(
      { entries: [] },
      { entries: ['user@example.com', '13800138000'] },
    )
    const { result } = renderAutosave(definition)

    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.draft).toBe('user@example.com\n13800138000')
    expect(result.current.dirty).toBe(false)
    expect(result.current.error).toBeNull()
  })

  it('debounces the save until editing pauses', async () => {
    const definition = createFakeSettingDefinition<Entries>(
      { entries: [] },
      { entries: [] },
    )
    const { result } = renderAutosave(definition)

    await waitFor(() => expect(result.current.loading).toBe(false))
    vi.useFakeTimers()

    act(() => {
      result.current.changeDraft(' user@example.com \n\n 13800138000 ')
    })
    expect(result.current.dirty).toBe(true)

    await act(async () => {
      await vi.advanceTimersByTimeAsync(DELAY_MS - 1)
    })
    expect(result.current.value).toEqual({ entries: [] })

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1)
    })

    expect(result.current.value).toEqual({
      entries: ['user@example.com', '13800138000'],
    })
    expect(result.current.draft).toBe('user@example.com\n13800138000')
    expect(result.current.dirty).toBe(false)
    expect(result.current.saveFailed).toBe(false)
  })

  it('keeps the draft for retry when the save fails', async () => {
    const definition = createFakeSettingDefinition<Entries>(
      { entries: [] },
      { entries: [] },
    )
    definition.failNextSave()
    const { result } = renderAutosave(definition)

    await waitFor(() => expect(result.current.loading).toBe(false))
    vi.useFakeTimers()

    act(() => {
      result.current.changeDraft('changed@example.com')
    })

    await act(async () => {
      await vi.advanceTimersByTimeAsync(DELAY_MS)
    })

    expect(result.current.saveFailed).toBe(true)
    expect(result.current.error).toBe('保存失败，请重试')
    expect(result.current.draft).toBe('changed@example.com')

    act(() => {
      result.current.changeDraft('changed@example.com\n13800138000')
    })

    await act(async () => {
      await vi.advanceTimersByTimeAsync(DELAY_MS)
    })

    expect(result.current.saveFailed).toBe(false)
    expect(result.current.value).toEqual({
      entries: ['changed@example.com', '13800138000'],
    })
    expect(result.current.error).toBeNull()
  })

  it('does not let a stale in-flight save clobber a newer draft', async () => {
    const definition = createFakeSettingDefinition<Entries>(
      { entries: [] },
      { entries: [] },
    )
    const { result } = renderAutosave(definition)

    await waitFor(() => expect(result.current.loading).toBe(false))
    vi.useFakeTimers()
    definition.pauseSaves()

    act(() => {
      result.current.changeDraft('user@example.com')
    })

    await act(async () => {
      await vi.advanceTimersByTimeAsync(DELAY_MS)
    })
    expect(result.current.saving).toBe(true)

    act(() => {
      result.current.changeDraft('user@example.com\n13800138000')
    })
    await act(async () => {
      definition.resumeSaves()
    })

    await act(async () => {
      await vi.advanceTimersByTimeAsync(DELAY_MS * 2)
    })

    expect(result.current.value).toEqual({
      entries: ['user@example.com', '13800138000'],
    })
    expect(result.current.draft).toBe('user@example.com\n13800138000')
    expect(result.current.dirty).toBe(false)
  })
})
