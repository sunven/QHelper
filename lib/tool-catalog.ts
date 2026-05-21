import type { ToolMetadata } from './registry/ToolMetadata'
import { ToolCategory } from './registry/ToolMetadata'
import { tools as registeredTools } from './registry/tools'

export const TOOLS_SPA_ENTRY = 'tools.html'
export const TOOLS_ROUTE_BASE = 'tools'
export const DEFAULT_TOOL_ID = 'json'
export const TOOL_SETTINGS_ID = 'settings'

export type ToolCatalogTool = {
  key: string
  name: string
  path: string
  category: ToolCategory
  icon: string
  description?: string
}

export type ToolCatalogCategory = {
  key: ToolCategory
  name: string
  tools: ToolCatalogTool[]
}

export type ToolRoute<Component> = {
  id: string
  Component: Component
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

export function isOrdinaryToolId(
  toolId: string | null | undefined,
): toolId is string {
  return typeof toolId === 'string' && ordinaryToolIdSet.has(toolId)
}

export function getToolsSpaPath(toolId: string): string {
  return getToolEntryPath(toolId)
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

    return { id, Component }
  })
}
