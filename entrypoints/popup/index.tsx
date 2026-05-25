import {
  ArrowsLeftRightIcon,
  BookmarkSimpleIcon,
  BracketsCurlyIcon,
  CalculatorIcon,
  ClockIcon,
  CodeIcon,
  FileCodeIcon,
  FileJsIcon,
  FileTextIcon,
  HashIcon,
  ImageIcon,
  ImageSquareIcon,
  LinkIcon,
  MagicWandIcon,
  PaletteIcon,
  ShieldCheckIcon,
  SparkleIcon,
  TrashIcon,
  WrenchIcon,
  GearSixIcon,
} from '@phosphor-icons/react'
import type { Icon } from '@phosphor-icons/react'
import { useEffect, useMemo } from 'react'
import ReactDOM from 'react-dom/client'
import { Button } from '@/components/ui/button'
import { removeAll } from '@/lib/chrome/cookies'
import { create } from '@/lib/chrome/tabs'
import { ToolCategory } from '@/lib/registry/ToolMetadata'
import {
  ORDINARY_TOOL_CATALOG_TOOLS,
  TOOL_CATEGORY_LABELS,
} from '@/lib/tool-catalog'
import { getToolsSpaPath } from '@/lib/tools-spa'
import { cn } from '@/lib/utils'
import '@fontsource-variable/jetbrains-mono'
import '../../index.css'

