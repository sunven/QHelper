import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  AUTO_REFRESH_MASTER_STORAGE_KEY,
  AUTO_REFRESH_PAUSED_STORAGE_KEY,
  AUTO_REFRESH_RULES_STORAGE_KEY,
  AUTO_REFRESH_SESSIONS_STORAGE_KEY,
  type AutoRefreshResponse,
} from '@/types/auto-refresh'
import { createAutoRefreshController } from './background'
import { getRuleAlarmName } from './url'

type Mock = ReturnType<typeof vi.fn>

const localGet = chrome.storage.local.get as unknown as Mock
const localSet = chrome.storage.local.set as unknown as Mock
const sessionGet = chrome.storage.session.get as unknown as Mock
const sessionSet = chrome.storage.session.set as unknown as Mock
const tabsQuery = chrome.tabs.query as unknown as Mock
const tabsGet = chrome.tabs.get as unknown as Mock
const tabsSendMessage = chrome.tabs.sendMessage as unknown as Mock
const tabsReload = chrome.tabs.reload as unknown as Mock
const alarmsGetAll = chrome.alarms.getAll as unknown as Mock
const alarmsGet = chrome.alarms.get as unknown as Mock
const alarmsCreate = chrome.alarms.create as unknown as Mock
const alarmsClear = chrome.alarms.clear as unknown as Mock
const setBadgeText = chrome.action.setBadgeText as unknown as Mock
const scriptingExecuteScript = chrome.scripting.executeScript as unknown as Mock
const runtimeGetManifest = vi.fn(() => ({
  name: 'QHelper',
  content_scripts: [{ js: ['content-scripts/auto-refresh.js'] }],
}))

;(
  chrome.runtime as unknown as { getManifest: typeof runtimeGetManifest }
).getManifest = runtimeGetManifest

let localStore: Record<string, unknown>
let sessionStore: Record<string, unknown>

const rule = {
  id: 'rule-1',
  url: 'https://example.com/a',
  intervalSeconds: 30,
  enabled: true,
  createdAt: 1,
  updatedAt: 1,
}

function createTab(overrides: Partial<chrome.tabs.Tab> = {}): chrome.tabs.Tab {
  return {
    id: 1,
    url: rule.url,
    status: 'complete',
    discarded: false,
    frozen: false,
    ...overrides,
  } as chrome.tabs.Tab
}

function callMessage(
  controller: ReturnType<typeof createAutoRefreshController>,
  message: unknown,
  sender: chrome.runtime.MessageSender = {},
): Promise<AutoRefreshResponse<unknown>> {
  return new Promise((resolve) => {
    const handled = controller.handleMessage(message, sender, (response) => {
      resolve(response as AutoRefreshResponse<unknown>)
    })
    expect(handled).toBe(true)
  })
}

