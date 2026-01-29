/**
 * 存储相关类型定义
 */

export interface HistoryEntry<TInput = unknown, TOutput = unknown> {
  id: string;
  timestamp: number;
  input: TInput;
  output: TOutput;
  metadata?: Record<string, unknown>;
}

export interface GlobalSettings {
  theme: 'light' | 'dark' | 'auto';
  favoriteTools: string[];
  recentTools: string[];
  pinnedTools: string[];
  language: 'zh-CN';
  aiProvider?: 'openai' | 'anthropic' | 'custom';
  aiApiKey?: string;
  aiModel?: string;
  aiBaseUrl?: string;
  maxHistoryItems: number;
  autoSave: boolean;
}
