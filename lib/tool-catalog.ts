import type { ToolMetadata } from './registry/ToolMetadata'
import { ToolCategory } from './registry/ToolMetadata'
import { tools as registeredTools } from './registry/tools'

export const TOOLS_SPA_ENTRY = 'tools.html'
export const TOOLS_ROUTE_BASE = 'tools'
export const DEFAULT_TOOL_ID = 'json'
export const TOOL_SETTINGS_ID = 'settings'
export const TOOL_BOOKMARKS_ID = 'bookmarks'
export const WEB_SUMMARY_LAUNCH_ID = 'web-summary-launch'
export const CLEAR_COOKIE_LAUNCH_ID = 'clear-cookie'

export type LaunchSurface =
  | 'popup-main'
  | 'popup-header'
  | 'tool-sidebar'
  | 'build-alias'

export type LaunchIntent =
  | {
      kind: 'ordinary-tool-page'
      toolId: string
      extensionPath: string
      preserveActivity: boolean
    }
  | {
      kind: 'system-page'
      page: typeof TOOL_SETTINGS_ID
      extensionPath: string
    }
  | {
      kind: 'extension-page'
      page: typeof TOOL_BOOKMARKS_ID
      extensionPath: string
    }
  | {
      kind: 'side-panel-action'
      action: 'open-web-summary'
    }
  | {
      kind: 'browser-command'
      command: 'clear-cookies'
    }

export type LaunchRisk = {
  level: 'destructive'
  confirmMessage: string
}

export type ToolCatalogLaunchEntry = {
  id: string
  name: string
  description?: string
  category?: ToolCategory
  icon: string
  surfaces: readonly LaunchSurface[]
  intent: LaunchIntent
  risk?: LaunchRisk
}

export type LaunchEntryGroup = {
  category: ToolCategory
  name: string
  entries: ToolCatalogLaunchEntry[]
}

export type LaunchDirectory = {
  surface: LaunchSurface
  groups: LaunchEntryGroup[]
  entries: ToolCatalogLaunchEntry[]
}

export type ToolPageAlias = {
  id: string
  path: string
}

export type ToolCatalogTool = {
  key: string
  name: string
  path: string
  category: ToolCategory
  icon: string
  description?: string
  preserveActivity: boolean
}

export type ToolCatalogCategory = {
  key: ToolCategory
  name: string
  tools: ToolCatalogTool[]
}

export type ToolRoute<Component> = {
  id: string
  Component: Component
  preserveActivity: boolean
}

export const TOOL_CATEGORY_LABELS: Record<ToolCategory, string> = {
  [ToolCategory.COMMON]: '常用',
  [ToolCategory.ENCODING]: '编码转换',
  [ToolCategory.IMAGE]: '图片工具',
  [ToolCategory.SECURITY]: '安全与加密',
  [ToolCategory.WEB_FORMAT]: 'Web 格式',
  [ToolCategory.DATA_FORMAT]: '数据格式',
  [ToolCategory.AI]: 'AI 工具',
  [ToolCategory.OTHER]: '其他',
}

export const TOOL_CATEGORY_ORDER: ToolCategory[] = [
  ToolCategory.COMMON,
  ToolCategory.ENCODING,
  ToolCategory.IMAGE,
  ToolCategory.SECURITY,
  ToolCategory.WEB_FORMAT,
  ToolCategory.DATA_FORMAT,
  ToolCategory.AI,
  ToolCategory.OTHER,
]

function getToolEntryPath(toolId: string): string {
  return `${TOOLS_ROUTE_BASE}/${encodeURIComponent(toolId)}.html`
}

export function getToolNavigationPath(toolId: string): string {
  return `/${getToolEntryPath(toolId)}`
}

function toCatalogTool(tool: ToolMetadata): ToolCatalogTool {
  return {
    key: tool.id,
    name: tool.name,
    path: getToolNavigationPath(tool.id),
    category: tool.category,
    icon: tool.icon,
    description: tool.description,
    preserveActivity: tool.preserveActivity ?? true,
  }
}

export const TOOL_CATEGORIES: ToolCatalogCategory[] = TOOL_CATEGORY_ORDER.map(
  (category) => ({
    key: category,
    name: TOOL_CATEGORY_LABELS[category],
    tools: registeredTools
      .filter((tool) => tool.category === category)
      .map(toCatalogTool),
  }),
).filter((category) => category.tools.length > 0)

function toOrdinaryToolLaunchEntry(tool: ToolCatalogTool): ToolCatalogLaunchEntry {
  return {
    id: tool.key,
    name: tool.name,
    description: tool.description,
    category: tool.category,
    icon: tool.icon,
    surfaces: ['popup-main', 'tool-sidebar', 'build-alias'],
    intent: {
      kind: 'ordinary-tool-page',
      toolId: tool.key,
      extensionPath: getToolEntryPath(tool.key),
      preserveActivity: tool.preserveActivity,
    },
  }
}

const ORDINARY_TOOL_LAUNCH_ENTRIES = TOOL_CATEGORIES.flatMap(
  (category) => category.tools,
).map(
  toOrdinaryToolLaunchEntry,
)

