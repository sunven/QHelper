/**
 * 工具分类常量
 */

import { ToolCategory } from '@/lib/registry/ToolMetadata';

export const TOOL_CATEGORIES: Record<ToolCategory, string> = {
  [ToolCategory.COMMON]: '常用',
  [ToolCategory.ENCODING]: '编码转换',
  [ToolCategory.IMAGE]: '图片工具',
  [ToolCategory.SECURITY]: '安全与加密',
  [ToolCategory.WEB_FORMAT]: 'Web 格式',
  [ToolCategory.DATA_FORMAT]: '数据格式',
  [ToolCategory.AI]: 'AI 工具',
  [ToolCategory.OTHER]: '其他',
} as const;
