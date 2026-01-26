import ReactDOM from 'react-dom/client'
import { Button } from '@/components/ui/button'
import {
  Code,
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
} from 'lucide-react'
import { create } from '../../lib/chrome/tabs'
import { removeAll } from '../../lib/chrome/cookies'
import '../../index.css'

type Tool = {
  name: string
  url: string
  type: 'jump' | 'clearCookie'
  icon?: React.ReactNode
}

type ToolCategory = {
  icon: React.ReactNode
  name: string
  tools: Tool[]
}

const toolCategories: ToolCategory[] = [
  {
    name: '常用',
    icon: <Wrench className="w-4 h-4" />,
    tools: [
      {
        name: 'json',
        url: 'json.html',
        type: 'jump' as const,
        icon: <Code className="w-4 h-4" />,
      },
      {
        name: '进制转换',
        url: 'trans-radix.html',
        type: 'jump' as const,
        icon: <Calculator className="w-4 h-4" />,
      },
    ],
  },
  {
    name: '编码转换',
    icon: <ArrowLeftRight className="w-4 h-4" />,
    tools: [
      {
        name: '字符串编解码',
        url: 'convert.html',
        type: 'jump' as const,
        icon: <Code className="w-4 h-4" />,
      },
      {
        name: '代码美化',
        url: 'codebeautify.html',
        type: 'jump' as const,
        icon: <Wand2 className="w-4 h-4" />,
      },
      {
        name: 'uglify',
        url: 'uglify.html',
        type: 'jump' as const,
        icon: <Zap className="w-4 h-4" />,
      },
    ],
  },
  {
    name: '图片工具',
    icon: <Image className="w-4 h-4" />,
    tools: [
      {
        name: '图片Base64',
        url: 'imagebase64.html',
        type: 'jump' as const,
        icon: <Image className="w-4 h-4" />,
      },
      {
        name: '图片拼接',
        url: 'pictureSplicing.html',
        type: 'jump' as const,
        icon: <ImagePlus className="w-4 h-4" />,
      },
    ],
  },
  {
    name: '其他',
    icon: <Palette className="w-4 h-4" />,
    tools: [
      {
        name: '时间戳转换',
        url: 'timestamp.html',
        type: 'jump' as const,
        icon: <CalendarClock className="w-4 h-4" />,
      },
      {
        name: '颜色转换',
        url: 'colorTransform.html',
        type: 'jump' as const,
        icon: <Palette className="w-4 h-4" />,
      },
      {
        name: '清除Cookie',
        url: '',
        type: 'clearCookie' as const,
        icon: <Trash2 className="w-4 h-4" />,
      },
    ],
  },
]

function App() {
  return (
    <div className="w-[280px] min-h-[200px] p-3 bg-background">
      {/* 标题 */}
      <div className="flex items-center gap-2 mb-3 pb-2 border-b">
        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
          <Wrench className="w-4 h-4 text-primary-foreground" />
        </div>
        <h1 className="text-lg font-semibold">QHelper</h1>
      </div>

      {/* 工具列表 */}
      <div className="space-y-3">
        {toolCategories.map((category) => (
          <div key={category.name}>
            <div className="flex items-center gap-1.5 mb-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wide">
              {category.icon}
              {category.name}
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              {category.tools.map((tool) => (
                <Button
                  key={tool.name}
                  variant="ghost"
                  size="sm"
                  className="justify-start gap-2 h-8 text-xs"
                  onClick={() => handleToolClick(tool)}
                >
                  {tool.icon}
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

async function handleToolClick(tool: Tool) {
  if (tool.type === 'jump') {
    await create(tool.url)
  } else if (tool.type === 'clearCookie') {
    await removeAll()
    alert('Cookie 已清除')
  }
}

// Mount the React app
const root = document.getElementById('app')
if (root) {
  ReactDOM.createRoot(root).render(<App />)
}
