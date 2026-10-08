export const CONTENT_KEYS: Record<string, readonly string[]> = {
  json: ['tool_json_history'],
  convert: ['tool_convert_srcText', 'tool_convert_history'],
  timestamp: ['tool_timestamp_srcStamp', 'tool_timestamp_srcLocale'],
  qrcode: ['tool_qrcode_text'],
  markdown: ['tool_markdown_markdown-state'],
  formatter: [
    'tool_formatter_formatter-state',
    'tool_htmlformat_htmlformat-state',
    'tool_xmlformatter_xmlformatter-state',
    'tool_csstool_csstool-state',
  ],
  cron: ['tool_cron_cron-state'],
  toml: ['tool_toml_toml-state'],
  svgoptimizer: ['tool_svgoptimizer_svgoptimizer-state'],
  jsonschema: ['tool_jsonschema_jsonschema-state'],
  'text-preview': ['qhelper.text-preview.workspace.v1'],
  urlparser: [],
}

export const SESSION_TOOL_IDS = Object.keys(CONTENT_KEYS)
export function supportsToolSession(toolId: string) {
  return Object.prototype.hasOwnProperty.call(CONTENT_KEYS, toolId)
}
export function snapshotsKey(toolId: string) {
  return `tool_${toolId}_snapshots`
}
export function contentKeys(toolId: string) {
  return [...(CONTENT_KEYS[toolId] ?? []), snapshotsKey(toolId)]
}
export function isContentKey(key: string) {
  return Object.values(CONTENT_KEYS).some((keys) => keys.includes(key))
}
