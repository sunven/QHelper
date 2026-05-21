import { get as getLocal, set as setLocal } from '@/lib/chrome/storage'

export type SyncedSettingStorageArea = 'sync' | 'local'

export type SyncedSettingSaveResult<T> = {
  value: T
  storageArea: SyncedSettingStorageArea
}

export type SyncedToolSettingSaveResult<T> = {
  settings: T
  storageArea: SyncedSettingStorageArea
}

export type SyncedToolSettingDefinition<T> = {
  key: string
  defaults: T
  get: () => Promise<T>
  set: (nextSetting: Partial<T>) => Promise<SyncedToolSettingSaveResult<T>>
  subscribe: (listener: (setting: T) => void) => () => void
}

type SyncedToolSettingOptions<T> = {
  key: string
  defaults: T
  normalize: NormalizeSetting<T>
}

type ChromeStorageArea = {
  get(key: string): Promise<Record<string, unknown>>
  set(items: Record<string, unknown>): Promise<void>
}

type ChromeStorageChangeMap = {
  [key: string]: chrome.storage.StorageChange
}

type NormalizeSetting<T> = (value: Partial<T> | undefined) => T

function getChromeStorageArea(
  areaName: SyncedSettingStorageArea,
): ChromeStorageArea | undefined {
  try {
    const area = globalThis.chrome?.storage?.[areaName]
    if (
      area &&
      typeof area.get === 'function' &&
      typeof area.set === 'function'
    ) {
      return area as ChromeStorageArea
    }
  } catch {
    return undefined
  }

  return undefined
}

function hasStoredValue(result: Record<string, unknown>, key: string): boolean {
  return Object.prototype.hasOwnProperty.call(result, key) && result[key] !== undefined
}

async function readLocalSetting<T>(
  key: string,
): Promise<Partial<T> | undefined> {
  return getLocal<Partial<T>>(key).catch(() => undefined)
}

export async function getSyncedSetting<T>(
  key: string,
  normalize: NormalizeSetting<T>,
): Promise<T> {
  const syncStorage = getChromeStorageArea('sync')

  if (syncStorage) {
    try {
      const syncResult = await syncStorage.get(key)
      if (hasStoredValue(syncResult, key)) {
        const normalizedSyncValue = normalize(syncResult[key] as Partial<T>)
        await setLocal(key, normalizedSyncValue)
        return normalizedSyncValue
      }

      const localValue = await readLocalSetting<T>(key)
      const normalizedLocalValue = normalize(localValue)

      if (localValue !== undefined) {
        try {
          await syncStorage.set({ [key]: normalizedLocalValue })
          await setLocal(key, normalizedLocalValue)
        } catch (error) {
          console.warn(
            'chrome.storage.sync migration failed, keeping local setting fallback:',
            error,
          )
        }
      }

      return normalizedLocalValue
    } catch (error) {
      console.warn(
        'chrome.storage.sync get failed, falling back to local setting:',
        error,
      )
    }
  }

  return normalize(await readLocalSetting<T>(key))
}

export async function setSyncedSetting<T>(
  key: string,
  value: T,
): Promise<SyncedSettingSaveResult<T>> {
  const syncStorage = getChromeStorageArea('sync')

  if (syncStorage) {
    try {
      await syncStorage.set({ [key]: value })
      await setLocal(key, value)
      return { value, storageArea: 'sync' }
    } catch (error) {
      console.warn(
        'chrome.storage.sync set failed, falling back to local setting:',
        error,
      )
    }
  }

  await setLocal(key, value)
  return { value, storageArea: 'local' }
}

export function subscribeSyncedSetting<T>(
  key: string,
  normalize: NormalizeSetting<T>,
  listener: (value: T, storageArea: SyncedSettingStorageArea) => void,
): () => void {
  const handleSettingsChange = (
    changes: ChromeStorageChangeMap,
    areaName: string,
  ) => {
    if ((areaName !== 'sync' && areaName !== 'local') || !(key in changes)) {
      return
    }

    const nextValue = normalize(
      changes[key].newValue as Partial<T> | undefined,
    )
    listener(nextValue, areaName)

    if (areaName === 'sync') {
      void setLocal(key, nextValue)
    }
  }

  try {
    if (globalThis.chrome?.storage?.onChanged) {
      globalThis.chrome.storage.onChanged.addListener(handleSettingsChange)
      return () => {
        globalThis.chrome?.storage?.onChanged?.removeListener(
          handleSettingsChange,
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
        normalize(
          event.newValue
            ? (JSON.parse(event.newValue) as Partial<T>)
            : undefined,
        ),
        'local',
      )
    } catch {
      listener(normalize(undefined), 'local')
    }
  }

  window.addEventListener('storage', handleLocalStorageChange)
  return () => {
    window.removeEventListener('storage', handleLocalStorageChange)
  }
}

export function defineSyncedToolSetting<T>({
  key,
  defaults,
  normalize,
}: SyncedToolSettingOptions<T>): SyncedToolSettingDefinition<T> {
  return {
    key,
    defaults,
    get: () => getSyncedSetting(key, normalize),
    set: async (nextSetting) => {
      const result = await setSyncedSetting(key, normalize(nextSetting))
      return {
        settings: result.value,
        storageArea: result.storageArea,
      }
    },
    subscribe: (listener) =>
      subscribeSyncedSetting(key, normalize, (settings) => {
        listener(settings)
      }),
  }
}
