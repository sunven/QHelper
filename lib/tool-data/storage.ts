export type DataStore = {
  run?: <T>(action: () => Promise<T>) => Promise<T>
  get: <T>(key: string) => Promise<T | undefined>
  set: <T>(key: string, value: T) => Promise<void>
  remove: (key: string) => Promise<void>
  subscribe: <T>(
    key: string,
    listener: (value: T | undefined) => void,
  ) => () => void
}

const CHANGE_EVENT = 'qhelper-local-data-change'
const queues = new Map<string, Promise<unknown>>()

export function withDataLock<T>(
  id: string,
  action: () => Promise<T>,
): Promise<T> {
  if (globalThis.navigator?.locks)
    return navigator.locks.request(`qhelper:data:${id}`, action)
  const result = (queues.get(id) ?? Promise.resolve())
    .catch(() => undefined)
    .then(action)
  queues.set(id, result)
  void result
    .finally(() => {
      if (queues.get(id) === result) queues.delete(id)
    })
    .catch(() => undefined)
  return result
}

export async function readData<T>(key: string): Promise<T | undefined> {
  if (globalThis.chrome?.storage?.local) {
    try {
      const values = await chrome.storage.local.get(key)
      if (values[key] !== undefined) return values[key] as T
    } catch {
      /* Read the local fallback below. */
    }
  }
  const value = globalThis.localStorage?.getItem(key)
  return value ? (JSON.parse(value) as T) : undefined
}

function notify(key: string) {
  if (typeof window !== 'undefined')
    window.dispatchEvent(new CustomEvent(CHANGE_EVENT, { detail: key }))
}

export async function writeData<T>(key: string, value: T): Promise<void> {
  if (globalThis.chrome?.storage?.local) {
    try {
      await chrome.storage.local.set({ [key]: value })
      globalThis.localStorage?.removeItem(key)
      notify(key)
      return
    } catch {
      /* A failed fallback must reach the caller. */
    }
  }
  if (!globalThis.localStorage) throw new Error('本机存储不可用')
  localStorage.setItem(key, JSON.stringify(value))
  notify(key)
}

export async function deleteData(key: string): Promise<void> {
  const results = await Promise.allSettled([
    globalThis.chrome?.storage?.local?.remove(key),
    Promise.resolve().then(() => globalThis.localStorage?.removeItem(key)),
  ])
  notify(key)
  const failure = results.find((result) => result.status === 'rejected')
  if (failure?.status === 'rejected') throw failure.reason
}

export function subscribeData<T>(
  key: string,
  listener: (value: T | undefined) => void,
) {
  let active = true
  const update = () => {
    void readData<T>(key)
      .then((value) => {
        if (active) listener(value)
      })
      .catch(() => undefined)
  }
  const chromeListener = (
    changes: Record<string, chrome.storage.StorageChange>,
    area: string,
  ) => {
    if (area === 'local' && key in changes) update()
  }
  const storageListener = (event: StorageEvent) => {
    if (event.key === key) update()
  }
  const localListener = (event: Event) => {
    if ((event as CustomEvent<string>).detail === key) update()
  }
  globalThis.chrome?.storage?.onChanged?.addListener(chromeListener)
  globalThis.window?.addEventListener('storage', storageListener)
  globalThis.window?.addEventListener(CHANGE_EVENT, localListener)
  return () => {
    active = false
    globalThis.chrome?.storage?.onChanged?.removeListener(chromeListener)
    globalThis.window?.removeEventListener('storage', storageListener)
    globalThis.window?.removeEventListener(CHANGE_EVENT, localListener)
  }
}

export function generationKey(toolId: string) {
  return `qhelper.tool-generation.${toolId}`
}

export function createToolDataStore(toolId: string): DataStore {
  const generation = readData<string>(generationKey(toolId))
  async function guard<T>(action: () => Promise<T>): Promise<T> {
    const expected = await generation
    return withDataLock(toolId, async () => {
      if ((await readData<string>(generationKey(toolId))) !== expected) {
        throw new Error('该工具的数据已清理，请重新打开后操作。')
      }
      return action()
    })
  }
  return {
    run: guard,
    get: <T>(key: string) => guard(() => readData<T>(key)),
    set: (key, value) => guard(() => writeData(key, value)),
    remove: (key) => guard(() => deleteData(key)),
    subscribe: subscribeData,
  }
}

export function createMemoryDataStore(): DataStore {
  const values = new Map<string, unknown>()
  const listeners = new Map<string, Set<(value: unknown) => void>>()
  const notifyMemory = (key: string) => {
    for (const listener of listeners.get(key) ?? []) listener(values.get(key))
  }
  return {
    get: async <T>(key: string) => values.get(key) as T | undefined,
    set: async (key, value) => {
      values.set(key, value)
      notifyMemory(key)
    },
    remove: async (key) => {
      values.delete(key)
      notifyMemory(key)
    },
    subscribe: <T>(key: string, listener: (value: T | undefined) => void) => {
      const notifyListener = (value: unknown) =>
        listener(value as T | undefined)
      const group = listeners.get(key) ?? new Set()
      group.add(notifyListener)
      listeners.set(key, group)
      return () => {
        group.delete(notifyListener)
      }
    },
  }
}
