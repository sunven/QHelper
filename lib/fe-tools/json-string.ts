import { get, set } from '@/lib/chrome/storage'

export const REQUEST_DATA_STORAGE_KEY = 'requestData'
export const JSON_STRING_SETTINGS_STORAGE_KEY = 'jsonStringSettings'

export type JsonStringSettings = {
  enabled: boolean
}

export const DEFAULT_JSON_STRING_SETTINGS: JsonStringSettings = {
  enabled: true,
}

type HeaderLike = {
  name?: string
  value?: string
}

export type JsonRequestLike = {
  request?: {
    url?: string
  }
  response?: {
    headers?: HeaderLike[]
  }
}

function normalizeJsonStringSettings(
  value: Partial<JsonStringSettings> | undefined,
): JsonStringSettings {
  return {
    enabled:
      typeof value?.enabled === 'boolean'
        ? value.enabled
        : DEFAULT_JSON_STRING_SETTINGS.enabled,
  }
}

export async function getJsonStringSettings(): Promise<JsonStringSettings> {
  const value = await get<Partial<JsonStringSettings>>(
    JSON_STRING_SETTINGS_STORAGE_KEY,
  )
  return normalizeJsonStringSettings(value)
}

export async function setJsonStringSettings(
  nextSettings: Partial<JsonStringSettings>,
): Promise<JsonStringSettings> {
  const normalized = normalizeJsonStringSettings(nextSettings)
  await set(JSON_STRING_SETTINGS_STORAGE_KEY, normalized)
  return normalized
}

export function subscribeJsonStringSettings(
  listener: (settings: JsonStringSettings) => void,
): () => void {
  const handleSettingsChange = (
    changes: { [key: string]: chrome.storage.StorageChange },
    areaName: string,
  ) => {
    if (
      areaName !== 'local' ||
      !(JSON_STRING_SETTINGS_STORAGE_KEY in changes)
    ) {
      return
    }

    listener(
      normalizeJsonStringSettings(
        changes[JSON_STRING_SETTINGS_STORAGE_KEY].newValue as
          | Partial<JsonStringSettings>
          | undefined,
      ),
    )
  }

  if (typeof chrome !== 'undefined' && chrome.storage?.onChanged) {
    chrome.storage.onChanged.addListener(handleSettingsChange)
    return () => {
      chrome.storage.onChanged.removeListener(handleSettingsChange)
    }
  }

  if (typeof window === 'undefined') {
    return () => undefined
  }

  const handleLocalStorageChange = (event: StorageEvent) => {
    if (
      event.key !== JSON_STRING_SETTINGS_STORAGE_KEY ||
      event.newValue === event.oldValue
    ) {
      return
    }

    try {
      listener(
        normalizeJsonStringSettings(
          event.newValue
            ? (JSON.parse(event.newValue) as Partial<JsonStringSettings>)
            : undefined,
        ),
      )
    } catch {
      listener(DEFAULT_JSON_STRING_SETTINGS)
    }
  }

  window.addEventListener('storage', handleLocalStorageChange)
  return () => {
    window.removeEventListener('storage', handleLocalStorageChange)
  }
}

function parseJsonString(value: string): unknown | false {
  const text = value.trim()
  if (!text) {
    return false
  }

  const maybeJson =
    (text.startsWith('{') && text.endsWith('}')) ||
    (text.startsWith('[') && text.endsWith(']'))
  if (!maybeJson) {
    return false
  }

  try {
    return JSON.parse(text)
  } catch {
    return false
  }
}

export function isJsonString(value: string): boolean {
  return parseJsonString(value) !== false
}

export function transformJsonStringToJson<T>(data: T): T {
  if (Array.isArray(data)) {
    return data.map((item) => transformJsonStringToJson(item)) as T
  }

  if (data && typeof data === 'object') {
    const result: Record<string, unknown> = { ...(data as Record<string, unknown>) }

    for (const [key, value] of Object.entries(result)) {
      if (typeof value === 'string') {
        const parsed = parseJsonString(value)
        result[key] = parsed === false ? value : transformJsonStringToJson(parsed)
        continue
      }

      if (value && typeof value === 'object') {
        result[key] = transformJsonStringToJson(value)
      }
    }

    return result as T
  }

  return data
}

export function shouldCaptureJsonRequest(requestLike: JsonRequestLike): boolean {
  const requestUrl = requestLike.request?.url
  if (!requestUrl || requestUrl.startsWith('chrome-extension://')) {
    return false
  }

  const hasJsonContentType = requestLike.response?.headers?.some(
    (header) =>
      header.name?.toLowerCase() === 'content-type' &&
      header.value?.toLowerCase().includes('application/json'),
  )
  if (!hasJsonContentType) {
    return false
  }

  try {
    const url = new URL(requestUrl)
    return (
      url.hostname === 'localhost' ||
      url.hostname === '127.0.0.1' ||
      url.hostname.startsWith('192.168')
    )
  } catch {
    return false
  }
}
