import cronParser from 'cron-parser'
import type { ContextDetectionResult } from './types'
import { parseJwt } from './jwt'

const UNKNOWN_RESULT: ContextDetectionResult = {
  kind: 'unknown',
  confidence: 'low',
  summary: 'No confident structured format detected.',
  facts: [],
}

function isRecordOrArray(value: unknown): value is Record<string, unknown> | unknown[] {
  return typeof value === 'object' && value !== null
}

function preview(value: string, maxLength = 120): string {
  return value.length > maxLength ? `${value.slice(0, maxLength - 1)}…` : value
}

function detectJwt(input: string): ContextDetectionResult | null {
  const parsed = parseJwt(input)
  if (!parsed) {
    return null
  }

  const facts = [
    typeof parsed.header.alg === 'string'
      ? { label: 'Algorithm', value: parsed.header.alg }
      : null,
    typeof parsed.header.typ === 'string'
      ? { label: 'Type', value: parsed.header.typ }
      : null,
  ].filter((fact): fact is { label: string; value: string } => fact !== null)

  return {
    kind: 'jwt',
    confidence: 'high',
    summary: 'JWT token with decodable header and payload.',
    facts,
  }
}

function detectJson(input: string): ContextDetectionResult | null {
  if (!input.startsWith('{') && !input.startsWith('[')) {
    return null
  }

  try {
    const parsed = JSON.parse(input)
    if (!isRecordOrArray(parsed)) {
      return null
    }

    return {
      kind: 'json',
      confidence: 'high',
      summary: Array.isArray(parsed) ? 'JSON array.' : 'JSON object.',
      facts: [
        {
          label: 'Top-level type',
          value: Array.isArray(parsed) ? 'array' : 'object',
        },
      ],
    }
  } catch {
    return null
  }
}

function detectUrl(input: string): ContextDetectionResult | null {
  try {
    const url = new URL(input)
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      return null
    }

    return {
      kind: 'url',
      confidence: 'high',
      summary: 'HTTP URL.',
      facts: [
        { label: 'Protocol', value: url.protocol.replace(':', '') },
        { label: 'Host', value: url.host },
      ],
    }
  } catch {
    return null
  }
}

function detectTimestamp(input: string): ContextDetectionResult | null {
  if (!/^\d{10}(\d{3})?$/.test(input)) {
    return null
  }

  const precision = input.length === 10 ? 'seconds' : 'milliseconds'
  const millis = precision === 'seconds' ? Number(input) * 1000 : Number(input)
  const date = new Date(millis)
  const minDate = Date.UTC(2000, 0, 1)
  const maxDate = Date.UTC(2100, 0, 1)

  if (!Number.isFinite(millis) || millis < minDate || millis > maxDate) {
    return null
  }

  return {
    kind: 'timestamp',
    confidence: 'high',
    summary: 'Plausible Unix timestamp.',
    facts: [
      { label: 'Precision', value: precision },
      { label: 'UTC time', value: date.toISOString() },
    ],
  }
}

function detectCron(input: string): ContextDetectionResult | null {
  if (input.trim().split(/\s+/).length !== 5) {
    return null
  }

  try {
    cronParser.parse(input)
    return {
      kind: 'cron',
      confidence: 'high',
      summary: 'Five-field Cron expression.',
      facts: [
        { label: 'Fields', value: '5' },
      ],
    }
  } catch {
    return null
  }
}

function detectBase64(input: string): ContextDetectionResult | null {
  if (
    input.length < 8 ||
    input.length % 4 !== 0 ||
    !/^[A-Za-z0-9+/]+={0,2}$/.test(input)
  ) {
    return null
  }

  try {
    const binary = atob(input)
    const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0))
    const decoded = new TextDecoder('utf-8', { fatal: true }).decode(bytes)

    if (!decoded.trim() || /[\u0000-\u0008\u000E-\u001F]/.test(decoded)) {
      return null
    }

    return {
      kind: 'base64',
      confidence: 'medium',
      summary: 'Base64-encoded UTF-8 text.',
      facts: [
        { label: 'Decoded preview', value: preview(decoded) },
      ],
    }
  } catch {
    return null
  }
}

export function detectContextInput(value: string): ContextDetectionResult {
  const input = value.trim()
  if (!input) {
    return UNKNOWN_RESULT
  }

  return (
    detectJwt(input) ??
    detectJson(input) ??
    detectUrl(input) ??
    detectTimestamp(input) ??
    detectCron(input) ??
    detectBase64(input) ??
    UNKNOWN_RESULT
  )
}