const SYSTEM_LAUNCH_ENTRIES: ToolCatalogLaunchEntry[] = [
  {
    id: TOOL_SETTINGS_ID,
    name: '设置',
    description: '管理 QHelper 工具偏好。',
    icon: 'GearSix',
    surfaces: ['popup-header', 'build-alias'],
    intent: {
      kind: 'system-page',
      page: TOOL_SETTINGS_ID,
      extensionPath: getToolEntryPath(TOOL_SETTINGS_ID),
    },
  },
  {
    id: WEB_SUMMARY_LAUNCH_ID,
    name: '网页总结',
    description: '打开侧边栏总结当前网页内容。',
    category: ToolCategory.AI,
    icon: 'Sparkle',
    surfaces: ['popup-main'],
    intent: {
      kind: 'side-panel-action',
      action: 'open-web-summary',
    },
  },
  {
    id: TOOL_BOOKMARKS_ID,
    name: '书签',
    description: '查看浏览器书签树。',
    category: ToolCategory.OTHER,
    icon: 'BookmarkSimple',
    surfaces: ['popup-main'],
    intent: {
      kind: 'extension-page',
      page: TOOL_BOOKMARKS_ID,
      extensionPath: 'bookmarks.html',
    },
  },
  {
    id: CLEAR_COOKIE_LAUNCH_ID,
    name: '清除 Cookie',
    description: '一键清理浏览器 Cookie，适合排查登录失效、缓存脏数据和会话问题。',
    category: ToolCategory.OTHER,
    icon: 'Trash',
    surfaces: ['popup-main'],
    intent: {
      kind: 'browser-command',
      command: 'clear-cookies',
    },
    risk: {
      level: 'destructive',
      confirmMessage: '这会清除浏览器 Cookie，可能让当前登录会话失效。',
    },
  },
]

const LAUNCH_ENTRIES: ToolCatalogLaunchEntry[] = [
  ...ORDINARY_TOOL_LAUNCH_ENTRIES,
  ...SYSTEM_LAUNCH_ENTRIES,
]

export const ORDINARY_TOOL_IDS = TOOL_CATEGORIES.flatMap((category) =>
  category.tools.map((tool) => tool.key),
)

export const ORDINARY_TOOL_CATALOG_TOOLS = TOOL_CATEGORIES.flatMap(
  (category) => category.tools,
)

const ordinaryToolIdSet = new Set(ORDINARY_TOOL_IDS)
const catalogToolById = new Map(
  ORDINARY_TOOL_CATALOG_TOOLS.map((tool) => [tool.key, tool]),
)
const launchEntryById = new Map(
  LAUNCH_ENTRIES.map((entry) => [entry.id, entry]),
)

export function isOrdinaryToolId(
  toolId: string | null | undefined,
): toolId is string {
  return typeof toolId === 'string' && ordinaryToolIdSet.has(toolId)
}

export function getToolsSpaPath(toolId: string): string {
  return getToolEntryPath(toolId)
}

export function getLaunchEntry(
  id: string | null | undefined,
  options: { visibleOn?: LaunchSurface } = {},
): ToolCatalogLaunchEntry | undefined {
  if (typeof id !== 'string') {
    return undefined
  }

  const entry = launchEntryById.get(id)
  if (!entry) {
    return undefined
  }

  if (options.visibleOn && !entry.surfaces.includes(options.visibleOn)) {
    return undefined
  }

  return entry
}

export function getLaunchDirectory(surface: LaunchSurface): LaunchDirectory {
  const visibleEntries = LAUNCH_ENTRIES.filter((entry) =>
    entry.surfaces.includes(surface),
  )
  const groups = TOOL_CATEGORY_ORDER.map((category) => ({
    category,
    name: TOOL_CATEGORY_LABELS[category],
    entries: visibleEntries.filter((entry) => entry.category === category),
  })).filter((group) => group.entries.length > 0)
  const groupedEntries = new Set(groups.flatMap((group) => group.entries))
  const ungroupedEntries = visibleEntries.filter(
    (entry) => !groupedEntries.has(entry),
  )

  return {
    surface,
    groups,
    entries: [...groups.flatMap((group) => group.entries), ...ungroupedEntries],
  }
}

export function getToolsSpaAliases(): ToolPageAlias[] {
  return LAUNCH_ENTRIES.filter((entry) =>
    entry.surfaces.includes('build-alias'),
  ).map((entry) => {
    if (
      entry.intent.kind !== 'ordinary-tool-page' &&
      entry.intent.kind !== 'system-page'
    ) {
      throw new Error(`Launch entry "${entry.id}" is not a tools SPA alias`)
    }

    return {
      id: entry.id,
      path: entry.intent.extensionPath,
    }
  })
}

export function getToolCatalogTool(
  toolId: string | null | undefined,
): ToolCatalogTool | undefined {
  return typeof toolId === 'string' ? catalogToolById.get(toolId) : undefined
}

export function getToolCatalogCategoryForTool(
  toolId: string | null | undefined,
): ToolCatalogCategory | undefined {
  if (!toolId) {
    return undefined
  }

  return TOOL_CATEGORIES.find((category) =>
    category.tools.some((tool) => tool.key === toolId),
  )
}

export function createOrdinaryToolRoutes<Component>(
  componentByToolId: Record<string, Component>,
): ToolRoute<Component>[] {
  return ORDINARY_TOOL_IDS.map((id) => {
    const Component = componentByToolId[id]
    if (!Component) {
      throw new Error(`Missing tool component for "${id}"`)
    }

    return {
      id,
      Component,
      preserveActivity: getToolCatalogTool(id)?.preserveActivity ?? true,
    }
  })
}
