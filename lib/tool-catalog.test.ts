import { describe, expect, it } from 'vitest'
import { ToolCategory } from '@/lib/registry/ToolMetadata'
import { tools } from '@/lib/registry/tools'
import {
  DEFAULT_TOOL_ID,
  ORDINARY_TOOL_IDS,
  ORDINARY_TOOL_CATALOG_TOOLS,
  TOOL_CATEGORIES,
  TOOL_CATEGORY_LABELS,
  createOrdinaryToolRoutes,
  getToolCatalogCategoryForTool,
  getToolCatalogTool,
  getToolNavigationPath,
  getToolsSpaPath,
  isOrdinaryToolId,
} from './tool-catalog'

describe('tool-catalog', () => {
  it('derives ordinary tool ids from registered tools', () => {
    expect(new Set(ORDINARY_TOOL_IDS)).toEqual(
      new Set(tools.map((tool) => tool.id)),
    )
    expect(isOrdinaryToolId(DEFAULT_TOOL_ID)).toBe(true)
    expect(isOrdinaryToolId('settings')).toBe(false)
  })

  it('exposes catalog lookup for UI callers without using the registry directly', () => {
    expect(getToolCatalogTool('json')).toMatchObject({
      key: 'json',
      name: 'JSON 格式化',
      path: '/tools/json.html',
      category: ToolCategory.COMMON,
      icon: 'Code',
    })
    expect(getToolCatalogTool('settings')).toBeUndefined()
    expect(getToolCatalogCategoryForTool('json')).toMatchObject({
      key: ToolCategory.COMMON,
      name: TOOL_CATEGORY_LABELS[ToolCategory.COMMON],
    })
    expect(ORDINARY_TOOL_CATALOG_TOOLS.map((tool) => tool.key)).toEqual(
      ORDINARY_TOOL_IDS,
    )
  })

  it('derives navigation categories from registered tool metadata', () => {
    expect(TOOL_CATEGORIES).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          key: ToolCategory.COMMON,
          name: TOOL_CATEGORY_LABELS[ToolCategory.COMMON],
          tools: expect.arrayContaining([
            expect.objectContaining({
              key: 'json',
              name: 'JSON 格式化',
              path: '/tools/json.html',
            }),
          ]),
        }),
      ]),
    )
  })

  it('derives paths from tool ids', () => {
    expect(getToolsSpaPath('jsonschema')).toBe('tools/jsonschema.html')
    expect(getToolNavigationPath('jsonschema')).toBe('/tools/jsonschema.html')
    expect(tools.find((tool) => tool.id === 'jsonschema')?.entry).toBe(
      'tools/jsonschema.html',
    )
  })

  it('creates route lists in catalog order and fails when a tool is missing', () => {
    const componentByToolId = Object.fromEntries(
      ORDINARY_TOOL_IDS.map((id) => [id, () => id]),
    )

    expect(createOrdinaryToolRoutes(componentByToolId).map((route) => route.id)).toEqual(
      ORDINARY_TOOL_IDS,
    )

    expect(() => createOrdinaryToolRoutes({})).toThrow(
      'Missing tool component for "json"',
    )
  })
})
