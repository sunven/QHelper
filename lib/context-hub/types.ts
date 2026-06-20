export type ContextInputKind =
  | 'json'
  | 'url'
  | 'base64'
  | 'timestamp'
  | 'jwt'
  | 'cron'
  | 'unknown'

export type ContextDetectionConfidence = 'high' | 'medium' | 'low'

export type ContextDetectedFact = {
  label: string
  value: string
}

export type ContextDetectionResult = {
  kind: ContextInputKind
  confidence: ContextDetectionConfidence
  summary: string
  facts: ContextDetectedFact[]
}

export type ContextRecommendation = {
  id: string
  label: string
  description: string
  toolId?: string
  confidence: ContextDetectionConfidence
  kind: 'tool' | 'local' | 'fallback'
}

export type ParsedJwt = {
  header: Record<string, unknown>
  payload: Record<string, unknown>
  signature: string
}
