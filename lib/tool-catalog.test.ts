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
  getLaunchDirectory,
  getLaunchEntry,
  getToolCatalogCategoryForTool,
  getToolCatalogTool,
  getToolNavigationPath,
  getToolsSpaAliases,
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
            expect.objectContaining({
              key: 'context-hub',
              name: 'Context Hub',
              path: '/tools/context-hub.html',
            }),
          ]),
        }),
      ]),
    )
  })

  it('derives paths from tool ids', () => {
    expect(getToolsSpaPath('jsonschema')).toBe('tools/jsonschema.html')
    expect(getToolNavigationPath('jsonschema')).toBe('/tools/jsonschema.html')
  })

  it('builds the popup main Launch Entry directory from the Tool Catalog', () => {
    const directory = getLaunchDirectory('popup-main')

    expect(directory.surface).toBe('popup-main')
    expect(directory.entries.map((entry) => entry.id)).toEqual(
      expect.arrayContaining([
        'json',
        'context-hub',
        'web-summary-launch',
        'bookmarks',
        'clear-cookie',
      ]),
    )
    expect(directory.groups.find((group) => group.category === ToolCategory.AI))
      .toMatchObject({
        name: TOOL_CATEGORY_LABELS[ToolCategory.AI],
        entries: expect.arrayContaining([
          expect.objectContaining({
            id: 'web-summary-launch',
            intent: { kind: 'side-panel-action', action: 'open-web-summary' },
          }),
        ]),
      })
    expect(getLaunchEntry('bookmarks')).toMatchObject({
      intent: {
        kind: 'extension-page',
        page: 'bookmarks',
        extensionPath: 'bookmarks.html',
      },
    })
  })

  it('keeps settings as a system Launch Entry outside ordinary tools', () => {
    const directory = getLaunchDirectory('popup-header')

    expect(directory.entries).toEqual([
      expect.objectContaining({
        id: 'settings',
        intent: {
          kind: 'system-page',
          page: 'settings',
          extensionPath: 'tools/settings.html',
        },
      }),
    ])
    expect(isOrdinaryToolId('settings')).toBe(false)
    expect(getToolCatalogTool('settings')).toBeUndefined()
  })

  it('marks destructive browser commands in the Launch Entry', () => {
    expect(getLaunchEntry('clear-cookie')).toMatchObject({
      id: 'clear-cookie',
      intent: { kind: 'browser-command', command: 'clear-cookies' },
      risk: {
        level: 'destructive',
        confirmMessage: '这会清除浏览器 Cookie，可能让当前登录会话失效。',
      },
    })
  })

  it('derives tools SPA aliases from Launch Entries', () => {
    expect(getToolsSpaAliases()).toEqual([
      ...ORDINARY_TOOL_IDS.map((id) => ({ id, path: `tools/${id}.html` })),
      { id: 'settings', path: 'tools/settings.html' },
    ])
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
