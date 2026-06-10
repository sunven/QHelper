type StorageArea = 'sync' | 'local'

type SaveResult<T> = {
  settings: T
  storageArea: StorageArea
}

export type SettingDefinition<T> = {
  key: string
  defaults: T
  get: () => Promise<T>
  set: (value: Partial<T>) => Promise<SaveResult<T>>
  subscribe: (listener: (value: T) => void) => () => void
  reset: () => Promise<SaveResult<T>>
}

function getStorage(area: StorageArea) {
  try {
    const storage = globalThis.chrome?.storage?.[area]
    if (storage && typeof storage.get === 'function' && typeof storage.set === 'function') {
      return storage
    }
  } catch {}
  return undefined
}

async function getLocal<T>(key: string): Promise<T | undefined> {
  try {
    if (globalThis.chrome?.storage?.local) {
      const result = await globalThis.chrome.storage.local.get(key)
      return result[key] as T | undefined
    }
    const value = localStorage.getItem(key)
    return value ? JSON.parse(value) : undefined
  } catch {
    return undefined
  }
}

async function setLocal<T>(key: string, value: T): Promise<void> {
  try {
    if (globalThis.chrome?.storage?.local) {
      await globalThis.chrome.storage.local.set({ [key]: value })
    } else {
      localStorage.setItem(key, JSON.stringify(value))
    }
  } catch {}
}

export function defineSetting<T extends object>(
  key: string,
  defaults: T,
  normalize?: (value: Partial<T> | undefined) => T,
): SettingDefinition<T> {
  const norm = normalize || ((value: Partial<T> | undefined): T => ({ ...defaults, ...value }))

  const get = async (): Promise<T> => {
    const sync = getStorage('sync')
    if (sync) {
      try {
        const result = await sync.get(key)
        if (key in result) {
          const normalized = norm(result[key] as Partial<T>)
          await setLocal(key, normalized)
          return normalized
        }
        const local = await getLocal<Partial<T>>(key)
        const normalized = norm(local)
        if (local !== undefined) {
          try {
            await sync.set({ [key]: normalized })
          } catch {}
        }
        return normalized
      } catch {}
    }
    return norm(await getLocal<Partial<T>>(key))
  }

  const set = async (value: Partial<T>): Promise<SaveResult<T>> => {
    const normalized = norm(value)
    const sync = getStorage('sync')
    if (sync) {
      try {
        await sync.set({ [key]: normalized })
        await setLocal(key, normalized)
        return { settings: normalized, storageArea: 'sync' }
      } catch {}
    }
    await setLocal(key, normalized)
    return { settings: normalized, storageArea: 'local' }
  }

  const subscribe = (listener: (value: T) => void): (() => void) => {
    const handler = (changes: { [key: string]: chrome.storage.StorageChange }, area: string) => {
      if ((area === 'sync' || area === 'local') && key in changes) {
        const normalized = norm(changes[key].newValue as Partial<T>)
        listener(normalized)
        if (area === 'sync') void setLocal(key, normalized)
      }
    }

    try {
      if (globalThis.chrome?.storage?.onChanged) {
        globalThis.chrome.storage.onChanged.addListener(handler)
        return () => globalThis.chrome?.storage?.onChanged?.removeListener(handler)
      }
    } catch {}

    return () => {}
  }

  const reset = () => set(defaults)

  return { key, defaults, get, set, subscribe, reset }
}
