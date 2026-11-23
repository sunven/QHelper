import { getErrorMessage } from '@/lib/utils'
import type {
  AutoRefreshMessage,
  AutoRefreshResponse,
  AutoRefreshRuntimeSnapshot,
  AutoRefreshSaveRuleResult,
  AutoRefreshSnapshot,
  AutoRefreshTabState,
  RefreshRule,
} from '@/types/auto-refresh'
import {
  AUTO_REFRESH_ALARM_PREFIX,
  AUTO_REFRESH_MASTER_STORAGE_KEY,
  AUTO_REFRESH_RULE_MIN_SECONDS,
  AUTO_REFRESH_RULES_STORAGE_KEY,
  AUTO_REFRESH_SESSION_MIN_SECONDS,
} from '@/types/auto-refresh'
import { getRefreshRules, setMasterEnabled, writeRefreshRules } from './rules'
import {
  getPausedTabIds,
  getSessionRefreshes,
  removeTabRuntimeState,
  writePausedTabIds,
  writeSessionRefreshes,
} from './runtime'
import {
  buildSnapshot,
  canRefreshTab,
  isRefreshTargetTab,
  loadRuntimeSnapshot,
  resolveTabState,
} from './state'
import {
  getRuleAlarmName,
  getRuleIdFromAlarmName,
  normalizeIntervalSeconds,
  normalizePageUrl,
} from './url'

const AUTO_REFRESH_MANAGER_PATH = 'tools/auto-refresh.html'
const AUTO_REFRESH_BADGE_COLOR = '#2563eb'
const AUTO_REFRESH_PING_RETRIES = 3
const AUTO_REFRESH_PING_DELAY_MS = 120

const MUTATING_MESSAGE_TYPES = new Set<AutoRefreshMessage['type']>([
  'AUTO_REFRESH_SET_MASTER',
  'AUTO_REFRESH_SAVE_RULE',
  'AUTO_REFRESH_DELETE_RULE',
  'AUTO_REFRESH_SET_RULE_ENABLED',
  'AUTO_REFRESH_START_SESSION',
  'AUTO_REFRESH_STOP_SESSION',
  'AUTO_REFRESH_PAUSE_TAB',
  'AUTO_REFRESH_RESUME_TAB',
  'AUTO_REFRESH_PAUSE_SELF',
])

type AutoRefreshController = {
  initialize: () => Promise<void>
  reconcile: () => Promise<void>
  handleMessage: (
    message: unknown,
    sender: chrome.runtime.MessageSender,
    sendResponse: (response?: unknown) => void,
  ) => boolean
  handleAlarm: (alarm: chrome.alarms.Alarm) => Promise<void>
  handleTabUpdated: (
    tabId: number,
    changeInfo: chrome.tabs.OnUpdatedInfo,
    tab: chrome.tabs.Tab,
  ) => Promise<void>
  handleTabRemoved: (tabId: number) => Promise<void>
  handleStorageChanged: (
    changes: Record<string, chrome.storage.StorageChange>,
    areaName: chrome.storage.AreaName,
  ) => void
}

function ok<T>(data: T): AutoRefreshResponse<T> {
  return { ok: true, data }
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}

function getDefaultActionTitle(): string {
  try {
    return chrome.runtime.getManifest().name
  } catch {
    return '自动刷新'
  }
}

function getAutoRefreshContentScriptFile(): string | null {
  try {
    const manifest = chrome.runtime.getManifest()
    for (const script of manifest.content_scripts ?? []) {
      const file = script.js?.find((path) => path.includes('auto-refresh'))
      if (file) {
        return file
      }
    }
  } catch {}

  return null
}

async function injectAutoRefreshContentScript(tabId: number): Promise<boolean> {
  const file = getAutoRefreshContentScriptFile()
  if (!file) {
    return false
  }

  try {
    await chrome.scripting.executeScript({
      target: { tabId },
      files: [file],
    })
    return true
  } catch {
    return false
  }
}

