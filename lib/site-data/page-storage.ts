/**
 * 注入页面执行的存储函数。
 * 注意：这些函数会被序列化后注入，不能引用模块作用域。
 */

export type PageStorageSnapshot = {
  localStorageKeys: number
  sessionStorageKeys: number
  indexedDBNames: string[]
  cacheNames: string[]
  serviceWorkerRegistrations: number
}

export async function collectPageStorageSnapshot(): Promise<PageStorageSnapshot> {
  const databases =
    typeof indexedDB !== 'undefined' && 'databases' in indexedDB
      ? await indexedDB.databases()
      : []
  const cacheNames = typeof caches !== 'undefined' ? await caches.keys() : []
  const registrations =
    'serviceWorker' in navigator
      ? await navigator.serviceWorker.getRegistrations()
      : []

  return {
    localStorageKeys: localStorage.length,
    sessionStorageKeys: sessionStorage.length,
    indexedDBNames: databases.flatMap((database) =>
      database.name ? [database.name] : [],
    ),
    cacheNames,
    serviceWorkerRegistrations: registrations.length,
  }
}

export function clearPageSessionStorage(): void {
  sessionStorage.clear()
}
