import { getErrorMessage } from '@/lib/utils'

export function buildWebSummaryModelsUrl(endpoint: string): string {
  const trimmed = endpoint.trim()
  if (!trimmed) {
    return ''
  }

  let url: URL
  try {
    url = new URL(trimmed)
  } catch {
    return ''
  }

  url.search = ''
  url.hash = ''

  const path = url.pathname.replace(/\/+$/, '')
  url.pathname = /\/chat\/completions$/i.test(path)
    ? path.replace(/\/chat\/completions$/i, '/models')
    : `${path}/models`

  return url.toString()
}

export async function fetchWebSummaryModels({
  endpoint,
  apiKey,
  signal,
}: {
  endpoint: string
  apiKey?: string
  signal?: AbortSignal
}): Promise<string[]> {
  const modelsUrl = buildWebSummaryModelsUrl(endpoint)
  if (!modelsUrl) {
    throw new Error('请先填写正确的接口地址，再获取模型列表。')
  }

  const headers: Record<string, string> = {}
  const trimmedApiKey = apiKey?.trim()
  if (trimmedApiKey) {
    headers.Authorization = `Bearer ${trimmedApiKey}`
  }

  const response = await fetch(modelsUrl, { headers, signal }).catch(
    (error) => {
      throw new Error(`获取模型列表失败：${getErrorMessage(error)}`)
    },
  )

  if (!response.ok) {
    const errorBody = await response.text().catch(() => '')
    const suffix = errorBody ? `：${errorBody.slice(0, 200)}` : ''
    throw new Error(`模型列表接口返回 ${response.status}${suffix}`)
  }

  const payload: unknown = await response.json().catch(() => null)
  const data =
    payload &&
    typeof payload === 'object' &&
    Array.isArray((payload as { data?: unknown }).data)
      ? (payload as { data: unknown[] }).data
      : []

  const models = Array.from(
    new Set(
      data
        .map((item) =>
          item &&
          typeof item === 'object' &&
          typeof (item as { id?: unknown }).id === 'string'
            ? (item as { id: string }).id
            : '',
        )
        .filter(Boolean),
    ),
  ).sort((a, b) => a.localeCompare(b))

  if (models.length === 0) {
    throw new Error('接口没有返回可用模型，请检查接口地址或 API Key。')
  }

  return models
}
