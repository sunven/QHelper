import { useEffect, useMemo, useState } from 'react'
import ReactDOM from 'react-dom/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { TOOL_CATEGORIES } from '@/constants/tools'
import { removeAll } from '@/lib/chrome/cookies'
import { create } from '@/lib/chrome/tabs'
import type { OpenWebSummaryResponse } from '@/types/web-summary'
import { toolRegistry } from '@/lib/registry/ToolRegistry'
import { ToolCategory } from '@/lib/registry/ToolMetadata'
import {
  clearRecentTools,
  getRecentTools,
  onRecentToolsChange,
  trackToolUsage,
  type RecentToolEntry,
} from '@/lib/utils/recentTools'
import type { LucideIcon } from 'lucide-react'
import {
  ArrowLeftRight,
  ArrowUpRight,
  Bot,
  Calculator,
  CalendarClock,
  Clock,
  Code,
  Code2,
  FileCode,
  FileJson,
  FileText,
  Hash,
  Image,
  ImagePlus,
  Key,
  LayoutGrid,
  Link2,
  Palette,
  Search,
  Shield,
  Sparkles,
  Trash2,
  Wand2,
  Wrench,
  X,
  Zap,
} from 'lucide-react'
import '../../index.css'

type PopupTool = {
  id: string
  name: string
  description: string
  url: string
  type: 'jump' | 'clearCookie' | 'openWebSummary'
  category: ToolCategory
  searchText: string
}

const ALL_CATEGORY = 'all'

const CATEGORY_ORDER: Array<typeof ALL_CATEGORY | ToolCategory> = [
  ALL_CATEGORY,
  ToolCategory.COMMON,
  ToolCategory.ENCODING,
  ToolCategory.IMAGE,
  ToolCategory.SECURITY,
  ToolCategory.WEB_FORMAT,
  ToolCategory.DATA_FORMAT,
  ToolCategory.AI,
  ToolCategory.OTHER,
]

const toolIconMap: Record<string, LucideIcon> = {
  json: Code,
  'trans-radix': Calculator,
  convert: ArrowLeftRight,
  codebeautify: Wand2,
  uglify: Zap,
  imagebase64: Image,
  pictureSplicing: ImagePlus,
  timestamp: CalendarClock,
  colorTransform: Palette,
  'clear-cookie': Trash2,
  uuid: Hash,
  password: Shield,
  urlparser: Link2,
  csv2json: FileJson,
  yaml: FileCode,
  markdown: FileText,
  htmlformat: Code2,
  csstool: Palette,
  scss: FileJson,
  svgoptimizer: Image,
  cron: Clock,
  toml: FileJson,
  'web-summary-launch': Bot,
  jsonschema: Shield,
  xmlformatter: FileCode,
}

const categoryIconMap: Record<ToolCategory | typeof ALL_CATEGORY, LucideIcon> = {
  all: LayoutGrid,
  [ToolCategory.COMMON]: Sparkles,
  [ToolCategory.ENCODING]: ArrowLeftRight,
  [ToolCategory.IMAGE]: Image,
  [ToolCategory.SECURITY]: Shield,
  [ToolCategory.WEB_FORMAT]: Link2,
  [ToolCategory.DATA_FORMAT]: FileJson,
  [ToolCategory.AI]: Bot,
  [ToolCategory.OTHER]: Wrench,
}

const webSummaryTool: PopupTool = {
  id: 'web-summary-launch',
  name: '网页总结',
  description: '在当前网页旁边打开侧边栏，生成可选联网 AI 摘要。',
  url: '',
  type: 'openWebSummary',
  category: ToolCategory.AI,
  searchText: 'web summary sidepanel ai article reading summarize webpage',
}

const clearCookieTool: PopupTool = {
  id: 'clear-cookie',
  name: '清除 Cookie',
  description: '一键清理浏览器 Cookie，适合排查登录失效、缓存脏数据和会话问题。',
  url: '',
  type: 'clearCookie',
  category: ToolCategory.OTHER,
  searchText: 'clear cookie browser auth session login cache clean',
}

const specialTools: PopupTool[] = [webSummaryTool, clearCookieTool]

async function openWebSummarySidePanel() {
  const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true })
  const response = await chrome.runtime.sendMessage({
    type: 'OPEN_WEB_SUMMARY',
    tabId: activeTab?.id,
  }) as OpenWebSummaryResponse

  if (!response?.ok) {
    throw new Error(response?.error || '无法打开网页总结侧边栏')
  }
}

