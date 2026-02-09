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
        path: '/json.html',
        description: 'JSON 格式化、压缩、diff 对比',
      },
      {
        key: 'trans-radix',
        name: '进制转换',
        path: '/trans-radix.html',
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
        path: '/convert.html',
        description: 'Base64、URL、HTML 实体编解码',
      },
      {
        key: 'codebeautify',
        name: '代码美化',
        path: '/codebeautify.html',
        description: 'JavaScript/HTML/CSS 代码美化',
      },
      {
        key: 'uglify',
        name: '代码压缩',
        path: '/uglify.html',
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
        path: '/imagebase64.html',
        description: '图片转 Base64 编码',
      },
      {
        key: 'pictureSplicing',
        name: '图片拼接',
        path: '/pictureSplicing.html',
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
        path: '/uuid.html',
        description: '生成 UUID v4 标识符',
      },
      {
        key: 'password',
        name: '密码生成器',
        path: '/password.html',
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
        path: '/markdown.html',
        description: 'Markdown 实时预览、导出 HTML',
      },
      {
        key: 'htmlformat',
        name: 'HTML 格式化器',
        path: '/htmlformat.html',
        description: 'HTML 美化、压缩、格式化',
      },
      {
        key: 'urlparser',
        name: 'URL 解析器',
        path: '/urlparser.html',
        description: '解析 URL 各个组成部分',
      },
      {
        key: 'csstool',
        name: 'CSS 工具',
        path: '/csstool.html',
        description: 'CSS 美化、压缩、优化',
      },
      {
        key: 'scss',
        name: 'SCSS 编译器',
        path: '/scss.html',
        description: 'SCSS/SASS 编译为 CSS',
      },
      {
        key: 'svgoptimizer',
        name: 'SVG 优化器',
        path: '/svgoptimizer.html',
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
        path: '/csv2json.html',
        description: 'CSV 格式转换为 JSON 格式',
      },
      {
        key: 'yaml',
        name: 'YAML 转换器',
        path: '/yaml.html',
        description: 'YAML 与 JSON 格式互转',
      },
      {
        key: 'toml',
        name: 'TOML 解析器',
        path: '/toml.html',
        description: 'TOML ↔ JSON 转换、验证',
      },
      {
        key: 'jsonschema',
        name: 'JSON Schema 验证器',
        path: '/jsonschema.html',
        description: '使用 JSON Schema 验证 JSON 数据结构',
      },
      {
        key: 'xmlformatter',
        name: 'XML 格式化器',
        path: '/xmlformatter.html',
        description: 'XML 美化、压缩、格式化、验证',
      },
      {
        key: 'cron',
        name: 'Cron 解析器',
        path: '/cron.html',
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
        path: '/timestamp.html',
        description: 'Unix 时间戳与日期时间互转',
      },
      {
        key: 'colorTransform',
        name: '颜色转换',
        path: '/colorTransform.html',
        description: 'RGB、HEX、HSL 颜色格式转换',
      },
    ],
  },
];
