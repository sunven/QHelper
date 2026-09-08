import { afterEach, describe, expect, it, vi } from 'vitest'
import { transformSvg } from './svgoptimizer'

describe('svgoptimizer/transformSvg', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('optimizes SVG without warning about removeViewBox and keeps viewBox and ids', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined)

    const result = transformSvg(
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"><rect id="keep-me" width="10" height="10"/></svg>',
      { mode: 'optimize' },
    )
    const warnings = warn.mock.calls.flat().join('\n')

    expect(result).toContain('viewBox="0 0 10 10"')
    expect(result).toContain('id="keep-me"')
    expect(warnings).not.toContain('removeViewBox')
  })

  it('minimizes simple SVG markup', () => {
    const result = transformSvg(
      '<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10">\n  <circle cx="5" cy="5" r="5"/>\n</svg>',
      { mode: 'optimize' },
    )
    expect(result).not.toContain('\n')
  })

  it('returns an Error for non-SVG text input', () => {
    const result = transformSvg('not svg at all', { mode: 'optimize' })
    expect(result).toBeInstanceOf(Error)
  })
})
