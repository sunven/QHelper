/**
 * Chrome Storage API 封装
 */
export async function get<T>(key: string, defaultValue?: T): Promise<T> {
  const result = await chrome.storage.local.get(key);
  return result[key] ?? defaultValue;
}

export async function set<T>(key: string, value: T): Promise<void> {
  await chrome.storage.local.set({ [key]: value });
}

export async function remove(key: string): Promise<void> {
  await chrome.storage.local.remove(key);
}

export async function clear(): Promise<void> {
  await chrome.storage.local.clear();
}

export function onChanged(
  callback: (changes: { [key: string]: chrome.storage.StorageChange },
  areaName: string) => void,
): void {
  chrome.storage.onChanged.addListener(callback);
}
