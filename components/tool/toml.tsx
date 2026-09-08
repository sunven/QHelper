import TOMLParser from 'toml-j0.4'
import { FileCode, FileJson } from 'lucide-react'
import { createTransformToolPage } from '@/components/tool/transform-tool-page'

// 转换方向由 mode 表达，无额外选项
type TomlOptions = object

type TomlValue = string | number | boolean | TomlValue[] | { [key: string]: TomlValue }

/**
 * JSON → TOML 序列化。toml-j0.4 只有 parse（stringify 在包中不存在，
 * 旧代码调用它永远抛错），这里提供最小的 TOML 输出。
 */
function jsonToToml(value: { [key: string]: TomlValue }): string {
  const lines: string[] = []
  const tables: string[] = []

  for (const [key, entry] of Object.entries(value)) {
    if (entry !== null && typeof entry === 'object' && !Array.isArray(entry)) {
      tables.push(`[${key}]\n${jsonToToml(entry)}`)
      continue
    }
    if (entry === null) {
      lines.push(`${key} = "" # null`)
      continue
    }
    if (typeof entry === 'number' || typeof entry === 'boolean') {
      lines.push(`${key} = ${String(entry)}`)
      continue
    }
    if (Array.isArray(entry)) {
      lines.push(`${key} = ${JSON.stringify(entry)}`)
      continue
    }
    lines.push(`${key} = ${JSON.stringify(entry)}`)
  }

  return [...lines, ...tables].join('\n') + (lines.length + tables.length > 0 ? '\n' : '')
}

/** TOML ↔ JSON 转换：纯函数，直接可测 */
export function transformToml(
  input: string,
  options: TomlOptions & { mode: 'toml-to-json' | 'json-to-toml' },
): string | Error {
  try {
    if (options.mode === 'toml-to-json') {
      const result = TOMLParser.parse(input)
      return JSON.stringify(result, null, 2)
    }
    return jsonToToml(JSON.parse(input) as { [key: string]: TomlValue })
  } catch (err) {
    return err instanceof Error ? err : new Error('解析错误')
  }
}

const DEFAULT_INPUT = `# 示例 TOML 配置
title = "TOML 示例"
owner = "Toml Preston"

[database]
server = "192.168.1.1"
ports = [8001, 8002, 8003]

[servers.alpha]
ip = "10.0.0.1"
dc = "eqdc10"
`

export const TomlParser = createTransformToolPage<'toml-to-json' | 'json-to-toml', TomlOptions>({
  toolId: 'toml',
  transform: transformToml,
  defaultInput: DEFAULT_INPUT,
  defaultOptions: {},
  directions: [
    {
      mode: 'toml-to-json',
      label: 'TOML → JSON',
      inputLabel: 'TOML 输入',
      outputLabel: 'JSON 输出',
      icon: <FileJson className="w-4 h-4" />,
    },
    {
      mode: 'json-to-toml',
      label: 'JSON → TOML',
      inputLabel: 'JSON 输入',
      outputLabel: 'TOML 输出',
      icon: <FileCode className="w-4 h-4" />,
    },
  ],
  download: {
    prefix: 'converted',
    extension: (mode) => (mode === 'toml-to-json' ? 'json' : 'toml'),
  },
})
