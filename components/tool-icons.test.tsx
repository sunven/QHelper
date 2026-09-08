import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { getToolIcon, type ToolIconToken } from './tool-icons'
import { tools } from '@/lib/registry/tools'
import { getLaunchDirectory } from '@/lib/tool-catalog'

describe('tool-icons', () => {
  it('renders every declared icon token without a runtime fallback', () => {
    const tokens = new Set<string>([
      ...tools.map((tool) => tool.icon),
      ...getLaunchDirectory('popup-main').entries.map((entry) => entry.icon),
    ])

    expect(tokens.size).toBeGreaterThan(0)
    for (const token of tokens) {
      const { container } = render(getToolIcon(token as ToolIconToken))
      expect(container.firstChild).not.toBeNull()
    }
  })
})
