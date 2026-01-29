/**
 * 最近使用工具管理
 */

import * as chromeStorage from '@/lib/chrome/storage';

const RECENT_TOOLS_KEY = 'recent_tools';
const MAX_RECENT_TOOLS = 8;

export interface RecentToolEntry {
  toolId: string;
  toolName: string;
  timestamp: number;
}

/**
 * 记录工具使用
 */
export async function trackToolUsage(toolId: string, toolName: string): Promise<void> {
  const recent = await getRecentTools();

  // 移除相同工具的旧记录
  const filtered = recent.filter((t) => t.toolId !== toolId);

  // 添加到开头
  const newEntry: RecentToolEntry = {
    toolId,
    toolName,
    timestamp: Date.now(),
  };

  const updated = [newEntry, ...filtered].slice(0, MAX_RECENT_TOOLS);

  await chromeStorage.set(RECENT_TOOLS_KEY, updated);
}

/**
 * 获取最近使用的工具列表
 */
export async function getRecentTools(): Promise<RecentToolEntry[]> {
  try {
    const stored = await chromeStorage.get<RecentToolEntry[]>(RECENT_TOOLS_KEY, []);
    return stored || [];
  } catch {
    return [];
  }
}

/**
 * 清除最近使用记录
 */
export async function clearRecentTools(): Promise<void> {
  await chromeStorage.remove(RECENT_TOOLS_KEY);
}

/**
 * 监听最近使用工具变化
 */
export function onRecentToolsChange(
  callback: (recentTools: RecentToolEntry[]) => void,
): () => void {
  const handler = (changes: { [key: string]: chrome.storage.StorageChange }, areaName: string) => {
    if (areaName === 'local' && RECENT_TOOLS_KEY in changes) {
      callback((changes[RECENT_TOOLS_KEY].newValue as RecentToolEntry[]) || []);
    }
  };

  chrome.storage.onChanged.addListener(handler);

  return () => {
    chrome.storage.onChanged.removeListener(handler);
  };
}
