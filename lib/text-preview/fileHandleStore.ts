import type {
  FileHandleStore,
  TextPreviewFileSystemFileHandle,
  TextPreviewWindow,
} from './fileSystemAccessTypes'

export const FILE_HANDLE_DATABASE_NAME = 'qhelper-text-preview-file-handles'

const DATABASE_VERSION = 1
const STORE_NAME = 'handles'

type StoredHandleRecord = {
  fileId: string
  handle: TextPreviewFileSystemFileHandle
  savedAt: number
}

export function getDefaultFileHandleStore(): FileHandleStore {
  const testStore = getTextPreviewWindow().__TEXT_PREVIEW_FILE_HANDLE_STORE__
  return testStore ?? browserFileHandleStore
}

export const browserFileHandleStore: FileHandleStore = {
  async put(fileId, handle) {
    try {
      const database = await openDatabase()
      await runTransaction(database, 'readwrite', (store) => {
        store.put({ fileId, handle, savedAt: Date.now() } satisfies StoredHandleRecord)
      })
      database.close()
      return { ok: true }
    } catch {
      return { ok: false, warning: '文件授权保存失败，刷新后可能需要重新打开文件。' }
    }
  },

  async get(fileId) {
    try {
      const database = await openDatabase()
      const record = await getRecord(database, fileId)
      database.close()
      return record?.handle
    } catch {
      return undefined
    }
  },

  async delete(fileId) {
    try {
      const database = await openDatabase()
      await runTransaction(database, 'readwrite', (store) => {
        store.delete(fileId)
      })
      database.close()
      return { ok: true }
    } catch {
      return { ok: false, warning: '文件授权删除失败。' }
    }
  },

  async clear() {
    try {
      const database = await openDatabase()
      await runTransaction(database, 'readwrite', (store) => {
        store.clear()
      })
      database.close()
      return { ok: true }
    } catch {
      return { ok: false, warning: '文件授权清空失败，请在浏览器站点设置中手动清除。' }
    }
  },
}

export function createMemoryFileHandleStore(
  initialValues: Record<string, TextPreviewFileSystemFileHandle> = {},
): FileHandleStore {
  const handles = new Map(Object.entries(initialValues))

  return {
    async put(fileId, handle) {
      handles.set(fileId, handle)
      return { ok: true }
    },
    async get(fileId) {
      return handles.get(fileId)
    },
    async delete(fileId) {
      handles.delete(fileId)
      return { ok: true }
    },
    async clear() {
      handles.clear()
      return { ok: true }
    },
  }
}

function openDatabase() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(FILE_HANDLE_DATABASE_NAME, DATABASE_VERSION)

    request.onupgradeneeded = () => {
      const database = request.result
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        database.createObjectStore(STORE_NAME, { keyPath: 'fileId' })
      }
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

function runTransaction(
  database: IDBDatabase,
  mode: IDBTransactionMode,
  callback: (store: IDBObjectStore) => void,
) {
  return new Promise<void>((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, mode)
    const store = transaction.objectStore(STORE_NAME)

    callback(store)

    transaction.oncomplete = () => resolve()
    transaction.onerror = () => reject(transaction.error)
    transaction.onabort = () => reject(transaction.error)
  })
}

function getRecord(database: IDBDatabase, fileId: string) {
  return new Promise<StoredHandleRecord | undefined>((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, 'readonly')
    const store = transaction.objectStore(STORE_NAME)
    const request = store.get(fileId)

    request.onsuccess = () => resolve(request.result as StoredHandleRecord | undefined)
    request.onerror = () => reject(request.error)
  })
}

function getTextPreviewWindow() {
  return window as TextPreviewWindow
}
