import { beforeEach, describe, expect, it, vi } from 'vitest'
import { installToolDataStorage } from '@/test/tool-data-storage'
import {
  clearToolData,
  getToolDataSummary,
  getToolSnapshots,
  saveToolSnapshot,
} from './manager'
import { createToolDataStore, readData, writeData } from './storage'

vi.mock('@/lib/text-preview/fileHandleStore', () => ({
  browserFileHandleStore: { clear: vi.fn(async () => ({ ok: true })) },
  countStoredFileHandles: vi.fn(async () => 0),
}))

describe('tool content management', () => {
  let values: ReturnType<typeof installToolDataStorage>
  beforeEach(() => {
    vi.clearAllMocks()
    values = installToolDataStorage()
  })

  it('removes both content copies while preserving preferences, credentials and other tools', async () => {
    Object.assign(values.local, {
      tool_qrcode_text: 'private',
      tool_qrcode_size: 280,
      webSummaryConfig: { apiKey: 'credential' },
      tool_convert_srcText: 'other',
    })
    localStorage.setItem('tool_qrcode_text', JSON.stringify('old fallback'))
    await saveToolSnapshot('qrcode', { text: 'snapshot' })
    await clearToolData('qrcode')
    expect(values.local.tool_qrcode_text).toBeUndefined()
    expect(localStorage.getItem('tool_qrcode_text')).toBeNull()
    expect(await getToolSnapshots('qrcode')).toEqual([])
    expect(values.local.tool_qrcode_size).toBe(280)
    expect(values.local.webSummaryConfig).toEqual({ apiKey: 'credential' })
    expect(values.local.tool_convert_srcText).toBe('other')
  })

  it('rejects a stale page write even when it arrives after clearing finished', async () => {
    const oldPage = createToolDataStore('convert')
    await oldPage.set('tool_convert_srcText', 'before')
    await clearToolData('convert')
    await expect(
      oldPage.set('tool_convert_srcText', 'resurrected'),
    ).rejects.toThrow('已清理')
    expect(await readData('tool_convert_srcText')).toBeUndefined()
    const newPage = createToolDataStore('convert')
    await newPage.set('tool_convert_srcText', 'new edit')
    expect(await readData('tool_convert_srcText')).toBe('new edit')
  })

  it('serializes an in-flight operation before clearing and blocks later stale writes', async () => {
    const page = createToolDataStore('convert')
    await page.get('tool_convert_srcText')
    let release!: () => void
    let started!: () => void
    const ready = new Promise<void>((resolve) => {
      started = resolve
    })
    const gate = new Promise<void>((resolve) => {
      release = resolve
    })
    const pending = page.run!(async () => {
      started()
      await gate
      await writeData('tool_convert_srcText', 'late')
    })
    await ready
    const clearing = clearToolData('convert')
    release()
    await Promise.all([pending, clearing])
    expect(await readData('tool_convert_srcText')).toBeUndefined()
  })

  it('clears legacy formatter content without allowing it to migrate again', async () => {
    values.local['tool_htmlformat_htmlformat-state'] = [
      { input: '<private />' },
    ]
    await clearToolData('formatter')
    expect(values.local['tool_htmlformat_htmlformat-state']).toBeUndefined()
    expect(values.local['tool_formatter_history-migrated']).toBe(true)
  })

  it('reports partial removal failure', async () => {
    vi.mocked(chrome.storage.local.remove).mockRejectedValueOnce(
      new Error('unavailable'),
    )
    await expect(clearToolData('convert')).rejects.toThrow('部分数据')
  })

  it('includes malformed fallback content so it remains clearable', async () => {
    localStorage.setItem('tool_convert_srcText', '{broken')
    const row = (await getToolDataSummary()).find(
      (item) => item.toolId === 'convert',
    )!
    expect(row.records).toBe(1)
    expect(row.bytes).toBeGreaterThan(0)
    await clearToolData('convert')
    expect(localStorage.getItem('tool_convert_srcText')).toBeNull()
  })

  it('keeps snapshots separate from a draft and reports content size', async () => {
    values.local.tool_convert_srcText = 'original'
    await saveToolSnapshot('convert', { srcText: 'saved' })
    expect(values.local.tool_convert_srcText).toBe('original')
    expect((await getToolSnapshots('convert'))[0].values).toEqual({
      srcText: 'saved',
    })
    const summary = (await getToolDataSummary()).find(
      (row) => row.toolId === 'convert',
    )!
    expect(summary.records).toBe(2)
    expect(summary.bytes).toBeGreaterThan(0)
    expect(summary.categories).toEqual(['输入', '快照'])
  })
})
