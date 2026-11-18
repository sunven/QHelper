import {
  AUTO_REFRESH_MASTER_STORAGE_KEY,
  AUTO_REFRESH_RULES_STORAGE_KEY,
} from '@/types/auto-refresh'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  getMasterEnabled,
  getRefreshRules,
  sanitizeRefreshRules,
  writeRefreshRules,
} from './rules'

const localGet = chrome.storage.local.get as unknown as ReturnType<typeof vi.fn>
const localSet = chrome.storage.local.set as unknown as ReturnType<typeof vi.fn>

describe('auto-refresh/rules', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localGet.mockResolvedValue({})
    localSet.mockResolvedValue(undefined)
  })

  it('sanitizes stored rules, normalizes URLs and drops duplicates', () => {
    const rules = sanitizeRefreshRules([
      {
        id: 'rule-1',
        url: 'https://example.com/a#hash',
        intervalSeconds: 30,
        enabled: true,
        createdAt: 1,
        updatedAt: 2,
      },
      {
        id: 'rule-duplicate',
        url: 'https://example.com/a',
        intervalSeconds: 60,
        enabled: true,
        createdAt: 3,
        updatedAt: 3,
      },
      {
        id: 'rule-2',
        url: 'chrome://extensions',
        intervalSeconds: 30,
        enabled: true,
      },
      {
        id: 'rule-3',
        url: 'https://example.com/b',
        intervalSeconds: 10,
        enabled: true,
      },
    ])

    expect(rules).toEqual([
      {
        id: 'rule-1',
        url: 'https://example.com/a',
        intervalSeconds: 30,
        enabled: true,
        createdAt: 1,
        updatedAt: 2,
      },
    ])
  })

  it('defaults enabled to true when the stored value is missing', () => {
    const rules = sanitizeRefreshRules([
      {
        id: 'rule-1',
        url: 'https://example.com/',
        intervalSeconds: 30,
      },
    ])

    expect(rules[0]?.enabled).toBe(true)
  })

  it('reads rules from local storage through the sanitizer', async () => {
    localGet.mockResolvedValue({
      [AUTO_REFRESH_RULES_STORAGE_KEY]: [
        {
          id: 'rule-1',
          url: 'https://example.com/',
          intervalSeconds: 30,
          enabled: true,
          createdAt: 1,
          updatedAt: 1,
        },
      ],
    })

    await expect(getRefreshRules()).resolves.toHaveLength(1)
    expect(localGet).toHaveBeenCalledWith(AUTO_REFRESH_RULES_STORAGE_KEY)
  })

  it('defaults the master switch to on and honors stored values', async () => {
    await expect(getMasterEnabled()).resolves.toBe(true)

    localGet.mockResolvedValue({
      [AUTO_REFRESH_MASTER_STORAGE_KEY]: false,
    })
    await expect(getMasterEnabled()).resolves.toBe(false)
  })

  it('writes rules to the expected storage key', async () => {
    const rules = sanitizeRefreshRules([
      {
        id: 'rule-1',
        url: 'https://example.com/',
        intervalSeconds: 30,
      },
    ])

    await writeRefreshRules(rules)

    expect(localSet).toHaveBeenCalledWith({
      [AUTO_REFRESH_RULES_STORAGE_KEY]: rules,
    })
  })
})
