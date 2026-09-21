import { describe, expect, it, vi } from 'vitest'
import { ToolCategory } from '@/lib/registry/ToolMetadata'
import { tools } from '@/lib/registry/tools'
import { SYNTAX_FORMATTER_ALIASES } from '@/lib/syntax-formatter'
import {
  createOrdinaryToolRoutes,
  DEFAULT_TOOL_ID,
  getCurrentToolIdFromLocation,
  getLaunchDirectory,
  getLaunchEntry,
  getToolCatalogCategoryForTool,
  getToolCatalogTool,
  getToolIdFromPathname,
  getToolNavigationPath,
  getToolRoutePath,
  getToolsSpaAliases,
  getToolsSpaPath,
  getToolsSpaUrl,
  isOrdinaryToolId,
  isToolsSpaLocation,
  ORDINARY_TOOL_CATALOG_TOOLS,
  ORDINARY_TOOL_IDS,
  parseToolRouteParam,
  TOOL_CATEGORIES,
  TOOL_CATEGORY_LABELS,
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
    expect(getToolCatalogTool('text-diff')).toMatchObject({
      key: 'text-diff',
      name: '文本 Diff',
      path: '/tools/text-diff.html',
      category: ToolCategory.COMMON,
      icon: 'ArrowsLeftRight',
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
    expect(
      directory.groups.find((group) => group.category === ToolCategory.AI),
    ).toMatchObject({
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
      ...SYNTAX_FORMATTER_ALIASES.map((alias) => ({
        id: alias.id,
        path: `tools/${alias.id}.html`,
      })),
      { id: 'settings', path: 'tools/settings.html' },
    ])
  })

  it('keeps former HTML/XML/CSS tools as build aliases of the Syntax Formatter', () => {
    expect(getToolCatalogTool('formatter')).toMatchObject({
      key: 'formatter',
      name: '格式化',
      category: ToolCategory.WEB_FORMAT,
      icon: 'Code',
    })
    expect(getToolCatalogTool('htmlformat')).toBeUndefined()
    const popupIds = getLaunchDirectory('popup-main').entries.map(
      (entry) => entry.id,
    )
    expect(popupIds).toContain('formatter')
    expect(popupIds).not.toContain('htmlformat')
    expect(popupIds).not.toContain('xmlformatter')
    expect(popupIds).not.toContain('csstool')

    expect(getLaunchEntry('htmlformat')).toMatchObject({
      surfaces: ['build-alias'],
      intent: {
        kind: 'ordinary-tool-page',
        toolId: 'formatter',
        extensionPath: 'tools/htmlformat.html',
      },
    })
  })

  it('creates route lists in catalog order and fails when a tool is missing', () => {
    const componentByToolId = Object.fromEntries(
      ORDINARY_TOOL_IDS.map((id) => [id, () => id]),
    )

    expect(
      createOrdinaryToolRoutes(componentByToolId).map((route) => route.id),
    ).toEqual(ORDINARY_TOOL_IDS)

    expect(() => createOrdinaryToolRoutes({})).toThrow(
      'Missing tool component for "json"',
    )
  })
})

describe('tool catalog routing helpers', () => {
  it('builds path-based routes for ordinary tools', () => {
    expect(DEFAULT_TOOL_ID).toBe('json')
    expect(getToolsSpaPath('json')).toBe('tools/json.html')
    expect(getToolsSpaPath('trans-radix')).toBe('tools/trans-radix.html')
    expect(getToolRoutePath('jsonschema')).toBe('/jsonschema.html')
    expect(getToolRoutePath('settings')).toBe('/settings.html')
  })

  it('parses route params by stripping the html extension', () => {
    expect(parseToolRouteParam('json.html')).toBe('json')
    expect(parseToolRouteParam('trans-radix.html')).toBe('trans-radix')
    expect(parseToolRouteParam('json')).toBe('json')
    expect(parseToolRouteParam('json-string-panel.html')).toBeNull()
    expect(parseToolRouteParam('settings')).toBeNull()
    expect(parseToolRouteParam(undefined)).toBeNull()
  })

  it('detects the current tool from an SPA pathname', () => {
    expect(getToolIdFromPathname('/tools/json.html')).toBe('json')
    expect(getToolIdFromPathname('/tools/trans-radix.html')).toBe('trans-radix')
    expect(getToolIdFromPathname('/tools/json-string-panel.html')).toBeNull()
    expect(
      getCurrentToolIdFromLocation({ pathname: '/tools/downloads.html' }),
    ).toBe('downloads')
    expect(getCurrentToolIdFromLocation({ pathname: '/tools' })).toBeNull()
    expect(
      getCurrentToolIdFromLocation({ pathname: '/downloads.html' }),
    ).toBeNull()
  })

  it('uses chrome.runtime.getURL when available', () => {
    vi.stubGlobal('chrome', {
      runtime: {
        getURL: vi.fn((path: string) => `chrome-extension://test/${path}`),
      },
    })

    expect(getToolsSpaUrl('json')).toBe(
      'chrome-extension://test/tools/json.html',
    )

    vi.unstubAllGlobals()
  })

  it('detects the shared SPA entry', () => {
    expect(isToolsSpaLocation({ pathname: '/tools/json.html' })).toBe(true)
    expect(isToolsSpaLocation({ pathname: '/json.html' })).toBe(false)
  })
})
