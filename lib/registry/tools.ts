import type { ToolMetadata } from './ToolMetadata'
import { ToolCategory } from './ToolMetadata'

/**
 * 所有工具的注册列表
 *
 * 新增工具时，在此处添加工具元数据
 */
export const tools = [
  // ===== 常用工具 =====
  {
    id: 'trans-radix',
    keywords: ['binary', 'hex', '十六进制'],
    name: '进制转换',
    category: ToolCategory.COMMON,
    icon: 'Calculator',
    description: '二进制、八进制、十进制、十六进制转换',
  },

  {
    id: 'auto-refresh',
    keywords: ['auto refresh', 'reload', '定时刷新'],
    name: '自动刷新',
    category: ToolCategory.COMMON,
    icon: 'ArrowsClockwise',
    description: '按固定间隔自动刷新指定网页',
  },

  // ===== 其他工具 =====
  {
    id: 'downloads',
    name: '下载清理',
    category: ToolCategory.OTHER,
    icon: 'Trash',
    description: '清理原始文件已删除的下载历史记录',
  },

  {
    id: 'clear-site-data',
    keywords: [
      'cookie',
      'storage',
      'localStorage',
      'sessionStorage',
      'indexedDB',
      '站点数据',
      '缓存',
      '存储',
    ],
    name: '清除站点数据',
    category: ToolCategory.OTHER,
    icon: 'Trash',
    description:
      '按站点清理 Cookie、localStorage、sessionStorage、IndexedDB、Cache Storage 与 Service Worker',
  },

  // ===== 安全与加密 =====
  {
    id: 'uuid',
    name: 'UUID 生成器',
    category: ToolCategory.SECURITY,
    icon: 'Hash',
    description: '生成 UUID v4 标识符',
  },

  {
    id: 'password',
    keywords: ['随机密码', 'random password'],
    name: '密码生成器',
    category: ToolCategory.SECURITY,
    icon: 'ShieldCheck',
    description: '生成安全的随机密码',
  },

  {
    id: 'aes-gcm',
    name: 'AES-GCM 加解密',
    category: ToolCategory.SECURITY,
    icon: 'ShieldCheck',
    description: '使用口令进行 AES-GCM 文本加解密',
  },

  {
    id: 'bcrypt-hash',
    name: 'Bcrypt Hash',
    category: ToolCategory.SECURITY,
    icon: 'Hash',
    description: '生成并校验 Bcrypt 密码 Hash',
  },
] as const satisfies readonly ToolMetadata[]
