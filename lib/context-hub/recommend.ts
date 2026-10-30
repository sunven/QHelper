import type { ContextDetectionResult, ContextRecommendation } from './types'

const urlFallbackRecommendations: ContextRecommendation[] = [
  {
    id: 'url-facts-only',
    label: '浏览工具目录',
    description: '已识别 URL 结构，可在识别结果中查看协议、主机和查询参数。',
    confidence: 'low',
    kind: 'fallback',
  },
]

const recommendationByKind: Record<
  Exclude<ContextDetectionResult['kind'], 'unknown' | 'jwt'>,
  ContextRecommendation[]
> = {
  json: [
    {
      id: 'open-json',
      label: '打开 JSON 格式化',
      description: '格式化、压缩或对比 JSON 数据。',
      toolId: 'json',
      confidence: 'high',
      kind: 'tool',
    },
  ],
  url: urlFallbackRecommendations,
  base64: [
    {
      id: 'open-convert',
      label: '打开字符串编解码',
      description: '继续进行 Base64、URL、HTML 实体等编解码操作。',
      toolId: 'convert',
      confidence: 'high',
      kind: 'tool',
    },
  ],
  timestamp: [
    {
      id: 'open-timestamp',
      label: '打开时间戳转换',
      description: '查看本地时间、UTC 时间并进行时间戳互转。',
      toolId: 'timestamp',
      confidence: 'high',
      kind: 'tool',
    },
  ],
}

const jwtRecommendations: ContextRecommendation[] = [
  {
    id: 'jwt-preview',
    label: '查看 JWT 预览',
    description: '在 Context Hub 内查看已解码的 header 和 payload。',
    confidence: 'high',
    kind: 'local',
  },
  {
    id: 'jwt-json',
    label: '打开 JSON 格式化',
    description: '复制 header 或 payload 后继续格式化查看。',
    toolId: 'json',
    confidence: 'medium',
    kind: 'tool',
  },
  {
    id: 'jwt-convert',
    label: '打开字符串编解码',
    description: '继续检查 Base64URL/Base64 编码片段。',
    toolId: 'convert',
    confidence: 'medium',
    kind: 'tool',
  },
]

const fallbackRecommendations: ContextRecommendation[] = [
  {
    id: 'manual-browse',
    label: '浏览工具目录',
    description: '暂未识别出明确格式，可以从左侧工具目录手动选择。',
    confidence: 'low',
    kind: 'fallback',
  },
]

export function getContextRecommendations(
  detection: ContextDetectionResult,
): ContextRecommendation[] {
  if (detection.kind === 'unknown') {
    return fallbackRecommendations
  }

  if (detection.kind === 'jwt') {
    return jwtRecommendations
  }

  return recommendationByKind[detection.kind]
}