async function handleToolClick(tool: PopupTool) {
  try {
    if (tool.type === 'jump') {
      await trackToolUsage(tool.id, tool.name)
      await create(tool.url)
      return
    }

    if (tool.type === 'openWebSummary') {
      await openWebSummarySidePanel()
      void trackToolUsage(tool.id, tool.name)
      window.close()
      return
    }

    await removeAll()
    alert('Cookie 已清除')
  } catch (error) {
    const message = error instanceof Error ? error.message : '操作失败'
    alert(message)
  }
}

function getToolIcon(toolId: string) {
  const Icon = toolIconMap[toolId] || Wrench
  return <Icon className="h-4 w-4" />
}

function getCategoryLabel(categoryId: ToolCategory | typeof ALL_CATEGORY) {
  if (categoryId === ALL_CATEGORY) {
    return '全部'
  }

  return TOOL_CATEGORIES[categoryId]
}

function buildToolSearchText(tool: PopupTool) {
  return `${tool.name} ${tool.description} ${getCategoryLabel(tool.category)}`.toLowerCase()
}

function App() {
  const [recentTools, setRecentTools] = useState<RecentToolEntry[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState<typeof ALL_CATEGORY | ToolCategory>(ALL_CATEGORY)

  useEffect(() => {
    const bodyStyle = document.body.style
    const previousBodyMargin = bodyStyle.margin
    const previousBodyWidth = bodyStyle.width
    const previousBodyOverflowX = bodyStyle.overflowX

    bodyStyle.margin = '0'
    bodyStyle.width = '520px'
    bodyStyle.overflowX = 'hidden'

    return () => {
      bodyStyle.margin = previousBodyMargin
      bodyStyle.width = previousBodyWidth
      bodyStyle.overflowX = previousBodyOverflowX
    }
  }, [])

  useEffect(() => {
    let mounted = true

    getRecentTools().then((tools) => {
      if (mounted) {
        setRecentTools(tools)
      }
    })

    const unsubscribe = onRecentToolsChange(setRecentTools)

    return () => {
      mounted = false
      unsubscribe()
    }
  }, [])

  const allTools = useMemo<PopupTool[]>(() => {
    const registryTools = toolRegistry.getAll().map((tool) => ({
      id: tool.id,
      name: tool.name,
      description: tool.description,
      url: tool.entry,
      type: 'jump' as const,
      category: tool.category,
      searchText: `${tool.name} ${tool.nameEn} ${tool.description} ${tool.descriptionEn} ${TOOL_CATEGORIES[tool.category]} ${tool.keywords.join(' ')} ${tool.tags.join(' ')}`.toLowerCase(),
    }))

    return [...registryTools, ...specialTools]
  }, [])

  const toolMap = useMemo(() => new Map(allTools.map((tool) => [tool.id, tool])), [allTools])
  const query = searchQuery.trim().toLowerCase()

  const queryMatchedTools = useMemo(() => {
    if (!query) {
      return allTools
    }

    return allTools.filter((tool) => tool.searchText.includes(query) || buildToolSearchText(tool).includes(query))
  }, [allTools, query])

  const categoryCounts = useMemo(() => {
    const counts = new Map<ToolCategory, number>()

    for (const tool of queryMatchedTools) {
      counts.set(tool.category, (counts.get(tool.category) || 0) + 1)
    }

    return counts
  }, [queryMatchedTools])

  const filteredTools = useMemo(() => {
    if (activeCategory === ALL_CATEGORY) {
      return queryMatchedTools
    }

    return queryMatchedTools.filter((tool) => tool.category === activeCategory)
  }, [activeCategory, queryMatchedTools])

  const groupedTools = useMemo(() => {
    const groups = new Map<ToolCategory, PopupTool[]>()

    for (const tool of filteredTools) {
      const items = groups.get(tool.category) || []
      items.push(tool)
      groups.set(tool.category, items)
    }

    return groups
  }, [filteredTools])

  const recentDisplayTools = useMemo(
    () => recentTools.map((entry) => toolMap.get(entry.toolId)).filter((tool): tool is PopupTool => Boolean(tool)),
    [recentTools, toolMap],
  )

  const recentToolIds = useMemo(() => new Set(recentDisplayTools.map((tool) => tool.id)), [recentDisplayTools])

  const visibleCategories = useMemo(
    () =>
      CATEGORY_ORDER.filter((categoryId) => {
        if (categoryId === ALL_CATEGORY) {
          return queryMatchedTools.length > 0
        }

        return (categoryCounts.get(categoryId) || 0) > 0
      }),
    [categoryCounts, queryMatchedTools.length],
  )

  const renderToolCard = (tool: PopupTool) => (
    <button
      key={tool.id}
      type="button"
      data-testid={`tool-${tool.id}`}
      onClick={() => handleToolClick(tool)}
      className="group flex min-h-[46px] cursor-pointer items-center justify-between gap-1.5 rounded-xl border border-slate-200 bg-white px-2 py-1.5 text-left transition-[border-color,background-color,box-shadow] duration-200 hover:border-emerald-400/60 hover:bg-emerald-50/50 hover:shadow-[0_10px_24px_rgba(16,185,129,0.10)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/60"
    >
      <div className="flex min-w-0 items-center gap-1.5">
        <div className="flex h-6.5 w-6.5 shrink-0 items-center justify-center rounded-md border border-slate-200 bg-slate-100 text-slate-700">
          {getToolIcon(tool.id)}
        </div>
        <div className="line-clamp-1 text-[12px] font-semibold leading-4 text-slate-900">{tool.name}</div>
      </div>

      <div className="flex shrink-0 items-center gap-1">
        {recentToolIds.has(tool.id) && (
          <span className="rounded-full border border-emerald-200 bg-emerald-50 px-1.5 py-0.5 text-[9px] font-medium text-emerald-700">
            最近
          </span>
        )}
        <ArrowUpRight className="h-3.5 w-3.5 text-slate-400 transition-colors duration-200 group-hover:text-emerald-600" />
      </div>
    </button>
  )

  return (
    <div
      className="w-[520px] overflow-hidden bg-[#f6f7f3] text-slate-900"
      style={{ fontFamily: '"IBM Plex Sans", "SF Pro Text", "Segoe UI", sans-serif' }}
    >
      <div className="relative">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.14),transparent_24%),radial-gradient(circle_at_top_right,rgba(59,130,246,0.10),transparent_20%),linear-gradient(180deg,#fcfcf9_0%,#f3f5ef_100%)]" />

        <div className="relative space-y-2 p-2">
          <section className="relative overflow-hidden rounded-[18px] border border-slate-200/90 bg-white/90 p-2.5 shadow-[0_12px_30px_rgba(15,23,42,0.08)] backdrop-blur">
            <div className="absolute -right-6 -top-6 h-16 w-16 rounded-full bg-emerald-200/50 blur-2xl" />

            <div className="relative flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-emerald-100 bg-emerald-50 text-emerald-700">
                  <Wrench className="h-4.5 w-4.5" />
                </div>
                <div>
                  <h1 className="text-base font-semibold tracking-tight text-slate-900">QHelper</h1>
                  <div className="text-[11px] text-slate-500">开发工具面板</div>
                </div>
              </div>

              <div className="flex items-center gap-1 text-[10px]">
                <div className="rounded-md border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-slate-600">
                  {allTools.length} 工具
                </div>
                <div className="rounded-md border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-slate-600">
                  {recentDisplayTools.length} 最近
                </div>
                <div className="rounded-md border border-emerald-200 bg-emerald-50 px-1.5 py-0.5 text-emerald-700">
                  {toolRegistry.getCategories().length + 1} 分类
                </div>
              </div>
            </div>

            <div className="relative mt-2">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="搜索工具、格式、关键词..."
                className="h-9 rounded-lg border-slate-200 bg-slate-50 pl-9 pr-9 text-sm text-slate-900 placeholder:text-slate-400 focus-visible:border-emerald-400/70 focus-visible:ring-emerald-400/20"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 flex h-5 w-5 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full bg-slate-200 text-slate-500 transition-colors duration-200 hover:bg-slate-300 hover:text-slate-700"
                  aria-label="清空搜索"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            <div className="mt-1.5 flex items-center justify-between gap-2 text-[11px] text-slate-500">
              <div>{query ? `匹配 ${queryMatchedTools.length} 个工具` : '按关键词、格式名或用途快速过滤'}</div>
              <div className="rounded-full border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[10px] text-slate-600">
                {getCategoryLabel(activeCategory)}
              </div>
            </div>
          </section>

          <section
            data-testid="web-summary-quick-entry"
            className="rounded-[16px] border border-emerald-200/80 bg-[linear-gradient(135deg,rgba(16,185,129,0.10),rgba(255,255,255,0.96))] p-3 shadow-[0_10px_24px_rgba(16,185,129,0.08)]"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-emerald-700">
                  <Bot className="h-4 w-4" />
                  <span className="text-[11px] font-semibold uppercase tracking-[0.22em]">Quick entry</span>
                </div>
                <div className="text-sm font-semibold text-slate-900">网页总结</div>
                <p className="text-[12px] leading-5 text-slate-600">
                  在当前网页旁边打开 Side Panel，边看原文边生成摘要。
                </p>
              </div>

              <div className="rounded-full border border-emerald-200 bg-white/90 px-2 py-1 text-[10px] font-medium text-emerald-700">
                Side Panel
              </div>
            </div>

            <div className="mt-3 flex items-center justify-between gap-3">
              <Button
                type="button"
                data-testid="web-summary-quick-open"
                onClick={() => handleToolClick(webSummaryTool)}
                className="h-9 rounded-lg bg-emerald-600 px-3 text-sm font-medium text-white hover:bg-emerald-700"
              >
                总结当前网页
              </Button>

              <div className="max-w-[240px] text-right text-[11px] leading-5 text-slate-500">
                也可在普通网页里右键，选择“使用 QHelper 总结当前网页”
              </div>
            </div>
          </section>

          {recentDisplayTools.length > 0 && (
            <section className="rounded-[16px] border border-slate-200/90 bg-white/85 p-2 backdrop-blur">
              <div className="flex items-center justify-between gap-2">
                <div className="text-[11px] font-medium uppercase tracking-[0.18em] text-slate-500">最近使用</div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 rounded-md border border-slate-200 bg-slate-50 px-2 text-[11px] text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  onClick={async () => {
                    await clearRecentTools()
                    setRecentTools([])
                  }}
                >
                  清空
                </Button>
              </div>

              <div className="mt-1.5 flex flex-wrap gap-1">
                {recentDisplayTools.map((tool) => (
                  <button
                    key={tool.id}
                    type="button"
                    onClick={() => handleToolClick(tool)}
                    className="flex cursor-pointer items-center gap-1 rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-left transition-colors duration-200 hover:border-emerald-300 hover:bg-emerald-50/50"
                  >
                    <span className="flex h-5 w-5 items-center justify-center rounded-md bg-white text-slate-700">
                      {getToolIcon(tool.id)}
                    </span>
                    <span className="text-[11px] font-medium text-slate-700">{tool.name}</span>
                  </button>
                ))}
              </div>
            </section>
          )}

          <section className="space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <div className="text-[11px] font-medium uppercase tracking-[0.18em] text-slate-500">分类</div>
              <div className="text-[11px] text-slate-500">优先展示更多工具，减少空白</div>
            </div>

            <div className="flex flex-wrap gap-1">
              {visibleCategories.map((categoryId) => {
                const Icon = categoryIconMap[categoryId]
                const isActive = activeCategory === categoryId
                const count = categoryId === ALL_CATEGORY ? queryMatchedTools.length : categoryCounts.get(categoryId) || 0

                return (
                  <button
                    key={categoryId}
                    type="button"
                    onClick={() => setActiveCategory(categoryId)}
                    className={`flex cursor-pointer items-center gap-1 rounded-full border px-2 py-1 text-[11px] font-medium transition-colors duration-200 ${
                      isActive
                        ? 'border-emerald-300 bg-emerald-50 text-emerald-700'
                        : 'border-slate-200 bg-white/80 text-slate-600 hover:border-slate-300 hover:bg-white hover:text-slate-900'
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    <span>{getCategoryLabel(categoryId)}</span>
                    <span className="rounded-full bg-slate-100 px-1 py-0.5 text-[10px] text-slate-500">{count}</span>
                  </button>
                )
              })}
            </div>
          </section>

          {filteredTools.length === 0 ? (
            <section className="rounded-[16px] border border-dashed border-slate-200 bg-white/70 p-4 text-center">
              <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
                <Search className="h-4.5 w-4.5" />
              </div>
              <div className="mt-3 text-sm font-semibold text-slate-900">没有匹配结果</div>
              <p className="mt-1.5 text-xs leading-5 text-slate-500">
                试试搜索英文关键词、格式名称，或者清空筛选后从分类中继续浏览。
              </p>
            </section>
          ) : (
            CATEGORY_ORDER.filter((categoryId) => categoryId !== ALL_CATEGORY)
              .map((categoryId) => {
                const tools = groupedTools.get(categoryId)
                if (!tools || tools.length === 0) {
                  return null
                }

                const Icon = categoryIconMap[categoryId]

                return (
                  <section key={categoryId} className="space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600">
                          <Icon className="h-3.5 w-3.5" />
                        </div>
                        <div>
                          <div className="text-[13px] font-semibold text-slate-900">{getCategoryLabel(categoryId)}</div>
                          <div className="text-[11px] text-slate-500">{tools.length} 个工具</div>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-1.5">{tools.map(renderToolCard)}</div>
                  </section>
                )
              })
          )}
        </div>
      </div>
    </div>
  )
}

const root = document.getElementById('app')
if (root) {
  ReactDOM.createRoot(root).render(<App />)
}
