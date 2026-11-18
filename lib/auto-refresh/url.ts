import {
  AUTO_REFRESH_ALARM_PREFIX,
  AUTO_REFRESH_MAX_SECONDS,
  AUTO_REFRESH_RULE_MIN_SECONDS,
  AUTO_REFRESH_SESSION_MIN_SECONDS,
} from '@/types/auto-refresh'

export type RefreshIntervalKind = 'rule' | 'session'

export function normalizePageUrl(
  rawUrl: string | null | undefined,
): string | null {
  if (typeof rawUrl !== 'string') {
    return null
  }

  const trimmed = rawUrl.trim()
  if (!trimmed) {
    return null
  }

  try {
    const url = new URL(trimmed)
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      return null
    }
    url.hash = ''
    return url.href
  } catch {
    return null
  }
}

export function isSupportedPageUrl(rawUrl: string | null | undefined): boolean {
  return normalizePageUrl(rawUrl) !== null
}

export function isSamePageUrl(
  left: string | null | undefined,
  right: string | null | undefined,
): boolean {
  const normalizedLeft = normalizePageUrl(left)
  return normalizedLeft !== null && normalizedLeft === normalizePageUrl(right)
}

export function normalizeIntervalSeconds(
  kind: RefreshIntervalKind,
  value: number,
): number | null {
  if (!Number.isFinite(value)) {
    return null
  }

  const seconds = Math.round(value)
  const minimum =
    kind === 'rule'
      ? AUTO_REFRESH_RULE_MIN_SECONDS
      : AUTO_REFRESH_SESSION_MIN_SECONDS

  if (seconds < minimum || seconds > AUTO_REFRESH_MAX_SECONDS) {
    return null
  }

  return seconds
}

export function formatIntervalSeconds(seconds: number): string {
  if (seconds < 60) {
    return `${seconds} 秒`
  }

  if (seconds % 3600 === 0) {
    return `${seconds / 3600} 小时`
  }

  if (seconds >= 3600) {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const rest = seconds % 60
    return [
      hours ? `${hours} 小时` : '',
      minutes ? `${minutes} 分钟` : '',
      rest ? `${rest} 秒` : '',
    ]
      .filter(Boolean)
      .join(' ')
  }

  if (seconds % 60 === 0) {
    return `${seconds / 60} 分钟`
  }

  const minutes = Math.floor(seconds / 60)
  const rest = seconds % 60
  return minutes ? `${minutes} 分 ${rest} 秒` : `${seconds} 秒`
}

export function getRuleAlarmName(ruleId: string): string {
  return `${AUTO_REFRESH_ALARM_PREFIX}${ruleId}`
}

export function getRuleIdFromAlarmName(alarmName: string): string | null {
  if (!alarmName.startsWith(AUTO_REFRESH_ALARM_PREFIX)) {
    return null
  }

  const ruleId = alarmName.slice(AUTO_REFRESH_ALARM_PREFIX.length)
  return ruleId || null
}
