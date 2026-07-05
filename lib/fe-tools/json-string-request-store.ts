import {
  getLocalPersistedData,
  removeLocalPersistedData,
  setLocalPersistedData,
  subscribeLocalPersistedDataKey,
} from '@/lib/chrome/local-persisted-data'

export const REQUEST_DATA_STORAGE_KEY = 'qhelper.json-string.requestData.v1'
export const LEGACY_REQUEST_DATA_STORAGE_KEY = 'requestData'
export const MAX_CAPTURED_JSON_STRING_REQUESTS = 50

export type CapturedJsonStringRequest = {
  request: {
    url?: string
  }
  response: unknown
  content: string
}

function normalizeCapturedRequests(value: unknown): CapturedJsonStringRequest[] {
  return Array.isArray(value) ? (value as CapturedJsonStringRequest[]) : []
}

function limitCapturedRequests(
  requests: CapturedJsonStringRequest[],
): CapturedJsonStringRequest[] {
  return requests.slice(-MAX_CAPTURED_JSON_STRING_REQUESTS)
}

export async function getCapturedJsonStringRequests(): Promise<
  CapturedJsonStringRequest[]
> {
  const requests = await getLocalPersistedData<unknown>(
    REQUEST_DATA_STORAGE_KEY,
  )
  if (requests !== undefined) {
    return limitCapturedRequests(normalizeCapturedRequests(requests))
  }

  const legacyRequests = await getLocalPersistedData<unknown>(
    LEGACY_REQUEST_DATA_STORAGE_KEY,
  )
  const migratedRequests = limitCapturedRequests(
    normalizeCapturedRequests(legacyRequests),
  )
  if (legacyRequests !== undefined) {
    await setCapturedJsonStringRequests(migratedRequests)
    await removeLocalPersistedData(LEGACY_REQUEST_DATA_STORAGE_KEY)
  }

  return migratedRequests
}

export async function setCapturedJsonStringRequests(
  requests: CapturedJsonStringRequest[],
): Promise<void> {
  await setLocalPersistedData(
    REQUEST_DATA_STORAGE_KEY,
    limitCapturedRequests(requests),
  )
}

export async function appendCapturedJsonStringRequest(
  request: CapturedJsonStringRequest,
): Promise<void> {
  const requests = await getCapturedJsonStringRequests()
  await setCapturedJsonStringRequests(
    limitCapturedRequests([...requests, request]),
  )
}

export async function clearCapturedJsonStringRequests(): Promise<void> {
  await setCapturedJsonStringRequests([])
  await removeLocalPersistedData(LEGACY_REQUEST_DATA_STORAGE_KEY)
}

export function subscribeCapturedJsonStringRequests(
  listener: (requests: CapturedJsonStringRequest[]) => void,
): () => void {
  return subscribeLocalPersistedDataKey<unknown>(
    REQUEST_DATA_STORAGE_KEY,
    (requests) => listener(normalizeCapturedRequests(requests)),
  )
}
