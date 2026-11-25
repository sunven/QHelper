import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { WebSummaryConversation } from '@/types/web-summary'
import {
  clearWindowConversation,
  loadConversation,
  saveConversation,
} from './session'

const conversation: WebSummaryConversation = {
  id: 'c',
  windowId: 1,
  tabId: 2,
  createdAt: 1,
  memory: 'remember',
  memoryThrough: 0,
  page: {
    title: 'Page',
    url: 'https://example.com',
    content: 'Full body',
    charCount: 9,
    source: 'article',
    truncated: false,
  },
  messages: [
    { id: 'a', role: 'assistant', content: 'Partial', status: 'streaming' },
  ],
}

describe('session conversation storage', () => {
  let stored: Record<string, unknown>
  beforeEach(() => {
    stored = {}
    vi.clearAllMocks()
    vi.mocked(chrome.storage.session.get).mockImplementation(async (key) => ({
      [String(key)]: stored[String(key)],
    }))
    vi.mocked(chrome.storage.session.set).mockImplementation(async (items) => {
      Object.assign(stored, structuredClone(items))
    })
    vi.mocked(chrome.storage.session.remove).mockImplementation(async (key) => {
      delete stored[String(key)]
    })
    vi.mocked(chrome.windows.get).mockImplementation(
      async (id) => ({ id }) as chrome.windows.Window,
    )
    vi.mocked(chrome.storage.local.set).mockClear()
  })
  it('restores a snapshot without treating an interrupted answer as complete', async () => {
    await saveConversation(1, conversation)
    expect(await loadConversation(1)).toMatchObject({
      page: conversation.page,
      messages: [{ content: 'Partial', status: 'stopped' }],
    })
    expect(await loadConversation(2)).toBeNull()
  })
  it('serializes a clear after an in-flight write', async () => {
    let release: () => void = () => {}
    vi.mocked(chrome.storage.session.set).mockImplementationOnce(
      async (items) => {
        await new Promise<void>((resolve) => {
          release = resolve
        })
        Object.assign(stored, items)
      },
    )
    const save = saveConversation(1, conversation)
    await vi.waitFor(() =>
      expect(chrome.storage.session.set).toHaveBeenCalled(),
    )
    const clear = clearWindowConversation(1)
    release()
    await Promise.all([save, clear])
    expect(await loadConversation(1)).toBeNull()
  })
  it('removes a late save when its browser window has closed', async () => {
    vi.mocked(chrome.windows.get).mockRejectedValueOnce(new Error('No window'))
    await saveConversation(1, conversation)
    expect(await loadConversation(1)).toBeNull()
  })
  it('surfaces storage quota failures and never falls back to persistent storage', async () => {
    vi.mocked(chrome.storage.session.set).mockRejectedValueOnce(
      new Error('quota'),
    )
    await expect(saveConversation(1, conversation)).rejects.toThrow('quota')
    expect(chrome.storage.local.set).not.toHaveBeenCalled()
  })
})
