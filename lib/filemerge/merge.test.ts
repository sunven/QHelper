import { describe, expect, it, vi } from 'vitest'
import { buildDownloadFileName, mergeInputText, mergeRemoteText, parseMergeInput } from './merge'

describe('parseMergeInput', () => {
  it('trims lines, ignores blanks, and preserves plain URL lines', () => {
    expect(parseMergeInput('\n  https://example.com/a.js  \n\nhttps://example.com/b.js\n')).toEqual([
      'https://example.com/a.js',
      'https://example.com/b.js',
    ])
  })

  it('extracts double-quoted script src values', () => {
    expect(parseMergeInput('<script src="https://example.com/a.js"></script>')).toEqual([
      'https://example.com/a.js',
    ])
  })

  it('extracts single-quoted script src values', () => {
    expect(parseMergeInput("<script src='https://example.com/a.js'></script>")).toEqual([
      'https://example.com/a.js',
    ])
  })

  it('keeps script-like lines unchanged when no src can be extracted', () => {
    expect(parseMergeInput('<script>console.log(1)</script>')).toEqual(['<script>console.log(1)</script>'])
  })
})

describe('mergeRemoteText', () => {
  it('fetches text in input order and trims the final trailing newline', async () => {
    const fetcher = vi.fn(async (url: string) => {
      const data: Record<string, string> = {
        'https://example.com/a.js': 'const a = 1;',
        'https://example.com/b.js': 'const b = 2;',
      }

      return data[url]
    })

    await expect(mergeRemoteText(['https://example.com/a.js', 'https://example.com/b.js'], fetcher)).resolves.toBe(
      'const a = 1;\nconst b = 2;',
    )
    expect(fetcher).toHaveBeenNthCalledWith(1, 'https://example.com/a.js')
    expect(fetcher).toHaveBeenNthCalledWith(2, 'https://example.com/b.js')
  })

  it('rejects when any fetch rejects', async () => {
    const fetcher = vi.fn(async (url: string) => {
      if (url.endsWith('/b.js')) {
        throw new Error('network failed')
      }

      return 'const a = 1;'
    })

    await expect(mergeRemoteText(['https://example.com/a.js', 'https://example.com/b.js'], fetcher)).rejects.toThrow(
      'network failed',
    )
    expect(fetcher).toHaveBeenCalledTimes(2)
  })
})

describe('mergeInputText', () => {
  it('parses script tags before fetching remote text', async () => {
    const fetcher = vi.fn(async (url: string) => `loaded:${url}`)

    await expect(mergeInputText('<script src="https://example.com/a.js"></script>', fetcher)).resolves.toBe(
      'loaded:https://example.com/a.js',
    )
  })
})

describe('buildDownloadFileName', () => {
  it('creates a timestamp-based JavaScript file name', () => {
    expect(buildDownloadFileName(123456)).toBe('123456.js')
  })
})
