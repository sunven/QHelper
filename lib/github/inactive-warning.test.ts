import { describe, expect, it } from 'vitest'
import {
  INACTIVE_WARNING_THRESHOLD_DAYS,
  buildDefaultBranchCommitsUrl,
  buildRepositoryMetaUrl,
  isInactiveRepository,
} from './inactive-warning'

const DAY_MS = 24 * 60 * 60 * 1000
const NOW = new Date('2026-08-27T00:00:00Z')

function daysAgo(days: number): Date {
  return new Date(NOW.getTime() - days * DAY_MS)
}

describe('inactive-warning URL builders', () => {
  it('builds the GitHub repository metadata URL', () => {
    expect(
      buildRepositoryMetaUrl({ owner: 'ultraworkers', repo: 'claw-code' }),
    ).toBe('https://api.github.com/repos/ultraworkers/claw-code')
  })

  it('builds the default-branch commits URL with a single result', () => {
    expect(
      buildDefaultBranchCommitsUrl({
        owner: 'ultraworkers',
        repo: 'claw-code',
      }),
    ).toBe(
      'https://api.github.com/repos/ultraworkers/claw-code/commits?per_page=1',
    )
  })
})

describe('isInactiveRepository', () => {
  it('exposes the 90-day threshold', () => {
    expect(INACTIVE_WARNING_THRESHOLD_DAYS).toBe(90)
  })

  it('marks repositories whose latest commit is older than the threshold', () => {
    expect(isInactiveRepository(daysAgo(91), NOW)).toBe(true)
    expect(isInactiveRepository(daysAgo(730), NOW)).toBe(true)
  })

  it('does not mark repositories exactly at the threshold', () => {
    expect(isInactiveRepository(daysAgo(90), NOW)).toBe(false)
  })

  it('does not mark repositories newer than the threshold', () => {
    expect(isInactiveRepository(daysAgo(89), NOW)).toBe(false)
    expect(isInactiveRepository(daysAgo(1), NOW)).toBe(false)
  })
})
