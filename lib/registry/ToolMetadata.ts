/**
 * 工具分类枚举
 */
export enum ToolCategory {
  COMMON = 'common',              // 常用
  ENCODING = 'encoding',          // 编码转换
  IMAGE = 'image',                // 图片工具
  SECURITY = 'security',          // 安全与加密
  WEB_FORMAT = 'web_format',      // Web 格式
  DATA_FORMAT = 'data_format',    // 数据格式
  AI = 'ai',                      // AI 工具
  OTHER = 'other',                // 其他
}

/**
 * 工具功能标志
 */
export enum ToolFeature {
  // 输入/输出
  SINGLE_INPUT = 'single_input',
  DUAL_INPUT = 'dual_input',
  FILE_INPUT = 'file_input',
  DRAG_DROP = 'drag_drop',

  // 功能
  HISTORY = 'history',
  EXPORT = 'export',
  IMPORT = 'import',
  COPY_RESULT = 'copy_result',

  // AI 相关（阶段 5）
  AI_ASSIST = 'ai_assist',
  AI_GENERATE = 'ai_generate',

  // 实时
  REAL_TIME = 'real_time',
}

/**
 * 工具状态
 */
export enum ToolStatus {
  STABLE = 'stable',
  BETA = 'beta',
  EXPERIMENTAL = 'experimental',
  DEPRECATED = 'deprecated',
}

/**
 * 工具元数据接口
 */
export interface ToolMetadata {
  // 基础信息
  id: string;
  name: string;
  nameEn: string;
  category: ToolCategory;
  icon: string;

  // 描述
  description: string;
  descriptionEn: string;
  keywords: string[];
  tags: string[];

  // 入口点
  entry: string;

  // 版本
  version: string;

  // 功能
  features: ToolFeature[];

  // 状态
  status: ToolStatus;
}
