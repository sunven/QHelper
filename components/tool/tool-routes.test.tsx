import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { toolRoutes } from '@/components/tool/tool-routes'
import { ORDINARY_TOOL_IDS, getToolCatalogTool } from '@/lib/tool-catalog'

describe('toolRoutes', () => {
  it('maps every ordinary tool id to a component', () => {
    expect(toolRoutes.map((route) => route.id)).toEqual(ORDINARY_TOOL_IDS)

    for (const route of toolRoutes) {
      expect(route.Component).toBeTypeOf('function')
    }
  })

  // trans-radix: 普通工具；uuid: 无布局变体的简单工具
  it.each([
    'trans-radix',
    'uuid',
  ])('applies the Tool Page Shell skeleton to %s', (toolId) => {
    const route = toolRoutes.find((candidate) => candidate.id === toolId)
    if (!route) {
      throw new Error(`Missing route for "${toolId}"`)
    }

    render(<route.Component />)

    const article = document.querySelector(`[data-tool-id="${toolId}"]`)
    expect(article).not.toBeNull()
    expect(article?.getAttribute('aria-labelledby')).toBe(
      `tool-page-title-${toolId}`,
    )

    const heading = document.getElementById(`tool-page-title-${toolId}`)
    expect(heading).toHaveTextContent(getToolCatalogTool(toolId)?.name ?? '')
  })
})
