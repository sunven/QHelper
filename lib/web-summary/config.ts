import type { WebSummaryConfig } from '@/types/web-summary'

export const WEB_SUMMARY_CONFIG_KEY = 'webSummaryConfig'

export const DEFAULT_WEB_SUMMARY_CONFIG: WebSummaryConfig = Object.freeze({
  endpoint: '',
  model: '',
  apiKey: '',
})

export function normalizeWebSummaryConfig(
  config?: Partial<WebSummaryConfig> | null,
): WebSummaryConfig {
  return {
    endpoint: config?.endpoint?.trim() ?? '',
    model: config?.model?.trim() ?? '',
    apiKey: config?.apiKey?.trim() ?? '',
  }
}

const LOOPBACK_HOSTNAMES = new Set(['localhost', '127.0.0.1', '[::1]', '::1'])

function isLoopbackHostname(hostname: string): boolean {
  const host = hostname.toLowerCase()
  return LOOPBACK_HOSTNAMES.has(host) || host.endsWith('.localhost')
}

export function getWebSummaryEndpointError(endpoint: string): string | null {
  const trimmed = endpoint.trim()
  if (!trimmed) {
    return '请先填写兼容 OpenAI 的接口地址。'
  }

  try {
    const endpointUrl = new URL(trimmed)
    if (endpointUrl.protocol === 'https:') {
      return null
    }

    if (
      endpointUrl.protocol === 'http:' &&
      isLoopbackHostname(endpointUrl.hostname)
    ) {
      return null
    }

    return '接口地址必须使用 https（localhost 例外）。'
  } catch {
    return '接口地址格式不正确，请输入完整 URL。'
  }
}

export function validateWebSummaryConfig(
  config?: Partial<WebSummaryConfig> | null,
): string[] {
  const normalized = normalizeWebSummaryConfig(config)
  const errors: string[] = []

  const endpointError = getWebSummaryEndpointError(normalized.endpoint)
  if (endpointError) {
    errors.push(endpointError)
  }

  if (!normalized.model) {
    errors.push('请先填写模型名称。')
  }

  if (!normalized.apiKey) {
    errors.push('请先填写 API Key。')
  }

  return errors
}
