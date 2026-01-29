import { useState, useEffect } from 'react'
import ReactDOM from 'react-dom/client'
import { Button } from '@/components/ui/button'
import {
  Code,
  Code2,
  ArrowLeftRight,
  Wand2,
  CalendarClock,
  Image,
  Palette,
  ImagePlus,
  Zap,
  Trash2,
  Calculator,
  Wrench,
  Clock,
  Hash,
  Key,
  Link2,
  FileJson,
  FileCode,
  Shield,
  FileText,
} from 'lucide-react'
import { create } from '../../lib/chrome/tabs'
import { removeAll } from '../../lib/chrome/cookies'
import { toolRegistry } from '@/lib/registry/ToolRegistry'
import { getRecentTools, trackToolUsage, clearRecentTools, type RecentToolEntry } from '@/lib/utils/recentTools'
import { TOOL_CATEGORIES } from '@/constants/tools'
import '../../index.css'

type Tool = {
  id: string
  name: string
  url: string
  type: 'jump' | 'clearCookie'
  icon?: React.ReactNode
}

async function handleToolClick(tool: Tool) {
  // 记录工具使用
  if (tool.type === 'jump') {
    await trackToolUsage(tool.id, tool.name)
    await create(tool.url)
  } else if (tool.type === 'clearCookie') {
    await removeAll()
    alert('Cookie 已清除')
  }
}

function App() {
  const [recentTools, setRecentTools] = useState<RecentToolEntry[]>([])

  useEffect(() => {
    // 加载最近使用的工具
    getRecentTools().then(setRecentTools)
  }, [])

  // 从工具注册表获取所有工具
  const allTools = toolRegistry.getAll()

  // 按分类分组工具
  const toolsByCategory = new Map<string, Tool[]>()

  for (const tool of allTools) {
    const tools = toolsByCategory.get(tool.category) || []
    tools.push({
      id: tool.id,
      name: tool.name,
      url: tool.entry,
      type: 'jump',
    })
    toolsByCategory.set(tool.category, tools)
  }

  // 添加清除Cookie工具到"其他"分类
  const otherTools = toolsByCategory.get('other') || []
  otherTools.push({
    id: 'clear-cookie',
    name: '清除Cookie',
    url: '',
    type: 'clearCookie',
  })
  toolsByCategory.set('other', otherTools)

  // 获取图标组件
  const getIcon = (toolId: string) => {
    const iconMap: Record<string, React.ReactNode> = {
      json: <Code className="w-4 h-4" />,
      'trans-radix': <Calculator className="w-4 h-4" />,
      convert: <Code className="w-4 h-4" />,
      codebeautify: <Wand2 className="w-4 h-4" />,
      uglify: <Zap className="w-4 h-4" />,
      imagebase64: <Image className="w-4 h-4" />,
      pictureSplicing: <ImagePlus className="w-4 h-4" />,
      timestamp: <CalendarClock className="w-4 h-4" />,
      colorTransform: <Palette className="w-4 h-4" />,
      'clear-cookie': <Trash2 className="w-4 h-4" />,
      uuid: <Hash className="w-4 h-4" />,
      password: <Shield className="w-4 h-4" />,
      urlparser: <Link2 className="w-4 h-4" />,
      csv2json: <FileJson className="w-4 h-4" />,
      yaml: <FileCode className="w-4 h-4" />,
      markdown: <FileText className="w-4 h-4" />,
      htmlformat: <Code2 className="w-4 h-4" />,
      csstool: <Palette className="w-4 h-4" />,
      scss: <FileJson className="w-4 h-4" />,
      svgoptimizer: <Image className="w-4 h-4" />,
      cron: <Clock className="w-4 h-4" />,
      toml: <FileJson className="w-4 h-4" />,
      jsonschema: <Shield className="w-4 h-4" />,
      xmlformatter: <FileCode className="w-4 h-4" />,
    }
    return iconMap[toolId] || <Wrench className="w-4 h-4" />
  }

  // 分类图标映射
  const categoryIcons: Record<string, React.ReactNode> = {
    common: <Wrench className="w-4 h-4" />,
    encoding: <ArrowLeftRight className="w-4 h-4" />,
    image: <Image className="w-4 h-4" />,
    other: <Palette className="w-4 h-4" />,
    security: <Shield className="w-4 h-4" />,
    web_format: <Link2 className="w-4 h-4" />,
    data_format: <FileJson className="w-4 h-4" />,
  }

  return (
    <div className="w-[280px] min-h-[200px] p-3 bg-background">
      {/* 标题 */}
      <div className="flex items-center gap-2 mb-3 pb-2 border-b">
        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
          <Wrench className="w-4 h-4 text-primary-foreground" />
        </div>
        <h1 className="text-lg font-semibold">QHelper</h1>
      </div>

      {/* 最近使用 */}
      {recentTools.length > 0 && (
        <div className="mb-3">
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wide">
              <Clock className="w-3 h-3" />
              最近使用
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="h-5 px-1.5 text-xs"
              onClick={async () => {
                await clearRecentTools()
                setRecentTools([])
              }}
            >
              清除
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            {recentTools.map((entry) => (
              <Button
                key={entry.toolId}
                variant="ghost"
                size="sm"
                className="justify-start gap-2 h-8 text-xs"
                onClick={() => handleToolClick({ id: entry.toolId, name: entry.toolName, url: `${entry.toolId}.html`, type: 'jump' })}
              >
                {getIcon(entry.toolId)}
                {entry.toolName}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* 工具列表 */}
      <div className="space-y-3">
        {Array.from(toolsByCategory.entries()).map(([categoryId, tools]) => (
          <div key={categoryId}>
            <div className="flex items-center gap-1.5 mb-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wide">
              {categoryIcons[categoryId] || <Wrench className="w-4 h-4" />}
              {TOOL_CATEGORIES[categoryId as keyof typeof TOOL_CATEGORIES] || categoryId}
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              {tools.map((tool) => (
                <Button
                  key={tool.id}
                  variant="ghost"
                  size="sm"
                  className="justify-start gap-2 h-8 text-xs"
                  onClick={() => handleToolClick(tool)}
                >
                  {getIcon(tool.id)}
                  {tool.name}
                </Button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// Mount the React app
const root = document.getElementById('app')
if (root) {
  ReactDOM.createRoot(root).render(<App />)
}
