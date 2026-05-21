import {
  defineSyncedToolSetting,
  type SyncedToolSettingSaveResult,
} from '@/lib/chrome/synced-settings'

export const JSON_STRING_SETTINGS_STORAGE_KEY = 'jsonStringSettings'

export type JsonStringSettings = {
  enabled: boolean
}

export type JsonStringSettingsSaveResult =
  SyncedToolSettingSaveResult<JsonStringSettings>

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

export function normalizeJsonStringSettings(
  value: Partial<JsonStringSettings> | undefined,
): JsonStringSettings {
  return {
    enabled:
      typeof value?.enabled === 'boolean'
        ? value.enabled
        : DEFAULT_JSON_STRING_SETTINGS.enabled,
  }
}

export const jsonStringSettings = defineSyncedToolSetting({
  key: JSON_STRING_SETTINGS_STORAGE_KEY,
  defaults: DEFAULT_JSON_STRING_SETTINGS,
  normalize: normalizeJsonStringSettings,
})

export const getJsonStringSettings = jsonStringSettings.get

export const setJsonStringSettings = jsonStringSettings.set

export const subscribeJsonStringSettings = jsonStringSettings.subscribe

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