async function sendTabState(
  tabId: number,
  state: AutoRefreshTabState,
): Promise<void> {
  try {
    await chrome.tabs.sendMessage(tabId, {
      type: 'AUTO_REFRESH_STATE_CHANGED',
      state,
    })
  } catch {}
}

async function withNextRefreshAt(
  state: AutoRefreshTabState,
): Promise<AutoRefreshTabState> {
  if (state.effective !== 'rule' || !state.rule) {
    return state
  }

  const alarm = await chrome.alarms.get(getRuleAlarmName(state.rule.id))
  return {
    ...state,
    nextRefreshAt: alarm?.scheduledTime,
  }
}

async function pingTab(tabId: number): Promise<boolean> {
  for (let attempt = 0; attempt < AUTO_REFRESH_PING_RETRIES; attempt += 1) {
    try {
      const response = (await chrome.tabs.sendMessage(tabId, {
        type: 'AUTO_REFRESH_PING',
      })) as { ok?: boolean } | undefined
      if (response?.ok === true) {
        return true
      }
    } catch {}

    if (attempt < AUTO_REFRESH_PING_RETRIES - 1) {
      await wait(AUTO_REFRESH_PING_DELAY_MS)
    }
  }

  return false
}

async function openManager(url?: string): Promise<void> {
  const normalizedUrl = typeof url === 'string' ? normalizePageUrl(url) : null
  const query = normalizedUrl ? `?url=${encodeURIComponent(normalizedUrl)}` : ''
  const managerUrl = `${chrome.runtime.getURL(AUTO_REFRESH_MANAGER_PATH)}${query}`
  await chrome.tabs.create({ url: managerUrl })
}

