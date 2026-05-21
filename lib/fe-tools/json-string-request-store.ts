import {
  getLocalPersistedData,
  setLocalPersistedData,
  subscribeLocalPersistedDataKey,
} from '@/lib/chrome/local-persisted-data'

export const REQUEST_DATA_STORAGE_KEY = 'requestData'

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

export async function getCapturedJsonStringRequests(): Promise<
  CapturedJsonStringRequest[]
> {
  const requests = await getLocalPersistedData<unknown>(
    REQUEST_DATA_STORAGE_KEY,
  )
  return normalizeCapturedRequests(requests)
}

export async function setCapturedJsonStringRequests(
  requests: CapturedJsonStringRequest[],
): Promise<void> {
  await setLocalPersistedData(REQUEST_DATA_STORAGE_KEY, requests)
}

export async function appendCapturedJsonStringRequest(
  request: CapturedJsonStringRequest,
): Promise<void> {
  const requests = await getCapturedJsonStringRequests()
  await setCapturedJsonStringRequests([...requests, request])
}

export async function clearCapturedJsonStringRequests(): Promise<void> {
  await setCapturedJsonStringRequests([])
}

export function subscribeCapturedJsonStringRequests(
  listener: (requests: CapturedJsonStringRequest[]) => void,
): () => void {
  return subscribeLocalPersistedDataKey<unknown>(
    REQUEST_DATA_STORAGE_KEY,
    (requests) => listener(normalizeCapturedRequests(requests)),
  )
}
