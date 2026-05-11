export interface Tool {
  /** 工具唯一标识符 */
  key: string;
  /** 工具显示名称 */
  name: string;
  /** 工具页面路径（相对于扩展根目录） */
  path: string;
  /** 工具描述（可选，用于tooltip） */
  description?: string;
}

export interface ToolCategory {
  /** 分类唯一标识符 */
  key: string;
  /** 分类显示名称 */
  name: string;
  /** 该分类下的工具列表 */
  tools: Tool[];
}

export const TOOL_CATEGORIES: ToolCategory[] = [
  {
    key: 'common',
    name: '常用',
    tools: [
      {
        key: 'json',
        name: 'JSON 格式化',
        path: '/tools/json.html',
        description: 'JSON 格式化、压缩、diff 对比',
      },
      {
        key: 'trans-radix',
        name: '进制转换',
        path: '/tools/trans-radix.html',
        description: '二进制、八进制、十进制、十六进制转换',
      },
    ],
  },
  {
    key: 'encoding',
    name: '编码转换',
    tools: [
      {
        key: 'convert',
        name: '字符串编解码',
        path: '/tools/convert.html',
        description: 'Base64、URL、HTML 实体编解码',
      },
      {
        key: 'codebeautify',
        name: '代码美化',
        path: '/tools/codebeautify.html',
        description: 'JavaScript/HTML/CSS 代码美化',
      },
      {
        key: 'uglify',
        name: '代码压缩',
        path: '/tools/uglify.html',
        description: 'JavaScript 代码压缩混淆',
      },
    ],
  },
  {
    key: 'image',
    name: '图片工具',
    tools: [
      {
        key: 'imagebase64',
        name: '图片 Base64',
        path: '/tools/imagebase64.html',
        description: '图片转 Base64 编码',
      },
      {
        key: 'pictureSplicing',
        name: '图片拼接',
        path: '/tools/pictureSplicing.html',
        description: '多张图片纵向/横向拼接',
      },
    ],
  },
  {
    key: 'security',
    name: '安全与加密',
    tools: [
      {
        key: 'uuid',
        name: 'UUID 生成器',
        path: '/tools/uuid.html',
        description: '生成 UUID v4 标识符',
      },
      {
        key: 'password',
        name: '密码生成器',
        path: '/tools/password.html',
        description: '生成安全的随机密码',
      },
    ],
  },
  {
    key: 'web_format',
    name: 'Web 格式',
    tools: [
      {
        key: 'markdown',
        name: 'Markdown 编辑器',
        path: '/tools/markdown.html',
        description: 'Markdown 实时预览、导出 HTML',
      },
      {
        key: 'htmlformat',
        name: 'HTML 格式化器',
        path: '/tools/htmlformat.html',
        description: 'HTML 美化、压缩、格式化',
      },
      {
        key: 'urlparser',
        name: 'URL 解析器',
        path: '/tools/urlparser.html',
        description: '解析 URL 各个组成部分',
      },
      {
        key: 'filemerge',
        name: 'JS 文件合并',
        path: '/tools/filemerge.html',
        description: '合并多个远程 JavaScript 文件',
      },
      {
        key: 'csstool',
        name: 'CSS 工具',
        path: '/tools/csstool.html',
        description: 'CSS 美化、压缩、优化',
      },
      {
        key: 'scss',
        name: 'SCSS 编译器',
        path: '/tools/scss.html',
        description: 'SCSS/SASS 编译为 CSS',
      },
      {
        key: 'svgoptimizer',
        name: 'SVG 优化器',
        path: '/tools/svgoptimizer.html',
        description: 'SVG 优化、压缩、减小文件大小',
      },
    ],
  },
  {
    key: 'data_format',
    name: '数据格式',
    tools: [
      {
        key: 'csv2json',
        name: 'CSV 转 JSON',
        path: '/tools/csv2json.html',
        description: 'CSV 格式转换为 JSON 格式',
      },
      {
        key: 'yaml',
        name: 'YAML 转换器',
        path: '/tools/yaml.html',
        description: 'YAML 与 JSON 格式互转',
      },
      {
        key: 'toml',
        name: 'TOML 解析器',
        path: '/tools/toml.html',
        description: 'TOML ↔ JSON 转换、验证',
      },
      {
        key: 'jsonschema',
        name: 'JSON Schema 验证器',
        path: '/tools/json.htmlschema',
        description: '使用 JSON Schema 验证 JSON 数据结构',
      },
      {
        key: 'xmlformatter',
        name: 'XML 格式化器',
        path: '/tools/xmlformatter.html',
        description: 'XML 美化、压缩、格式化、验证',
      },
      {
        key: 'cron',
        name: 'Cron 解析器',
        path: '/tools/cron.html',
        description: 'Cron 表达式解析、验证、计算运行时间',
      },
    ],
  },
  {
    key: 'other',
    name: '其他',
    tools: [
      {
        key: 'timestamp',
        name: '时间戳转换',
        path: '/tools/timestamp.html',
        description: 'Unix 时间戳与日期时间互转',
      },
      {
        key: 'colorTransform',
        name: '颜色转换',
        path: '/tools/colorTransform.html',
        description: 'RGB、HEX、HSL 颜色格式转换',
      },
      {
        key: 'downloads',
        name: '下载清理',
        path: '/tools/downloads.html',
        description: '清理原始文件已删除的下载历史记录',
      },
    ],
  },
];
