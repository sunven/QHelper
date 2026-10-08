import { vi } from 'vitest'

/** A real value map and change notifications for storage integration tests. */
export function installToolDataStorage() {
  const local: Record<string, unknown> = {}
  const sync: Record<string, unknown> = {}
  const listeners = new Set<
    Parameters<typeof chrome.storage.onChanged.addListener>[0]
  >()
  vi.mocked(chrome.storage.onChanged.addListener).mockImplementation(
    (listener) => {
      listeners.add(listener)
    },
  )
  vi.mocked(chrome.storage.onChanged.removeListener).mockImplementation(
    (listener) => {
      listeners.delete(listener)
    },
  )
  for (const [name, values] of [
    ['local', local],
    ['sync', sync],
  ] as const) {
    const area = chrome.storage[name]
    vi.mocked(area.get).mockImplementation(async (keys) => {
      const selected =
        typeof keys === 'string'
          ? [keys]
          : Array.isArray(keys)
            ? keys
            : keys
              ? Object.keys(keys)
              : Object.keys(values)
      return Object.fromEntries(
        selected
          .filter((key) => key in values)
          .map((key) => [key, structuredClone(values[key])]),
      )
    })
    vi.mocked(area.set).mockImplementation(async (entries) => {
      const changes: Record<string, chrome.storage.StorageChange> = {}
      for (const [key, value] of Object.entries(entries)) {
        changes[key] = {
          oldValue: values[key],
          newValue: structuredClone(value),
        }
        values[key] = structuredClone(value)
      }
      for (const listener of listeners) listener(changes, name)
    })
    vi.mocked(area.remove).mockImplementation(async (keys) => {
      const changes: Record<string, chrome.storage.StorageChange> = {}
      for (const key of typeof keys === 'string' ? [keys] : keys) {
        changes[key] = { oldValue: values[key] }
        delete values[key]
      }
      for (const listener of listeners) listener(changes, name)
    })
  }
  localStorage.clear()
  return { local, sync }
}
