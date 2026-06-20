import type { ParsedJwt } from './types'

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function decodeBase64UrlJson(segment: string): Record<string, unknown> | null {
  if (!/^[A-Za-z0-9_-]+$/.test(segment)) {
    return null
  }

  try {
    const base64 = segment.replace(/-/g, '+').replace(/_/g, '/')
    const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=')
    const binary = atob(padded)
    const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0))
    const decoded = new TextDecoder('utf-8', { fatal: true }).decode(bytes)
    const parsed = JSON.parse(decoded)

    return isRecord(parsed) ? parsed : null
  } catch {
    return null
  }
}

export function parseJwt(value: string): ParsedJwt | null {
  const segments = value.trim().split('.')
  if (segments.length !== 3) {
    return null
  }

  const [headerSegment, payloadSegment, signature] = segments
  const header = decodeBase64UrlJson(headerSegment)
  const payload = decodeBase64UrlJson(payloadSegment)

  if (!header || !payload || !signature) {
    return null
  }

  return {
    header,
    payload,
    signature,
  }
}