export function createAutoRefreshController(): AutoRefreshController {
  let initialized = false
  let reconcileRequested = false
  let reconcileQueue: Promise<void> = Promise.resolve()
  let stateMutationQueue: Promise<unknown> = Promise.resolve()

  function runExclusive<T>(task: () => Promise<T>): Promise<T> {
    const run = stateMutationQueue.then(task)
    stateMutationQueue = run.then(
      () => undefined,
      () => undefined,
    )
    return run
  }

  async function updateBadge(
    tabs?: readonly chrome.tabs.Tab[],
    runtime?: AutoRefreshRuntimeSnapshot,
  ): Promise<void> {
    try {
      const tabList = tabs ?? (await chrome.tabs.query({}))
      const snapshot = runtime ?? (await loadRuntimeSnapshot())
      let count = 0

      for (const tab of tabList) {
        if (typeof tab.id !== 'number' || !isRefreshTargetTab(tab)) {
          continue
        }

        const state = resolveTabState(tab.id, tab.url, snapshot)
        if (state.effective !== 'none') {
          count += 1
        }
      }

      const text = count > 0 ? (count > 99 ? '99+' : String(count)) : ''
      await chrome.action.setBadgeBackgroundColor({
        color: AUTO_REFRESH_BADGE_COLOR,
      })
      await chrome.action.setBadgeText({ text })
      await chrome.action.setTitle({
        title:
          count > 0 ? `自动刷新：${count} 个标签页` : getDefaultActionTitle(),
      })
    } catch {}
  }

  async function pushStatesToTabs(
    tabs: readonly chrome.tabs.Tab[],
    runtime: AutoRefreshRuntimeSnapshot,
  ): Promise<void> {
    await Promise.allSettled(
      tabs.map(async (tab) => {
        if (typeof tab.id !== 'number' || !isRefreshTargetTab(tab)) {
          return
        }

        const state = await withNextRefreshAt(
          resolveTabState(tab.id, tab.url, runtime),
        )
        await sendTabState(tab.id, state)
      }),
    )
  }

  async function reconcileAlarms(
    runtime: AutoRefreshRuntimeSnapshot,
  ): Promise<void> {
    const existingAlarms = await chrome.alarms.getAll()
    const desiredAlarms = new Map<string, number>()

    if (runtime.masterEnabled) {
      for (const rule of runtime.rules) {
        if (rule.enabled) {
          desiredAlarms.set(getRuleAlarmName(rule.id), rule.intervalSeconds)
        }
      }
    }

    for (const alarm of existingAlarms) {
      if (
        alarm.name.startsWith(AUTO_REFRESH_ALARM_PREFIX) &&
        !desiredAlarms.has(alarm.name)
      ) {
        await chrome.alarms.clear(alarm.name)
      }
    }

    for (const [alarmName, intervalSeconds] of desiredAlarms) {
      const periodInMinutes = intervalSeconds / 60
      const current = existingAlarms.find((alarm) => alarm.name === alarmName)
      const hasSamePeriod =
        typeof current?.periodInMinutes === 'number' &&
        Math.abs(current.periodInMinutes - periodInMinutes) < 1e-9

      if (!hasSamePeriod) {
        await chrome.alarms.create(alarmName, {
          delayInMinutes: periodInMinutes,
          periodInMinutes,
        })
      }
    }
  }

  async function reconcile(): Promise<void> {
    const [runtime, tabs] = await Promise.all([
      loadRuntimeSnapshot(),
      chrome.tabs.query({}),
    ])

    await reconcileAlarms(runtime)
    await pushStatesToTabs(tabs, runtime)
    await updateBadge(tabs, runtime)
  }

  function requestReconcile(): Promise<void> {
    if (reconcileRequested) {
      return reconcileQueue
    }

    reconcileRequested = true
    reconcileQueue = reconcileQueue
      .catch(() => undefined)
      .then(async () => {
        reconcileRequested = false
        await reconcile()
      })

    return reconcileQueue
  }

  async function getTabState(tabId: number): Promise<AutoRefreshTabState> {
    const [runtime, tab] = await Promise.all([
      loadRuntimeSnapshot(),
      chrome.tabs.get(tabId),
    ])

    return withNextRefreshAt(resolveTabState(tabId, tab.url, runtime))
  }

  async function getSnapshot(): Promise<AutoRefreshSnapshot> {
    const [runtime, tabs] = await Promise.all([
      loadRuntimeSnapshot(),
      chrome.tabs.query({}),
    ])
    return buildSnapshot(tabs, runtime)
  }

  async function refreshTabState(
    tabId: number,
    tab?: chrome.tabs.Tab,
  ): Promise<void> {
    try {
      const runtime = await loadRuntimeSnapshot()
      const targetTab = tab ?? (await chrome.tabs.get(tabId))
      if (typeof targetTab.id !== 'number' || !isRefreshTargetTab(targetTab)) {
        return
      }

      const state = await withNextRefreshAt(
        resolveTabState(targetTab.id, targetTab.url, runtime),
      )
      await sendTabState(targetTab.id, state)
    } catch {}
  }

  async function saveRule(
    message: Extract<AutoRefreshMessage, { type: 'AUTO_REFRESH_SAVE_RULE' }>,
  ): Promise<AutoRefreshSaveRuleResult> {
    const url = normalizePageUrl(message.url)
    if (!url) {
      throw new Error('仅支持 http(s) 网页地址')
    }

    const intervalSeconds = normalizeIntervalSeconds(
      'rule',
      message.intervalSeconds,
    )
    if (!intervalSeconds) {
      throw new Error(
        `持久规则间隔需在 ${AUTO_REFRESH_RULE_MIN_SECONDS} 秒到 24 小时之间`,
      )
    }

    const rules = await getRefreshRules()
    const existingIndex = message.id
      ? rules.findIndex((rule) => rule.id === message.id)
      : rules.findIndex((rule) => rule.url === url)

    if (message.id && existingIndex === -1) {
      throw new Error('规则不存在')
    }

    const collision = rules.find(
      (rule) =>
        rule.url === url &&
        rule.id !== (existingIndex >= 0 ? rules[existingIndex].id : message.id),
    )
    if (collision) {
      throw new Error('该 URL 已有规则')
    }

    const now = Date.now()

    if (existingIndex === -1) {
      const rule: RefreshRule = {
        id: crypto.randomUUID(),
        url,
        intervalSeconds,
        enabled: message.enabled ?? true,
        createdAt: now,
        updatedAt: now,
      }
      const nextRules = [...rules, rule]
      await writeRefreshRules(nextRules)
      await requestReconcile()
      return {
        created: true,
        rule,
        snapshot: await getSnapshot(),
      }
    }

    const existingRule = rules[existingIndex]
    const rule: RefreshRule = {
      ...existingRule,
      url,
      intervalSeconds,
      enabled: message.enabled ?? existingRule.enabled,
      updatedAt: now,
    }
    const nextRules = [...rules]
    nextRules[existingIndex] = rule
    await writeRefreshRules(nextRules)
    await requestReconcile()
    return {
      created: false,
      rule,
      snapshot: await getSnapshot(),
    }
  }

  async function deleteRule(ruleId: string): Promise<AutoRefreshSnapshot> {
    const rules = await getRefreshRules()
    const nextRules = rules.filter((rule) => rule.id !== ruleId)
    if (nextRules.length === rules.length) {
      throw new Error('规则不存在')
    }

    await writeRefreshRules(nextRules)
    await requestReconcile()
    return getSnapshot()
  }

  async function setRuleEnabled(
    ruleId: string,
    enabled: boolean,
  ): Promise<AutoRefreshSnapshot> {
    const rules = await getRefreshRules()
    const index = rules.findIndex((rule) => rule.id === ruleId)
    if (index === -1) {
      throw new Error('规则不存在')
    }

    const nextRules = [...rules]
    nextRules[index] = {
      ...nextRules[index],
      enabled,
      updatedAt: Date.now(),
    }
    await writeRefreshRules(nextRules)
    await requestReconcile()
    return getSnapshot()
  }

  async function startSession(
    tabId: number,
    intervalSecondsInput: number,
  ): Promise<AutoRefreshTabState> {
    const intervalSeconds = normalizeIntervalSeconds(
      'session',
      intervalSecondsInput,
    )
    if (!intervalSeconds) {
      throw new Error(
        `临时刷新间隔需在 ${AUTO_REFRESH_SESSION_MIN_SECONDS} 秒到 24 小时之间`,
      )
    }

    const runtime = await loadRuntimeSnapshot()
    if (!runtime.masterEnabled) {
      throw new Error('自动刷新已全局关闭')
    }
    if (runtime.pausedTabIds.includes(tabId)) {
      throw new Error('此标签页已暂停，请先恢复')
    }

    const tab = await chrome.tabs.get(tabId)
    const url = normalizePageUrl(tab.url)
    if (!url) {
      throw new Error('此页面不支持临时刷新')
    }

    if (!(await pingTab(tabId))) {
      const injected = await injectAutoRefreshContentScript(tabId)
      if (!injected || !(await pingTab(tabId))) {
        throw new Error(
          '无法启动临时刷新：页面可能未成功加载或禁止扩展脚本。可改用持久规则在后台定时刷新。',
        )
      }
    }

    const sessions = {
      ...runtime.sessions,
      [tabId]: {
        tabId,
        url,
        intervalSeconds,
        startedAt: Date.now(),
      },
    }
    await writeSessionRefreshes(sessions)
    const state = await getTabState(tabId)
    await sendTabState(tabId, state)
    await updateBadge()
    return state
  }

  async function stopSession(tabId: number): Promise<AutoRefreshTabState> {
    const sessions = await getSessionRefreshes()
    if (!(tabId in sessions)) {
      throw new Error('没有正在运行的临时刷新')
    }

    const nextSessions = { ...sessions }
    delete nextSessions[tabId]
    await writeSessionRefreshes(nextSessions)
    const state = await getTabState(tabId)
    await sendTabState(tabId, state)
    await updateBadge()
    return state
  }

  async function pauseTab(tabId: number): Promise<AutoRefreshTabState> {
    const pausedTabIds = await getPausedTabIds()
    if (!pausedTabIds.includes(tabId)) {
      await writePausedTabIds([...pausedTabIds, tabId])
    }

    const state = await getTabState(tabId)
    await sendTabState(tabId, state)
    await updateBadge()
    return state
  }

  async function resumeTab(tabId: number): Promise<AutoRefreshTabState> {
    const pausedTabIds = await getPausedTabIds()
    await writePausedTabIds(
      pausedTabIds.filter((pausedTabId) => pausedTabId !== tabId),
    )

    const state = await getTabState(tabId)
    await sendTabState(tabId, state)
    await updateBadge()
    return state
  }

  async function handleSessionTick(
    sender: chrome.runtime.MessageSender,
  ): Promise<{ reloaded: boolean; active: boolean }> {
    const tabId = sender.tab?.id
    if (typeof tabId !== 'number') {
      throw new Error('缺少标签页信息')
    }

    const runtime = await loadRuntimeSnapshot()
    if (!runtime.masterEnabled || runtime.pausedTabIds.includes(tabId)) {
      return { reloaded: false, active: false }
    }

    const tab = await chrome.tabs.get(tabId)
    const state = resolveTabState(tabId, tab.url, runtime)
    if (state.effective !== 'session') {
      return { reloaded: false, active: false }
    }

    if (!canRefreshTab(tab)) {
      return { reloaded: false, active: true }
    }

    await chrome.tabs.reload(tabId)
    return { reloaded: true, active: true }
  }

  async function handleAlarm(alarm: chrome.alarms.Alarm): Promise<void> {
    const ruleId = getRuleIdFromAlarmName(alarm.name)
    if (!ruleId) {
      return
    }

    const runtime = await loadRuntimeSnapshot()
    const rule = runtime.rules.find(
      (candidate) => candidate.id === ruleId && candidate.enabled,
    )

    if (!runtime.masterEnabled || !rule) {
      await chrome.alarms.clear(alarm.name)
      return
    }

    const tabs = await chrome.tabs.query({})
    const targetTabIds: number[] = []

    for (const tab of tabs) {
      if (typeof tab.id !== 'number' || !canRefreshTab(tab)) {
        continue
      }

      const state = resolveTabState(tab.id, tab.url, runtime)
      if (state.effective === 'rule' && state.rule?.id === rule.id) {
        targetTabIds.push(tab.id)
      }
    }

    await Promise.allSettled(
      targetTabIds.map((tabId) => chrome.tabs.reload(tabId)),
    )

    const nextAlarm = await chrome.alarms.get(alarm.name)
    await Promise.allSettled(
      tabs.map(async (tab) => {
        if (typeof tab.id !== 'number' || !isRefreshTargetTab(tab)) {
          return
        }

        const state = resolveTabState(tab.id, tab.url, runtime)
        if (state.effective !== 'rule' || state.rule?.id !== rule.id) {
          return
        }

        await sendTabState(tab.id, {
          ...state,
          nextRefreshAt: nextAlarm?.scheduledTime,
        })
      }),
    )
    await updateBadge(tabs, runtime)
  }

  async function handleTabUpdated(
    tabId: number,
    changeInfo: chrome.tabs.OnUpdatedInfo,
    tab: chrome.tabs.Tab,
  ): Promise<void> {
    if (changeInfo.url) {
      await refreshTabState(tabId, tab)
      await updateBadge()
      return
    }

    if (changeInfo.discarded !== undefined || changeInfo.frozen !== undefined) {
      await updateBadge()
    }
  }

  async function handleTabRemoved(tabId: number): Promise<void> {
    await runExclusive(() => removeTabRuntimeState(tabId))
    await updateBadge()
  }

  function handleStorageChanged(
    changes: Record<string, chrome.storage.StorageChange>,
    areaName: chrome.storage.AreaName,
  ): void {
    if (areaName !== 'local') {
      return
    }

    if (
      AUTO_REFRESH_RULES_STORAGE_KEY in changes ||
      AUTO_REFRESH_MASTER_STORAGE_KEY in changes
    ) {
      void requestReconcile().catch(() => undefined)
    }
  }

  function dispatch(
    message: AutoRefreshMessage,
    sender: chrome.runtime.MessageSender,
  ): Promise<AutoRefreshResponse<unknown>> {
    if (MUTATING_MESSAGE_TYPES.has(message.type)) {
      return runExclusive(() => dispatchMessage(message, sender))
    }

    return dispatchMessage(message, sender)
  }

  async function dispatchMessage(
    message: AutoRefreshMessage,
    sender: chrome.runtime.MessageSender,
  ): Promise<AutoRefreshResponse<unknown>> {
    switch (message.type) {
      case 'AUTO_REFRESH_GET_TAB_STATE':
        return ok(await getTabState(message.tabId))

      case 'AUTO_REFRESH_GET_SNAPSHOT':
        return ok(await getSnapshot())

      case 'AUTO_REFRESH_SET_MASTER':
        await setMasterEnabled(message.enabled)
        await requestReconcile()
        return ok(await getSnapshot())

      case 'AUTO_REFRESH_SAVE_RULE':
        return ok(await saveRule(message))

      case 'AUTO_REFRESH_DELETE_RULE':
        return ok(await deleteRule(message.id))

      case 'AUTO_REFRESH_SET_RULE_ENABLED':
        return ok(await setRuleEnabled(message.id, message.enabled))

      case 'AUTO_REFRESH_START_SESSION':
        return ok(await startSession(message.tabId, message.intervalSeconds))

      case 'AUTO_REFRESH_STOP_SESSION':
        return ok(await stopSession(message.tabId))

      case 'AUTO_REFRESH_PAUSE_TAB':
        return ok(await pauseTab(message.tabId))

      case 'AUTO_REFRESH_RESUME_TAB':
        return ok(await resumeTab(message.tabId))

      case 'AUTO_REFRESH_OPEN_MANAGER':
        await openManager(message.url)
        return ok({ opened: true })

      case 'AUTO_REFRESH_CONTENT_READY': {
        const tabId = sender.tab?.id
        if (typeof tabId !== 'number') {
          throw new Error('缺少标签页信息')
        }
        return ok(await getTabState(tabId))
      }

      case 'AUTO_REFRESH_SESSION_TICK':
        return ok(await handleSessionTick(sender))

      case 'AUTO_REFRESH_PAUSE_SELF': {
        const tabId = sender.tab?.id
        if (typeof tabId !== 'number') {
          throw new Error('缺少标签页信息')
        }
        return ok(await pauseTab(tabId))
      }

      case 'AUTO_REFRESH_OPEN_MANAGER_SELF': {
        const tabId = sender.tab?.id
        if (typeof tabId !== 'number') {
          throw new Error('缺少标签页信息')
        }
        const tab = await chrome.tabs.get(tabId)
        await openManager(tab.url)
        return ok({ opened: true })
      }

      case 'AUTO_REFRESH_PING':
        return ok(true)

      case 'AUTO_REFRESH_STATE_CHANGED':
        return ok(false)
    }
  }

  function handleMessage(
    message: unknown,
    sender: chrome.runtime.MessageSender,
    sendResponse: (response?: unknown) => void,
  ): boolean {
    const candidate = message as { type?: unknown } | undefined
    if (
      typeof candidate?.type !== 'string' ||
      !candidate.type.startsWith('AUTO_REFRESH_')
    ) {
      return false
    }

    void dispatch(candidate as AutoRefreshMessage, sender)
      .then(sendResponse)
      .catch((error) => {
        const response: AutoRefreshResponse<never> = {
          ok: false,
          error: getErrorMessage(error),
        }
        sendResponse(response)
      })

    return true
  }

  async function initialize(): Promise<void> {
    if (initialized) {
      return
    }

    initialized = true
    try {
      await requestReconcile()
    } catch {
      initialized = false
    }
  }

  return {
    initialize,
    reconcile: () => requestReconcile().catch(() => undefined),
    handleMessage,
    handleAlarm,
    handleTabUpdated,
    handleTabRemoved,
    handleStorageChanged,
  }
}
