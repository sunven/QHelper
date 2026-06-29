import type { ToolMetadata } from './ToolMetadata'
import { ToolCategory } from './ToolMetadata'

/**
 * 所有工具的注册列表
 *
 * 新增工具时，在此处添加工具元数据
 */
export const tools: ToolMetadata[] = [
  // ===== 常用工具 =====
  {
    id: 'json',
    name: 'JSON 格式化',
    category: ToolCategory.COMMON,
    icon: 'Code',
    description: 'JSON 格式化、压缩、diff 对比',
  },

  {
    id: 'context-hub',
    name: 'Context Hub',
    category: ToolCategory.COMMON,
    icon: 'Sparkle',
    description: '本地识别开发数据并推荐下一步工具',
    preserveActivity: false,
  },

  {
    id: 'text-preview',
    name: '文本预览',
    category: ToolCategory.COMMON,
    icon: 'FileText',
    description: '本地提取文本中的 IP、URL、命令和路径',
    preserveActivity: false,
  },

  {
    id: 'trans-radix',
    name: '进制转换',
    category: ToolCategory.COMMON,
    icon: 'Calculator',
    description: '二进制、八进制、十进制、十六进制转换',
  },

  // ===== 编码转换 =====
  {
    id: 'convert',
    name: '字符串编解码',
    category: ToolCategory.ENCODING,
    icon: 'ArrowsLeftRight',
    description: 'Base64、URL、HTML 实体编解码',
  },

  {
    id: 'codebeautify',
    name: '代码美化',
    category: ToolCategory.ENCODING,
    icon: 'MagicWand',
    description: 'JavaScript/HTML/CSS 代码美化',
  },

  {
    id: 'uglify',
    name: '代码压缩',
    category: ToolCategory.ENCODING,
    icon: 'Sparkle',
    description: 'JavaScript 代码压缩混淆',
  },

  // ===== 图片工具 =====
  {
    id: 'imagebase64',
    name: '图片 Base64',
    category: ToolCategory.IMAGE,
    icon: 'Image',
    description: '图片转 Base64 编码',
  },

  {
    id: 'pictureSplicing',
    name: '图片拼接',
    category: ToolCategory.IMAGE,
    icon: 'ImageSquare',
    description: '多张图片纵向/横向拼接',
  },

  {
    id: 'ocr',
    name: 'OCR 文字识别',
    category: ToolCategory.IMAGE,
    icon: 'ScanText',
    description: '从图片中提取可复制文本',
    preserveActivity: false,
  },

  {
    id: 'qrcode',
    name: '二维码',
    category: ToolCategory.IMAGE,
    icon: 'QrCode',
    description: '生成二维码并从图片或摄像头识别二维码',
    preserveActivity: false,
  },

  // ===== 其他工具 =====
  {
    id: 'timestamp',
    name: '时间戳转换',
    category: ToolCategory.OTHER,
    icon: 'Clock',
    description: 'Unix 时间戳与日期时间互转',
  },

  {
    id: 'colorTransform',
    name: '颜色转换',
    category: ToolCategory.OTHER,
    icon: 'Palette',
    description: 'RGB、HEX、HSL 颜色格式转换',
  },

  {
    id: 'downloads',
    name: '下载清理',
    category: ToolCategory.OTHER,
    icon: 'Trash',
    description: '清理原始文件已删除的下载历史记录',
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

  // ===== Web 格式 =====
  {
    id: 'markdown',
    name: 'Markdown 编辑器',
    category: ToolCategory.WEB_FORMAT,
    icon: 'FileText',
    description: 'Markdown 实时预览、导出 HTML',
  },

  {
    id: 'htmlformat',
    name: 'HTML 格式化器',
    category: ToolCategory.WEB_FORMAT,
    icon: 'Code',
    description: 'HTML 美化、压缩、格式化',
  },

  {
    id: 'urlparser',
    name: 'URL 解析器',
    category: ToolCategory.WEB_FORMAT,
    icon: 'Link',
    description: '解析 URL 各个组成部分',
  },

  {
    id: 'filemerge',
    name: 'JS 文件合并',
    category: ToolCategory.WEB_FORMAT,
    icon: 'FileCode',
    description: '合并多个远程 JavaScript 文件',
  },

  {
    id: 'csstool',
    name: 'CSS 工具',
    category: ToolCategory.WEB_FORMAT,
    icon: 'Palette',
    description: 'CSS 美化、压缩、优化',
  },

  {
    id: 'svgoptimizer',
    name: 'SVG 优化器',
    category: ToolCategory.WEB_FORMAT,
    icon: 'ImageSquare',
    description: 'SVG 优化、压缩、减小文件大小',
  },

  {
    id: 'cron',
    name: 'Cron 解析器',
    category: ToolCategory.DATA_FORMAT,
    icon: 'Clock',
    description: 'Cron 表达式解析、验证、计算运行时间',
  },

  // ===== 数据格式 =====
  {
    id: 'csv2json',
    name: 'CSV 转 JSON',
    category: ToolCategory.DATA_FORMAT,
    icon: 'BracketsCurly',
    description: 'CSV 格式转换为 JSON 格式',
  },

  {
    id: 'yaml',
    name: 'YAML 转换器',
    category: ToolCategory.DATA_FORMAT,
    icon: 'FileCode',
    description: 'YAML 与 JSON 格式互转',
  },

  {
    id: 'toml',
    name: 'TOML 解析器',
    category: ToolCategory.DATA_FORMAT,
    icon: 'BracketsCurly',
    description: 'TOML ↔ JSON 转换、验证',
  },

  {
    id: 'jsonschema',
    name: 'JSON Schema 验证器',
    category: ToolCategory.DATA_FORMAT,
    icon: 'ShieldCheck',
    description: '使用 JSON Schema 验证 JSON 数据结构',
  },

  {
    id: 'xmlformatter',
    name: 'XML 格式化器',
    category: ToolCategory.DATA_FORMAT,
    icon: 'FileCode',
    description: 'XML 美化、压缩、格式化、验证',
  },
]
