/**
 * 存储相关类型定义
 */

export interface GlobalSettings {
  theme: 'light' | 'dark' | 'auto'
  favoriteTools: string[]
  pinnedTools: string[]
  language: 'zh-CN'
  aiProvider?: 'openai' | 'anthropic' | 'custom'
  aiApiKey?: string
  aiModel?: string
  aiBaseUrl?: string
  maxHistoryItems: number
  autoSave: boolean
}
