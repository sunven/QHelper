import { describe, expect, it, vi } from 'vitest'
import { ToolCategory } from '@/lib/registry/ToolMetadata'
import { tools } from '@/lib/registry/tools'
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

function expectToolAbsent(id: string) {
  const directory = getLaunchDirectory('popup-main')
  const aliases = getToolsSpaAliases().map((alias) => alias.id)

  expect(isOrdinaryToolId(id)).toBe(false)
  expect(getToolCatalogTool(id)).toBeUndefined()
  expect(getLaunchEntry(id)).toBeUndefined()
  expect(parseToolRouteParam(`${id}.html`)).toBeNull()
  expect(getToolIdFromPathname(`/tools/${id}.html`)).toBeNull()
  expect(directory.entries.map((entry) => entry.id)).not.toContain(id)
  expect(aliases).not.toContain(id)
}

describe('tool-catalog', () => {
  it('excludes text preview from tools, launches and generated aliases', () => {
    expectToolAbsent('text-preview')
  })

  it('excludes the formatter and its legacy aliases from tools, launches and generated aliases', () => {
    for (const id of ['formatter', 'htmlformat', 'xmlformatter', 'csstool']) {
      expectToolAbsent(id)
    }
  })

  it('excludes Web 格式 tools and category from the catalog', () => {
    for (const id of ['markdown', 'urlparser', 'filemerge', 'svgoptimizer']) {
      expectToolAbsent(id)
    }
    expect(
      TOOL_CATEGORIES.map((category) => String(category.key)),
    ).not.toContain('web_format')
  })

  it('excludes removed JSON and text diff tools from tools, launches and generated aliases', () => {
    for (const id of ['json', 'text-diff']) {
      expectToolAbsent(id)
    }
  })

  it('excludes the removed OCR tool from tools, launches and generated aliases', () => {
    expectToolAbsent('ocr')
  })

  it('derives ordinary tool ids from registered tools', () => {
    expect(new Set(ORDINARY_TOOL_IDS)).toEqual(
      new Set(tools.map((tool) => tool.id)),
    )
    expect(isOrdinaryToolId(DEFAULT_TOOL_ID)).toBe(true)
    expect(isOrdinaryToolId('settings')).toBe(false)
  })

  it('excludes 数据格式 tools and category from tools, launches and generated aliases', () => {
    for (const id of ['cron', 'csv2json', 'yaml', 'toml', 'jsonschema']) {
      expectToolAbsent(id)
    }
    expect(ORDINARY_TOOL_IDS).toHaveLength(10)
    expect(
      TOOL_CATEGORIES.map((category) => String(category.key)),
    ).not.toContain('encoding')
    expect(Object.values(ToolCategory)).not.toContain('data_format')
    expect(TOOL_CATEGORIES.map((category) => category.name)).not.toContain(
      '数据格式',
    )
    expect(
      getLaunchDirectory('popup-main').groups.map((group) => group.name),
    ).not.toContain('数据格式')
  })

  it('exposes catalog lookup for UI callers without using the registry directly', () => {
    expect(getToolCatalogTool('uuid')).toMatchObject({
      key: 'uuid',
      name: 'UUID 生成器',
      path: '/tools/uuid.html',
      category: ToolCategory.SECURITY,
      icon: 'Hash',
    })
    expect(getToolCatalogTool('settings')).toBeUndefined()
    expect(getToolCatalogCategoryForTool('uuid')).toMatchObject({
      key: ToolCategory.SECURITY,
      name: TOOL_CATEGORY_LABELS[ToolCategory.SECURITY],
    })
    expect(getToolCatalogTool('trans-radix')).toMatchObject({
      key: 'trans-radix',
      name: '进制转换',
      path: '/tools/trans-radix.html',
      category: ToolCategory.COMMON,
      icon: 'Calculator',
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
              key: 'trans-radix',
              name: '进制转换',
              path: '/tools/trans-radix.html',
            }),
          ]),
        }),
      ]),
    )
  })

  it('derives paths from tool ids', () => {
    expect(getToolsSpaPath('imagebase64')).toBe('tools/imagebase64.html')
    expect(getToolNavigationPath('imagebase64')).toBe('/tools/imagebase64.html')
  })

  it('builds the popup main Launch Entry directory from the Tool Catalog', () => {
    const directory = getLaunchDirectory('popup-main')

    expect(directory.surface).toBe('popup-main')
    expect(directory.entries.map((entry) => entry.id)).toEqual(
      expect.arrayContaining([
        'trans-radix',
        'web-summary-launch',
        'bookmarks',
        'clear-site-data',
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

  it('launches the clear-site-data tool as an ordinary tool page', () => {
    expect(getLaunchEntry('clear-site-data')).toMatchObject({
      id: 'clear-site-data',
      name: '清除站点数据',
      surfaces: ['popup-main', 'build-alias'],
      intent: {
        kind: 'ordinary-tool-page',
        toolId: 'clear-site-data',
        extensionPath: 'tools/clear-site-data.html',
      },
    })
    expect(getLaunchEntry('clear-cookie')).toBeUndefined()
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

    expect(
      createOrdinaryToolRoutes(componentByToolId).map((route) => route.id),
    ).toEqual(ORDINARY_TOOL_IDS)

    expect(() => createOrdinaryToolRoutes({})).toThrow(
      'Missing tool component for "trans-radix"',
    )
  })
})

describe('tool catalog routing helpers', () => {
  it('builds path-based routes for ordinary tools', () => {
    expect(DEFAULT_TOOL_ID).toBe('trans-radix')
    expect(getToolsSpaPath('trans-radix')).toBe('tools/trans-radix.html')
    expect(getToolsSpaPath('uuid')).toBe('tools/uuid.html')
    expect(getToolRoutePath('imagebase64')).toBe('/imagebase64.html')
    expect(getToolRoutePath('settings')).toBe('/settings.html')
  })

  it('parses route params by stripping the html extension', () => {
    expect(parseToolRouteParam('uuid.html')).toBe('uuid')
    expect(parseToolRouteParam('trans-radix.html')).toBe('trans-radix')
    expect(parseToolRouteParam('uuid')).toBe('uuid')
    expect(parseToolRouteParam('json.html')).toBeNull()
    expect(parseToolRouteParam('json-string-panel.html')).toBeNull()
    expect(parseToolRouteParam('settings')).toBeNull()
    expect(parseToolRouteParam(undefined)).toBeNull()
  })

  it('detects the current tool from an SPA pathname', () => {
    expect(getToolIdFromPathname('/tools/uuid.html')).toBe('uuid')
    expect(getToolIdFromPathname('/tools/trans-radix.html')).toBe('trans-radix')
    expect(getToolIdFromPathname('/tools/json.html')).toBeNull()
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

    expect(getToolsSpaUrl('uuid')).toBe(
      'chrome-extension://test/tools/uuid.html',
    )

    vi.unstubAllGlobals()
  })

  it('detects the shared SPA entry', () => {
    expect(isToolsSpaLocation({ pathname: '/tools/uuid.html' })).toBe(true)
    expect(isToolsSpaLocation({ pathname: '/json.html' })).toBe(false)
  })
})
