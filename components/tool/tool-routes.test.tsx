import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { toolRoutes } from '@/components/tool/tool-routes'
import { getToolCatalogTool, ORDINARY_TOOL_IDS } from '@/lib/tool-catalog'

describe('toolRoutes', () => {
  it('maps every ordinary tool id to a component', () => {
    expect(toolRoutes.map((route) => route.id)).toEqual(ORDINARY_TOOL_IDS)

    for (const route of toolRoutes) {
      expect(route.Component).toBeTypeOf('function')
    }
  })

  // 仅渲染轻量工具：其余工具挂载时会依赖额外的 Chrome API
  it.each(['uuid', 'password'])(
    'applies the Tool Page Shell skeleton to %s',
    (toolId) => {
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
    },
  )
})
