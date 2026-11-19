/**
 * Chrome BrowsingData API 封装
 */

export const ORIGIN_STORAGE_DATA_TYPES = [
  'localStorage',
  'indexedDB',
  'cacheStorage',
  'serviceWorkers',
] as const

export type OriginStorageDataType = (typeof ORIGIN_STORAGE_DATA_TYPES)[number]

function toDataTypeSet(
  types: readonly OriginStorageDataType[],
): chrome.browsingData.DataTypeSet {
  const dataTypeSet: chrome.browsingData.DataTypeSet = {}
  for (const type of types) {
    dataTypeSet[type] = true
  }
  return dataTypeSet
}

export async function removeStorageForOrigin(
  origin: string,
  types: readonly OriginStorageDataType[],
): Promise<void> {
  if (types.length === 0) {
    return
  }

  await chrome.browsingData.remove({ origins: [origin] }, toDataTypeSet(types))
}

export async function removeAllStorage(
  types: readonly OriginStorageDataType[],
): Promise<void> {
  if (types.length === 0) {
    return
  }

  await chrome.browsingData.remove({}, toDataTypeSet(types))
}
