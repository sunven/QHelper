import type { LucideIcon } from 'lucide-react'
import {
  ArrowLeftRight,
  ArrowUpRight,
  Bookmark,
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
  LayoutGrid,
  Link2,
  Palette,
  Shield,
  Sparkles,
  Trash2,
  Wand2,
  Wrench,
  Zap,
} from 'lucide-react'
import { useEffect, useMemo } from 'react'
import ReactDOM from 'react-dom/client'
import { TOOL_CATEGORIES } from '@/constants/tools'
import { removeAll } from '@/lib/chrome/cookies'
import { create } from '@/lib/chrome/tabs'
import { ToolCategory } from '@/lib/registry/ToolMetadata'
import { toolRegistry } from '@/lib/registry/ToolRegistry'
import '../../index.css'

type PopupTool = {
  id: string
  name: string
  description: string
  url: string
  type: 'jump' | 'clearCookie' | 'webSummary'
  category: ToolCategory
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
  downloads: Trash2,
  'clear-cookie': Trash2,
  uuid: Hash,
  password: Shield,
  bookmarks: Bookmark,
  urlparser: Link2,
  csv2json: FileJson,
  filemerge: FileCode,
  yaml: FileCode,
  markdown: FileText,
  htmlformat: Code2,
  csstool: Palette,
  scss: FileJson,
  svgoptimizer: Image,
  cron: Clock,
  toml: FileJson,
  jsonschema: Shield,
  xmlformatter: FileCode,
}

const categoryIconMap: Record<ToolCategory | typeof ALL_CATEGORY, LucideIcon> =
  {
    all: LayoutGrid,
    [ToolCategory.COMMON]: Sparkles,
    [ToolCategory.ENCODING]: ArrowLeftRight,
    [ToolCategory.IMAGE]: Image,
    [ToolCategory.SECURITY]: Shield,
    [ToolCategory.WEB_FORMAT]: Link2,
    [ToolCategory.DATA_FORMAT]: FileJson,
    [ToolCategory.AI]: Sparkles,
    [ToolCategory.OTHER]: Wrench,
  }

const clearCookieTool: PopupTool = {
  id: 'clear-cookie',
  name: '清除 Cookie',
  description:
    '一键清理浏览器 Cookie，适合排查登录失效、缓存脏数据和会话问题。',
  url: '',
  type: 'clearCookie',
  category: ToolCategory.OTHER,
}

const webSummaryTool: PopupTool = {
  id: 'web-summary-launch',
  name: '网页总结',
  description: '打开侧边栏总结当前网页内容。',
  url: '',
  type: 'webSummary',
  category: ToolCategory.AI,
}

const bookmarksTool: PopupTool = {
  id: 'bookmarks',
  name: '书签',
  description: '查看浏览器书签树。',
  url: 'bookmarks.html',
  type: 'jump',
  category: ToolCategory.OTHER,
}

const specialTools: PopupTool[] = [
  webSummaryTool,
  bookmarksTool,
  clearCookieTool,
]

async function handleToolClick(tool: PopupTool) {
  try {
    if (tool.type === 'jump') {
      await create(tool.url)
      return
    }

    if (tool.type === 'webSummary') {
      await chrome.runtime.sendMessage({ type: 'OPEN_WEB_SUMMARY' })
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

function App() {
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

  const allTools = useMemo<PopupTool[]>(() => {
    const registryTools = toolRegistry.getAll().map((tool) => ({
      id: tool.id,
      name: tool.name,
      description: tool.description,
      url: tool.entry,
      type: 'jump' as const,
      category: tool.category,
    }))

    return [...registryTools, ...specialTools]
  }, [])

  const groupedTools = useMemo(() => {
    const groups = new Map<ToolCategory, PopupTool[]>()

    for (const tool of allTools) {
      const items = groups.get(tool.category) || []
      items.push(tool)
      groups.set(tool.category, items)
    }

    return groups
  }, [allTools])

  const renderToolCard = (tool: PopupTool) => (
    <button
      key={tool.id}
      type="button"
      data-testid={`tool-${tool.id}`}
      onClick={() => handleToolClick(tool)}
      className="group flex min-h-8 cursor-pointer items-center justify-between gap-1 rounded-md border border-slate-200 bg-white p-1 text-left transition-[border-color,background-color,box-shadow] duration-200 hover:border-emerald-400/60 hover:bg-emerald-50/50 hover:shadow-[0_10px_24px_rgba(16,185,129,0.10)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/60"
    >
      <div className="flex min-w-0 items-center gap-1.5">
        <div className="flex h-6.5 w-6.5 shrink-0 items-center justify-center rounded-md border border-slate-200 bg-slate-100 text-slate-700">
          {getToolIcon(tool.id)}
        </div>
        <div className="line-clamp-1 text-[12px] font-semibold leading-4 text-slate-900">
          {tool.name}
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-1">
        <ArrowUpRight className="h-3.5 w-3.5 text-slate-400 transition-colors duration-200 group-hover:text-emerald-600" />
      </div>
    </button>
  )

  return (
    <div
      className="w-130 overflow-hidden text-slate-900"
      style={{
        fontFamily: '"IBM Plex Sans", "SF Pro Text", "Segoe UI", sans-serif',
      }}
    >
      <div className="relative">
        <div className="pointer-events-none absolute inset-0" />

        <div className="relative space-y-2 p-2">
          {CATEGORY_ORDER.filter(
            (categoryId) => categoryId !== ALL_CATEGORY,
          ).map((categoryId) => {
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
                    <div className="flex items-baseline gap-1.5">
                      <div className="text-[13px] font-semibold text-slate-900">
                        {getCategoryLabel(categoryId)}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {tools.length} 个工具
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-1">
                  {tools.map(renderToolCard)}
                </div>
              </section>
            )
          })}
        </div>
      </div>
    </div>
  )
}

const root = document.getElementById('app')
if (root) {
  ReactDOM.createRoot(root).render(<App />)
}
