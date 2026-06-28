import { defineSetting } from '@/lib/settings'

export const V2EX_BASE64_SETTINGS_STORAGE_KEY = 'v2exBase64Settings'

export type V2exBase64Settings = {
  entries: string[]
}

export const normalizeV2exBase64Entries = (value: unknown): string[] => {
  if (!Array.isArray(value)) {
    return []
  }

  return value
    .filter((entry): entry is string => typeof entry === 'string')
    .map((entry) => entry.trim())
    .filter(Boolean)
}

export const normalizeV2exBase64Settings = (
  value: Partial<V2exBase64Settings> | undefined,
): V2exBase64Settings => ({
  entries: normalizeV2exBase64Entries(value?.entries),
})

export const v2exBase64Settings = defineSetting<V2exBase64Settings>(
  V2EX_BASE64_SETTINGS_STORAGE_KEY,
  { entries: [] },
  normalizeV2exBase64Settings,
)

export const DEFAULT_V2EX_BASE64_SETTINGS = v2exBase64Settings.defaults
export const getV2exBase64Settings = v2exBase64Settings.get
export const setV2exBase64Settings = v2exBase64Settings.set
export const subscribeV2exBase64Settings = v2exBase64Settings.subscribe
