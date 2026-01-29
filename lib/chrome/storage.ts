/**
 * Chrome Storage API 封装
 *
 * 支持 chrome.storage.local 和 localStorage (fallback)
 */

/**
 * 检查 chrome.storage API 是否可用
 */
function isChromeStorageAvailable(): boolean {
  try {
    return typeof chrome !== 'undefined' && chrome.storage !== undefined && 'local' in chrome.storage;
  } catch {
    return false;
  }
}

/**
 * 获取 Chrome storage
 */
function getChromeStorage() {
  if (!isChromeStorageAvailable()) {
    throw new Error('chrome.storage.local is not available');
  }
  return chrome.storage.local;
}

/**
 * 使用 localStorage 作为备用方案
 */
function getLocalStorage() {
  if (typeof localStorage === 'undefined') {
    throw new Error('localStorage is not available');
  }
  return localStorage;
}

export async function get<T>(key: string, defaultValue?: T): Promise<T> {
  // 优先使用 chrome.storage.local
  if (isChromeStorageAvailable()) {
    try {
      const storage = getChromeStorage();
      const result = await storage.get(key);
      return (result[key] ?? defaultValue) as T;
    } catch (e) {
      console.warn('chrome.storage.local get failed, falling back to localStorage:', e);
    }
  }

  // 备用方案：localStorage
  try {
    const storage = getLocalStorage();
    const value = storage.getItem(key);
    return value ? (JSON.parse(value) as T) : defaultValue;
  } catch (e) {
    console.warn('localStorage get failed:', e);
    return defaultValue as T;
  }
}

export async function set<T>(key: string, value: T): Promise<void> {
  // 优先使用 chrome.storage.local
  if (isChromeStorageAvailable()) {
    try {
      const storage = getChromeStorage();
      await storage.set({ [key]: value });
      return;
    } catch (e) {
      console.warn('chrome.storage.local set failed, falling back to localStorage:', e);
    }
  }

  // 备用方案：localStorage
  try {
    const storage = getLocalStorage();
    storage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.warn('localStorage set failed:', e);
  }
}

export async function remove(key: string): Promise<void> {
  // 优先使用 chrome.storage.local
  if (isChromeStorageAvailable()) {
    try {
      const storage = getChromeStorage();
      await storage.remove(key);
      return;
    } catch (e) {
      console.warn('chrome.storage.local remove failed, falling back to localStorage:', e);
    }
  }

  // 备用方案：localStorage
  try {
    const storage = getLocalStorage();
    storage.removeItem(key);
  } catch (e) {
    console.warn('localStorage remove failed:', e);
  }
}

export async function clear(): Promise<void> {
  // 优先使用 chrome.storage.local
  if (isChromeStorageAvailable()) {
    try {
      const storage = getChromeStorage();
      await storage.clear();
      return;
    } catch (e) {
      console.warn('chrome.storage.local clear failed, falling back to localStorage:', e);
    }
  }

  // 备用方案：localStorage
  try {
    const storage = getLocalStorage();
    storage.clear();
  } catch (e) {
    console.warn('localStorage clear failed:', e);
  }
}

export function onChanged(
  callback: (changes: { [key: string]: chrome.storage.StorageChange },
  areaName: string) => void,
): void {
  if (!isChromeStorageAvailable()) {
    console.warn('chrome.storage is not available, using storage event listener as fallback');
    // 使用 window 的 storage 事件作为备用
    window.addEventListener('storage', (event) => {
      if (event.key && event.newValue !== event.oldValue) {
        const changes: { [key: string]: chrome.storage.StorageChange } = {
          [event.key]: {
            oldValue: event.oldValue ? JSON.parse(event.oldValue) : undefined,
            newValue: event.newValue ? JSON.parse(event.newValue) : undefined,
          },
        };
        callback(changes, 'local');
      }
    });
    return;
  }
  chrome.storage.onChanged.addListener(callback);
}
