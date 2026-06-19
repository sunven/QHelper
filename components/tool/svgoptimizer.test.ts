import { afterEach, describe, expect, it, vi } from 'vitest'
import { optimizeSvgContent } from './svgoptimizer'

describe('svgoptimizer/optimizeSvgContent', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('optimizes SVG without warning about removeViewBox and keeps viewBox and ids', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined)

    const result = optimizeSvgContent(
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"><rect id="keep-me" width="10" height="10"/></svg>',
    )
    const warnings = warn.mock.calls.flat().join('\n')

    expect(result.output).toContain('viewBox="0 0 10 10"')
    expect(result.output).toContain('id="keep-me"')
    expect(warnings).not.toContain('removeViewBox')
  })
})
