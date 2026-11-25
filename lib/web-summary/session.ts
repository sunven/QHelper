import type { WebSummaryConversation } from '@/types/web-summary'

const PREFIX = 'webSummaryConversation:'
const writes = new Map<number, Promise<void>>()

export async function loadConversation(
  windowId: number,
): Promise<WebSummaryConversation | null> {
  await writes.get(windowId)?.catch(() => undefined)
  const key = `${PREFIX}${windowId}`
  const stored = (await chrome.storage.session.get(key))[key] as
    | WebSummaryConversation
    | undefined
  if (!stored) return null
  if (
    stored.windowId !== windowId ||
    !stored.page?.content ||
    !Array.isArray(stored.messages)
  ) {
    throw new Error('无法恢复此窗口的对话，请清除对话后重新开始。')
  }
  return {
    ...stored,
    messages: stored.messages.map((message) =>
      message.status === 'streaming'
        ? { ...message, status: 'stopped' }
        : message,
    ),
  }
}

export function saveConversation(
  windowId: number,
  conversation: WebSummaryConversation | null,
): Promise<void> {
  const key = `${PREFIX}${windowId}`
  const write = (writes.get(windowId) ?? Promise.resolve())
    .catch(() => undefined)
    .then(async () => {
      // Never fall back to local storage: page content must not survive a restart.
      if (conversation) {
        await chrome.storage.session.set({ [key]: conversation })
        try {
          await chrome.windows.get(windowId)
        } catch {
          await chrome.storage.session.remove(key)
        }
      } else await chrome.storage.session.remove(key)
    })
  writes.set(windowId, write)
  void write
    .finally(() => {
      if (writes.get(windowId) === write) writes.delete(windowId)
    })
    .catch(() => undefined)
  return write
}

export function clearWindowConversation(windowId: number): Promise<void> {
  return saveConversation(windowId, null)
}
