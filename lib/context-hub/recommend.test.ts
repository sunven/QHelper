import { describe, expect, it } from 'vitest'
import { isOrdinaryToolId } from '@/lib/tool-catalog'
import type { ContextDetectionResult } from './types'
import { getContextRecommendations } from './recommend'

function result(kind: ContextDetectionResult['kind']): ContextDetectionResult {
  return {
    kind,
    confidence: kind === 'unknown' ? 'low' : 'high',
    summary: `${kind} summary`,
    facts: [],
  }
}

describe('getContextRecommendations', () => {
  it.each([
    ['json', 'json'],
    ['url', 'urlparser'],
    ['base64', 'convert'],
    ['timestamp', 'timestamp'],
    ['cron', 'cron'],
  ] as const)('routes %s input to the %s tool', (kind, toolId) => {
    expect(getContextRecommendations(result(kind))).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          toolId,
          confidence: 'high',
        }),
      ]),
    )
  })

  it('keeps JWT useful without requiring a dedicated JWT tool', () => {
    const recommendations = getContextRecommendations(result('jwt'))

    expect(recommendations).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'jwt-preview',
          label: '查看 JWT 预览',
          confidence: 'high',
        }),
        expect.objectContaining({
          toolId: 'json',
        }),
        expect.objectContaining({
          toolId: 'convert',
        }),
      ]),
    )
  })

  it('returns a neutral fallback for unknown input', () => {
    expect(getContextRecommendations(result('unknown'))).toEqual([
      expect.objectContaining({
        id: 'manual-browse',
        confidence: 'low',
      }),
    ])
  })

  it('only references ordinary QHelper tools when a tool id is present', () => {
    const kinds: ContextDetectionResult['kind'][] = [
      'json',
      'url',
      'base64',
      'timestamp',
      'jwt',
      'cron',
      'unknown',
    ]

    const toolIds = kinds.flatMap((kind) =>
      getContextRecommendations(result(kind))
        .map((recommendation) => recommendation.toolId)
        .filter((toolId): toolId is string => typeof toolId === 'string'),
    )

    expect(toolIds.length).toBeGreaterThan(0)
    expect(toolIds.every((toolId) => isOrdinaryToolId(toolId))).toBe(true)
  })
})
