import { describe, expect, it } from 'vitest'
import {
  classifyDownloadForCleanup,
  classifyDownloadsForCleanup,
  getCleanupCandidates,
  getCleanupIds,
  type CleanupDownloadItem,
} from './cleanup'

describe('downloads/cleanup', () => {
  it('classifies confirmed missing records as cleanup candidates', () => {
    expect(classifyDownloadForCleanup({ id: 1, exists: false })).toBe('missing')
  })

  it('classifies existing records as existing', () => {
    expect(classifyDownloadForCleanup({ id: 1, exists: true })).toBe('existing')
  })

  it('classifies unreliable existence states as unknown', () => {
    expect(classifyDownloadForCleanup({ id: 1 })).toBe('unknown')
    expect(classifyDownloadForCleanup({ id: 1, exists: null })).toBe('unknown')
    expect(classifyDownloadForCleanup({ exists: false })).toBe('unknown')
  })

  it('includes only confirmed missing records in cleanup candidates', () => {
    const items: CleanupDownloadItem[] = [
      { id: 1, exists: false },
      { id: 2, exists: true },
      { id: 3 },
      { exists: false },
    ]

    expect(getCleanupCandidates(items)).toEqual([
      expect.objectContaining({ id: 1, cleanupStatus: 'missing' }),
    ])
    expect(getCleanupIds(items)).toEqual([1])
  })

  it('preserves status counts for mixed input', () => {
    const summary = classifyDownloadsForCleanup([
      { id: 1, exists: false },
      { id: 2, exists: false },
      { id: 3, exists: true },
      { id: 4 },
    ])

    expect(summary.missing).toHaveLength(2)
    expect(summary.existing).toHaveLength(1)
    expect(summary.unknown).toHaveLength(1)
  })

  it('handles empty input', () => {
    expect(classifyDownloadsForCleanup([])).toEqual({
      existing: [],
      missing: [],
      unknown: [],
    })
    expect(getCleanupIds([])).toEqual([])
  })
})
