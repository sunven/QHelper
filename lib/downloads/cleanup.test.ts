import { describe, expect, it } from 'vitest'
import {
  type CleanupDownloadItem,
  classifyDownloadForCleanup,
  classifyDownloadsForCleanup,
  getCleanupCandidates,
  getCleanupIds,
} from './cleanup'

describe('downloads/cleanup', () => {
  it('classifies confirmed missing completed records as cleanup candidates', () => {
    expect(
      classifyDownloadForCleanup({
        id: 1,
        exists: false,
        state: 'complete',
      }),
    ).toBe('missing')
  })

  it('classifies existing completed records as existing', () => {
    expect(
      classifyDownloadForCleanup({
        id: 1,
        exists: true,
        state: 'complete',
      }),
    ).toBe('existing')
  })

  it('skips records that have not completed', () => {
    expect(
      classifyDownloadForCleanup({
        id: 1,
        exists: false,
        state: 'in_progress',
      }),
    ).toBe('unknown')
    expect(
      classifyDownloadForCleanup({
        id: 1,
        exists: false,
        state: 'interrupted',
      }),
    ).toBe('unknown')
  })

  it('classifies unreliable existence states as unknown', () => {
    expect(classifyDownloadForCleanup({ id: 1, state: 'complete' })).toBe(
      'unknown',
    )
    expect(
      classifyDownloadForCleanup({
        id: 1,
        exists: null,
        state: 'complete',
      }),
    ).toBe('unknown')
    expect(
      classifyDownloadForCleanup({ exists: false, state: 'complete' }),
    ).toBe('unknown')
    expect(classifyDownloadForCleanup({ id: 1, exists: false })).toBe('unknown')
  })

  it('includes only completed confirmed missing records in cleanup candidates', () => {
    const items: CleanupDownloadItem[] = [
      { id: 1, exists: false, state: 'complete' },
      { id: 2, exists: true, state: 'complete' },
      { id: 3, exists: false, state: 'in_progress' },
      { id: 4, state: 'complete' },
      { exists: false, state: 'complete' },
    ]

    expect(getCleanupCandidates(items)).toEqual([
      expect.objectContaining({ id: 1, cleanupStatus: 'missing' }),
    ])
    expect(getCleanupIds(items)).toEqual([1])
  })

  it('preserves status counts for mixed input', () => {
    const summary = classifyDownloadsForCleanup([
      { id: 1, exists: false, state: 'complete' },
      { id: 2, exists: false, state: 'in_progress' },
      { id: 3, exists: true, state: 'complete' },
      { id: 4, state: 'complete' },
    ])

    expect(summary.missing).toHaveLength(1)
    expect(summary.existing).toHaveLength(1)
    expect(summary.unknown).toHaveLength(2)
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
