import { describe, expect, it } from 'vitest'
import {
  formatIntervalSeconds,
  getRuleAlarmName,
  getRuleIdFromAlarmName,
  normalizeIntervalSeconds,
  normalizePageUrl,
} from './url'

describe('auto-refresh/url', () => {
  it('normalizes http(s) URLs and removes the fragment', () => {
    expect(normalizePageUrl('  https://Example.com/a?b=1#section  ')).toBe(
      'https://example.com/a?b=1',
    )
    expect(normalizePageUrl('http://example.com')).toBe('http://example.com/')
  })

  it('rejects unsupported and invalid URLs', () => {
    expect(normalizePageUrl('chrome://extensions')).toBeNull()
    expect(normalizePageUrl('chrome-extension://abc/page.html')).toBeNull()
    expect(normalizePageUrl('file:///tmp/index.html')).toBeNull()
    expect(normalizePageUrl('not a url')).toBeNull()
    expect(normalizePageUrl('')).toBeNull()
    expect(normalizePageUrl(null)).toBeNull()
  })

  it('enforces per-kind interval bounds', () => {
    expect(normalizeIntervalSeconds('rule', 29)).toBeNull()
    expect(normalizeIntervalSeconds('rule', 30)).toBe(30)
    expect(normalizeIntervalSeconds('rule', 86_400)).toBe(86_400)
    expect(normalizeIntervalSeconds('rule', 86_401)).toBeNull()
    expect(normalizeIntervalSeconds('session', 4)).toBeNull()
    expect(normalizeIntervalSeconds('session', 5)).toBe(5)
    expect(normalizeIntervalSeconds('session', 10.6)).toBe(11)
    expect(normalizeIntervalSeconds('rule', Number.NaN)).toBeNull()
  })

  it('formats intervals for the UI', () => {
    expect(formatIntervalSeconds(30)).toBe('30 秒')
    expect(formatIntervalSeconds(60)).toBe('1 分钟')
    expect(formatIntervalSeconds(90)).toBe('1 分 30 秒')
    expect(formatIntervalSeconds(3600)).toBe('1 小时')
    expect(formatIntervalSeconds(5400)).toBe('1 小时 30 分钟')
  })

  it('round-trips alarm names', () => {
    expect(getRuleAlarmName('rule-1')).toBe('qhelper.autoRefresh.rule:rule-1')
    expect(getRuleIdFromAlarmName(getRuleAlarmName('rule-1'))).toBe('rule-1')
    expect(getRuleIdFromAlarmName('other-alarm')).toBeNull()
  })
})
