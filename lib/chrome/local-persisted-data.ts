import {
  get as getLocal,
  remove as removeLocal,
  set as setLocal,
} from '@/lib/chrome/storage'

type LocalPersistedDataChangeMap = {
  [key: string]: chrome.storage.StorageChange
}

export function getLocalPersistedData<T>(
  key: string,
): Promise<T | undefined>
export function getLocalPersistedData<T>(key: string, defaultValue: T): Promise<T>
export function getLocalPersistedData<T>(
  key: string,
  defaultValue?: T,
): Promise<T | undefined> {
  return defaultValue === undefined
    ? getLocal<T>(key)
    : getLocal<T>(key, defaultValue)
}

export async function setLocalPersistedData<T>(
  key: string,
  value: T,
): Promise<void> {
  await setLocal(key, value)
}

export async function removeLocalPersistedData(key: string): Promise<void> {
  await removeLocal(key)
}

export function getToolStateStorageKey(toolId: string, key: string): string {
  return `tool_${toolId}_${key}`
}

export function subscribeLocalPersistedDataKey<T>(
  key: string,
  listener: (value: T | undefined) => void,
): () => void {
  const handleChromeStorageChange = (
    changes: LocalPersistedDataChangeMap,
    areaName: string,
  ) => {
    if (areaName !== 'local' || !(key in changes)) {
      return
    }

    listener(changes[key].newValue as T | undefined)
  }

  try {
    if (globalThis.chrome?.storage?.onChanged) {
      globalThis.chrome.storage.onChanged.addListener(handleChromeStorageChange)
      return () => {
        globalThis.chrome?.storage?.onChanged?.removeListener(
          handleChromeStorageChange,
        )
      }
    }
  } catch {
    return () => undefined
  }

  if (typeof window === 'undefined') {
    return () => undefined
  }

  const handleLocalStorageChange = (event: StorageEvent) => {
    if (event.key !== key || event.newValue === event.oldValue) {
      return
    }

    try {
      listener(
        event.newValue ? (JSON.parse(event.newValue) as T) : undefined,
      )
    } catch {
      listener(undefined)
    }
  }

  window.addEventListener('storage', handleLocalStorageChange)
  return () => {
    window.removeEventListener('storage', handleLocalStorageChange)
  }
}
