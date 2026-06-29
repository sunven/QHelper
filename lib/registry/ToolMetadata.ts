/**
 * 工具分类枚举
 */
export enum ToolCategory {
  COMMON = 'common', // 常用
  ENCODING = 'encoding', // 编码转换
  IMAGE = 'image', // 图片工具
  SECURITY = 'security', // 安全与加密
  WEB_FORMAT = 'web_format', // Web 格式
  DATA_FORMAT = 'data_format', // 数据格式
  AI = 'ai', // AI 工具
  OTHER = 'other', // 其他
}

/**
 * 工具元数据接口
 */
export interface ToolMetadata {
  // 基础信息
  id: string
  name: string
  category: ToolCategory
  icon: string

  // 描述
  description: string

  // 路由行为：默认保留隐藏工具状态，内存较重的工具可选择关闭
  preserveActivity?: boolean
}
