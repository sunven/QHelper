import {
  getLocalPersistedData,
  removeLocalPersistedData,
  setLocalPersistedData,
  subscribeLocalPersistedDataKey,
} from '@/lib/chrome/local-persisted-data'

export const REQUEST_DATA_STORAGE_KEY = 'qhelper.json-string.requestData.v1'
export const LEGACY_REQUEST_DATA_STORAGE_KEY = 'requestData'
export const MAX_CAPTURED_JSON_STRING_REQUESTS = 50
export const MAX_CAPTURED_JSON_STRING_CONTENT_CHARS = 400_000
export const MAX_CAPTURED_JSON_STRING_STORAGE_CHARS = 2_000_000

export type CapturedJsonStringRequest = {
  request: {
    url?: string
  }
  response: unknown
  content: string
}

function normalizeCapturedRequests(
  value: unknown,
): CapturedJsonStringRequest[] {
  return Array.isArray(value) ? (value as CapturedJsonStringRequest[]) : []
}

function limitCapturedRequests(
  requests: CapturedJsonStringRequest[],
): CapturedJsonStringRequest[] {
  const limited = requests.slice(-MAX_CAPTURED_JSON_STRING_REQUESTS)
  const entrySizes = limited.map(
    (request) => JSON.stringify(request).length + 1,
  )
  let totalChars =
    entrySizes.reduce((total, size) => total + size, 0) +
    (limited.length > 0 ? 1 : 0)
  let start = 0

  while (
    start < limited.length &&
    totalChars > MAX_CAPTURED_JSON_STRING_STORAGE_CHARS
  ) {
    totalChars -= entrySizes[start]
    start += 1
  }

  return limited.slice(start)
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

let appendQueue: Promise<void> = Promise.resolve()

export function appendCapturedJsonStringRequest(
  request: CapturedJsonStringRequest,
): Promise<void> {
  if (
    typeof request.content !== 'string' ||
    request.content.length > MAX_CAPTURED_JSON_STRING_CONTENT_CHARS
  ) {
    return Promise.resolve()
  }

  const nextAppend = appendQueue.then(async () => {
    const requests = await getCapturedJsonStringRequests()
    await setCapturedJsonStringRequests(
      limitCapturedRequests([...requests, request]),
    )
  })

  appendQueue = nextAppend.catch(() => undefined)
  return nextAppend
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