type PopupTool = {
  id: string
  name: string
  description: string
  url: string
  icon: string
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

const toolIconByName: Record<string, Icon> = {
  ArrowsLeftRight: ArrowsLeftRightIcon,
  BookmarkSimple: BookmarkSimpleIcon,
  BracketsCurly: BracketsCurlyIcon,
  Calculator: CalculatorIcon,
  Clock: ClockIcon,
  Code: CodeIcon,
  FileCode: FileCodeIcon,
  FileJs: FileJsIcon,
  FileText: FileTextIcon,
  Hash: HashIcon,
  Image: ImageIcon,
  ImageSquare: ImageSquareIcon,
  Link: LinkIcon,
  MagicWand: MagicWandIcon,
  Palette: PaletteIcon,
  ShieldCheck: ShieldCheckIcon,
  Sparkle: SparkleIcon,
  Trash: TrashIcon,
  Wrench: WrenchIcon,
}

const categoryIconMap: Record<ToolCategory | typeof ALL_CATEGORY, Icon> =
  {
    all: SparkleIcon,
    [ToolCategory.COMMON]: SparkleIcon,
    [ToolCategory.ENCODING]: ArrowsLeftRightIcon,
    [ToolCategory.IMAGE]: ImageIcon,
    [ToolCategory.SECURITY]: ShieldCheckIcon,
    [ToolCategory.WEB_FORMAT]: LinkIcon,
    [ToolCategory.DATA_FORMAT]: BracketsCurlyIcon,
    [ToolCategory.AI]: SparkleIcon,
    [ToolCategory.OTHER]: WrenchIcon,
  }

const categoryAccentMap: Record<
  ToolCategory,
  {
    section: string
    headerIcon: string
    count: string
    tool: string
    toolIcon: string
  }
> = {
  [ToolCategory.COMMON]: {
    section: 'border-emerald-500',
    headerIcon: 'bg-emerald-500/10 text-emerald-700',
    count: 'text-emerald-700',
    tool: 'hover:bg-emerald-500/10 hover:text-emerald-900',
    toolIcon: 'text-emerald-600',
  },
  [ToolCategory.ENCODING]: {
    section: 'border-blue-500',
    headerIcon: 'bg-blue-500/10 text-blue-700',
    count: 'text-blue-700',
    tool: 'hover:bg-blue-500/10 hover:text-blue-900',
    toolIcon: 'text-blue-600',
  },
  [ToolCategory.IMAGE]: {
    section: 'border-fuchsia-500',
    headerIcon: 'bg-fuchsia-500/10 text-fuchsia-700',
    count: 'text-fuchsia-700',
    tool: 'hover:bg-fuchsia-500/10 hover:text-fuchsia-900',
    toolIcon: 'text-fuchsia-600',
  },
  [ToolCategory.SECURITY]: {
    section: 'border-rose-500',
    headerIcon: 'bg-rose-500/10 text-rose-700',
    count: 'text-rose-700',
    tool: 'hover:bg-rose-500/10 hover:text-rose-900',
    toolIcon: 'text-rose-600',
  },
  [ToolCategory.WEB_FORMAT]: {
    section: 'border-cyan-500',
    headerIcon: 'bg-cyan-500/10 text-cyan-700',
    count: 'text-cyan-700',
    tool: 'hover:bg-cyan-500/10 hover:text-cyan-900',
    toolIcon: 'text-cyan-600',
  },
  [ToolCategory.DATA_FORMAT]: {
    section: 'border-amber-500',
    headerIcon: 'bg-amber-500/10 text-amber-700',
    count: 'text-amber-700',
    tool: 'hover:bg-amber-500/10 hover:text-amber-900',
    toolIcon: 'text-amber-600',
  },
  [ToolCategory.AI]: {
    section: 'border-violet-500',
    headerIcon: 'bg-violet-500/10 text-violet-700',
    count: 'text-violet-700',
    tool: 'hover:bg-violet-500/10 hover:text-violet-900',
    toolIcon: 'text-violet-600',
  },
  [ToolCategory.OTHER]: {
    section: 'border-slate-500',
    headerIcon: 'bg-slate-500/10 text-slate-700',
    count: 'text-slate-700',
    tool: 'hover:bg-slate-500/10 hover:text-slate-900',
    toolIcon: 'text-slate-600',
  },
}

const clearCookieTool: PopupTool = {
  id: 'clear-cookie',
  name: '清除 Cookie',
  description:
    '一键清理浏览器 Cookie，适合排查登录失效、缓存脏数据和会话问题。',
  url: '',
  icon: 'Trash',
  type: 'clearCookie',
  category: ToolCategory.OTHER,
}

const webSummaryTool: PopupTool = {
  id: 'web-summary-launch',
  name: '网页总结',
  description: '打开侧边栏总结当前网页内容。',
  url: '',
  icon: 'Sparkle',
  type: 'webSummary',
  category: ToolCategory.AI,
}

const bookmarksTool: PopupTool = {
  id: 'bookmarks',
  name: '书签',
  description: '查看浏览器书签树。',
  url: 'bookmarks.html',
  icon: 'BookmarkSimple',
  type: 'jump',
  category: ToolCategory.OTHER,
}

const specialTools: PopupTool[] = [
  webSummaryTool,
  bookmarksTool,
  clearCookieTool,
]

async function openSettings() {
  try {
    await create(getToolsSpaPath('settings'))
  } catch (error) {
    const message = error instanceof Error ? error.message : '操作失败'
    alert(message)
  }
}

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

function getToolIcon(iconName: string) {
  const Icon = toolIconByName[iconName] || WrenchIcon
  return <Icon data-icon="inline-start" weight="duotone" />
}

function getCategoryLabel(categoryId: ToolCategory | typeof ALL_CATEGORY) {
  if (categoryId === ALL_CATEGORY) {
    return '全部'
  }

  return TOOL_CATEGORY_LABELS[categoryId]
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
    const registryTools = ORDINARY_TOOL_CATALOG_TOOLS.map((tool) => ({
      id: tool.key,
      name: tool.name,
      description: tool.description ?? '',
      url: getToolsSpaPath(tool.key),
      icon: tool.icon,
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
    <ToolButton tool={tool} />
  )

  return (
    <div className="w-130 overflow-hidden bg-background text-foreground">
      <div className="relative">
        <div className="pointer-events-none absolute inset-0" />

        <div className="relative flex flex-col gap-1.5 p-1.5">
          <header className="flex h-8 items-center justify-between border-border border-b px-1">
            <div className="flex min-w-0 items-center gap-1.5">
              <span className="flex size-5 shrink-0 items-center justify-center rounded-sm bg-primary text-primary-foreground">
                <WrenchIcon data-icon="inline-start" weight="duotone" />
              </span>
              <span className="truncate font-medium text-sm">QHelper</span>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label="打开设置"
              data-testid="popup-settings-link"
              title="设置"
              onClick={() => void openSettings()}
              className="rounded-sm"
            >
              <GearSixIcon aria-hidden weight="duotone" />
            </Button>
          </header>

          {CATEGORY_ORDER.filter(
            (categoryId) => categoryId !== ALL_CATEGORY,
          ).map((categoryId) => {
            const tools = groupedTools.get(categoryId)
            if (!tools || tools.length === 0) {
              return null
            }

            const Icon = categoryIconMap[categoryId]
            const accent = categoryAccentMap[categoryId]

            return (
              <section
                key={categoryId}
                className={cn(
                  'flex flex-col gap-0.5 border-l-2 pl-1',
                  accent.section,
                )}
              >
                <div className="flex h-5 items-center gap-1.5 px-1 text-xs text-muted-foreground">
                  <span
                    className={cn(
                      'flex size-4 items-center justify-center rounded-xs',
                      accent.headerIcon,
                    )}
                  >
                    <Icon data-icon="inline-start" weight="duotone" />
                  </span>
                  <span className="font-medium text-foreground">
                    {getCategoryLabel(categoryId)}
                  </span>
                  <span className={cn('font-medium', accent.count)}>
                    {tools.length}
                  </span>
                </div>

                <div className="grid grid-cols-4 gap-0.5">
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

function ToolButton({ tool }: { tool: PopupTool }) {
  const accent = categoryAccentMap[tool.category]

  return (
    <Button
      key={tool.id}
      type="button"
      variant="ghost"
      size="sm"
      data-testid={`tool-${tool.id}`}
      aria-label={`${tool.name}: ${tool.description}`}
      title={tool.description}
      onClick={() => handleToolClick(tool)}
      className={cn(
        'h-7 w-full justify-start gap-1.5 rounded-sm px-1.5 text-left',
        accent.tool,
      )}
    >
      <div className="flex min-w-0 items-center gap-1.5">
        <span
          className={cn(
            'flex size-4 shrink-0 items-center justify-center',
            accent.toolIcon,
          )}
        >
          {getToolIcon(tool.icon)}
        </span>
        <span className="min-w-0 truncate">{tool.name}</span>
      </div>
    </Button>
  )
}

const root = document.getElementById('app')
if (root) {
  ReactDOM.createRoot(root).render(<App />)
}