describe('auto-refresh/background', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStore = {
      [AUTO_REFRESH_MASTER_STORAGE_KEY]: true,
      [AUTO_REFRESH_RULES_STORAGE_KEY]: [rule],
    }
    sessionStore = {}

    localGet.mockImplementation(async (key: string) => ({
      [key]: localStore[key],
    }))
    localSet.mockImplementation(async (items: Record<string, unknown>) => {
      localStore = { ...localStore, ...items }
    })
    sessionGet.mockImplementation(async (key: string) => ({
      [key]: sessionStore[key],
    }))
    sessionSet.mockImplementation(async (items: Record<string, unknown>) => {
      sessionStore = { ...sessionStore, ...items }
    })

    tabsQuery.mockResolvedValue([])
    tabsGet.mockResolvedValue(createTab())
    tabsSendMessage.mockResolvedValue({ ok: true })
    tabsReload.mockResolvedValue(undefined)
    alarmsGetAll.mockResolvedValue([])
    alarmsGet.mockResolvedValue(undefined)
    alarmsCreate.mockResolvedValue(undefined)
    alarmsClear.mockResolvedValue(undefined)
    setBadgeText.mockResolvedValue(undefined)
    ;(
      chrome.action.setBadgeBackgroundColor as unknown as Mock
    ).mockResolvedValue(undefined)
    ;(chrome.action.setTitle as unknown as Mock).mockResolvedValue(undefined)
    ;(chrome.tabs.create as unknown as Mock).mockResolvedValue({})
    scriptingExecuteScript.mockResolvedValue([])
  })

  it('returns the effective rule state to a content script', async () => {
    alarmsGet.mockResolvedValue({
      name: getRuleAlarmName(rule.id),
      scheduledTime: 5000,
      periodInMinutes: 0.5,
    })

    const response = await callMessage(
      createAutoRefreshController(),
      { type: 'AUTO_REFRESH_CONTENT_READY' },
      { tab: createTab() },
    )

    expect(response).toEqual({
      ok: true,
      data: expect.objectContaining({
        tabId: 1,
        effective: 'rule',
        nextRefreshAt: 5000,
      }),
    })
  })

  it('reloads only eligible tabs on an alarm tick', async () => {
    sessionStore[AUTO_REFRESH_SESSIONS_STORAGE_KEY] = {
      4: {
        url: rule.url,
        intervalSeconds: 5,
        startedAt: 1,
      },
    }
    sessionStore[AUTO_REFRESH_PAUSED_STORAGE_KEY] = [3]

    tabsQuery.mockResolvedValue([
      createTab({ id: 1 }),
      createTab({ id: 2, status: 'loading' }),
      createTab({ id: 3 }),
      createTab({ id: 4 }),
      createTab({ id: 5, url: 'https://other.example/' }),
      createTab({ id: 6, discarded: true }),
    ])
    alarmsGet.mockResolvedValue({
      name: getRuleAlarmName(rule.id),
      scheduledTime: 9000,
      periodInMinutes: 0.5,
    })

    await createAutoRefreshController().handleAlarm({
      name: getRuleAlarmName(rule.id),
      scheduledTime: 0,
      periodInMinutes: 0.5,
      persistAcrossSessions: false,
    })

    expect(tabsReload).toHaveBeenCalledTimes(1)
    expect(tabsReload).toHaveBeenCalledWith(1)
  })

  it('starts a session after the content script responds to a ping', async () => {
    tabsQuery.mockResolvedValue([createTab()])

    const response = await callMessage(createAutoRefreshController(), {
      type: 'AUTO_REFRESH_START_SESSION',
      tabId: 1,
      intervalSeconds: 10,
    })

    expect(response.ok).toBe(true)
    expect(sessionSet).toHaveBeenCalledWith({
      [AUTO_REFRESH_SESSIONS_STORAGE_KEY]: {
        1: expect.objectContaining({
          tabId: 1,
          url: rule.url,
          intervalSeconds: 10,
        }),
      },
    })
  })

  it('injects the content script when the first ping has no receiver', async () => {
    tabsQuery.mockResolvedValue([createTab()])

    let messageCount = 0
    tabsSendMessage.mockImplementation(async () => {
      messageCount += 1
      if (messageCount <= 3) {
        throw new Error('Could not establish connection')
      }
      return { ok: true, data: true }
    })

    const response = await callMessage(createAutoRefreshController(), {
      type: 'AUTO_REFRESH_START_SESSION',
      tabId: 1,
      intervalSeconds: 10,
    })

    expect(response.ok).toBe(true)
    expect(scriptingExecuteScript).toHaveBeenCalledWith({
      target: { tabId: 1 },
      files: ['content-scripts/auto-refresh.js'],
    })
    expect(sessionSet).toHaveBeenCalled()
  })

  it('reports a clear error when the page blocks content script injection', async () => {
    tabsSendMessage.mockRejectedValue(
      new Error('Could not establish connection'),
    )
    scriptingExecuteScript.mockRejectedValue(
      new Error('Cannot access contents of the page'),
    )

    const response = await callMessage(createAutoRefreshController(), {
      type: 'AUTO_REFRESH_START_SESSION',
      tabId: 1,
      intervalSeconds: 10,
    })

    expect(response).toEqual({
      ok: false,
      error:
        '无法启动临时刷新：页面可能未成功加载或禁止扩展脚本。可改用持久规则在后台定时刷新。',
    })
    expect(sessionSet).not.toHaveBeenCalled()
  })

  it('refuses to start a session on a paused tab', async () => {
    sessionStore[AUTO_REFRESH_PAUSED_STORAGE_KEY] = [1]

    const response = await callMessage(createAutoRefreshController(), {
      type: 'AUTO_REFRESH_START_SESSION',
      tabId: 1,
      intervalSeconds: 10,
    })

    expect(response).toEqual({
      ok: false,
      error: '此标签页已暂停，请先恢复',
    })
    expect(sessionSet).not.toHaveBeenCalled()
  })

  it('keeps concurrent session starts for different tabs', async () => {
    tabsGet.mockImplementation(async (tabId: number) =>
      createTab({ id: tabId, url: `https://example.com/${tabId}` }),
    )

    const controller = createAutoRefreshController()
    const [first, second] = await Promise.all([
      callMessage(controller, {
        type: 'AUTO_REFRESH_START_SESSION',
        tabId: 1,
        intervalSeconds: 10,
      }),
      callMessage(controller, {
        type: 'AUTO_REFRESH_START_SESSION',
        tabId: 2,
        intervalSeconds: 10,
      }),
    ])

    expect(first.ok).toBe(true)
    expect(second.ok).toBe(true)
    expect(sessionStore[AUTO_REFRESH_SESSIONS_STORAGE_KEY]).toMatchObject({
      1: expect.objectContaining({ tabId: 1 }),
      2: expect.objectContaining({ tabId: 2 }),
    })
  })

  it('keeps concurrent rule updates from overwriting each other', async () => {
    localStore[AUTO_REFRESH_RULES_STORAGE_KEY] = [
      rule,
      { ...rule, id: 'rule-2', url: 'https://example.com/b' },
    ]

    const controller = createAutoRefreshController()
    await Promise.all([
      callMessage(controller, {
        type: 'AUTO_REFRESH_SET_RULE_ENABLED',
        id: 'rule-1',
        enabled: false,
      }),
      callMessage(controller, {
        type: 'AUTO_REFRESH_SET_RULE_ENABLED',
        id: 'rule-2',
        enabled: false,
      }),
    ])

    const rules = localStore[AUTO_REFRESH_RULES_STORAGE_KEY] as Array<{
      id: string
      enabled: boolean
    }>
    expect(rules.find((candidate) => candidate.id === 'rule-1')?.enabled).toBe(
      false,
    )
    expect(rules.find((candidate) => candidate.id === 'rule-2')?.enabled).toBe(
      false,
    )
  })

  it('reports reconcile failures instead of claiming success', async () => {
    alarmsGetAll.mockRejectedValue(new Error('alarms unavailable'))

    const response = await callMessage(createAutoRefreshController(), {
      type: 'AUTO_REFRESH_SET_RULE_ENABLED',
      id: 'rule-1',
      enabled: false,
    })

    expect(response).toEqual({ ok: false, error: 'alarms unavailable' })
  })
})
