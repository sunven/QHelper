/**
 * 工具相关类型定义
 */

import type { ToolCategory, ToolFeature, ToolStatus } from '@/lib/registry/ToolMetadata';

export type { ToolCategory, ToolFeature, ToolStatus };

/**
 * 旧版工具页历史记录快照类型（兼容 useToolHistory 的旧 API）
 */
export interface ToolHistoryItem {
  [key: string]: unknown;
}
