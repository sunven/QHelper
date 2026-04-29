import { get, set } from '@/lib/chrome/storage'
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

export function validateWebSummaryConfig(
  config?: Partial<WebSummaryConfig> | null,
): string[] {
  const normalized = normalizeWebSummaryConfig(config)
  const errors: string[] = []

  if (!normalized.endpoint) {
    errors.push('请先填写兼容 OpenAI 的接口地址。')
  } else {
    try {
      const endpointUrl = new URL(normalized.endpoint)
      if (!['http:', 'https:'].includes(endpointUrl.protocol)) {
        errors.push('接口地址必须使用 http 或 https。')
      }
    } catch {
      errors.push('接口地址格式不正确，请输入完整 URL。')
    }
  }

  if (!normalized.model) {
    errors.push('请先填写模型名称。')
  }

  if (!normalized.apiKey) {
    errors.push('请先填写 API Key。')
  }

  return errors
}

export function isWebSummaryConfigComplete(
  config?: Partial<WebSummaryConfig> | null,
): boolean {
  return validateWebSummaryConfig(config).length === 0
}

export async function getWebSummaryConfig(): Promise<WebSummaryConfig> {
  const config = await get<Partial<WebSummaryConfig>>(
    WEB_SUMMARY_CONFIG_KEY,
    DEFAULT_WEB_SUMMARY_CONFIG,
  )

  return normalizeWebSummaryConfig(config)
}

export async function setWebSummaryConfig(
  config: Partial<WebSummaryConfig>,
): Promise<void> {
  await set(WEB_SUMMARY_CONFIG_KEY, normalizeWebSummaryConfig(config))
}
