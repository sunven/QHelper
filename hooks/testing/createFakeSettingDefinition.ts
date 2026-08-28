import type { SettingDefinition } from '@/lib/settings'

export type FakeSettingDefinition<T extends object> = SettingDefinition<T> & {
  emit(next: T): void
  failNextSave(): void
  forceLocalSaves(): void
  pauseSaves(): void
  resumeSaves(): void
}

/**
 * 手工 fake 的 Tool Setting Definition：直接注入 hook，
 * 让行为测试穿过 definition 接口而不是 vi.mock 模块。
 */
export function createFakeSettingDefinition<T extends object>(
  defaults: T,
  initial: T,
): FakeSettingDefinition<T> {
  let value = initial
  let shouldFail = false
  let storageArea: 'sync' | 'local' = 'sync'
  let paused = false
  let resumeSaves: (() => void) | null = null
  const listeners = new Set<(value: T) => void>()

  return {
    key: 'fake-setting',
    defaults,
    get: async () => value,
    set: (next) =>
      new Promise((resolve, reject) => {
        if (shouldFail) {
          shouldFail = false
          reject(new Error('save failed'))
          return
        }

        const commit = () => {
          value = { ...defaults, ...next }
          resolve({ settings: value, storageArea })
        }

        if (paused) {
          resumeSaves = commit
          return
        }

        commit()
      }),
    subscribe(listener) {
      listeners.add(listener)
      return () => {
        listeners.delete(listener)
      }
    },
    reset: async () => ({ settings: defaults, storageArea: 'sync' }),
    emit(next: T) {
      value = next
      for (const listener of listeners) {
        listener(next)
      }
    },
    failNextSave() {
      shouldFail = true
    },
    forceLocalSaves() {
      storageArea = 'local'
    },
    pauseSaves() {
      paused = true
    },
    resumeSaves() {
      paused = false
      resumeSaves?.()
      resumeSaves = null
    },
  }
}
