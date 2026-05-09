import { Menu, type MenuProps } from 'antd'
import * as React from 'react'
import { useInRouterContext, useLocation, useNavigate } from 'react-router'
import { TOOL_CATEGORIES, type Tool } from '@/lib/navigation-config'
import { getCurrentToolKey, navigateToTool } from '@/lib/navigation-utils'
import { getToolRoutePath } from '@/lib/tools-spa'
import { cn } from '@/lib/utils'

type MenuItem = Required<MenuProps>['items'][number]

export function findCategoryKeyForTool(toolKey: string | null): string | null {
  if (!toolKey) {
    return null
  }

  const category = TOOL_CATEGORIES.find((item) =>
    item.tools.some((tool) => tool.key === toolKey),
  )
  return category?.key ?? null
}

export function createToolMenuItems(): MenuItem[] {
  return TOOL_CATEGORIES.map((category) => ({
    key: category.key,
    label: category.name,
    children: category.tools.map((tool) => ({
      key: tool.key,
      label: tool.name,
    })),
  }))
}

function createToolByKey(): Map<string, Tool> {
  const toolByKey = new Map<string, Tool>()

  for (const category of TOOL_CATEGORIES) {
    for (const tool of category.tools) {
      toolByKey.set(tool.key, tool)
    }
  }

  return toolByKey
}

function getToolKeyFromRouterPath(pathname: string): string | null {
  const toolKey = pathname.replace(/^\/+/, '').split('/')[0]
  return toolKey || null
}

export function ToolSideNavigation({ className }: { className?: string }) {
  const inRouter = useInRouterContext()

  if (inRouter) {
    return <RouterToolSideNavigation className={className} />
  }

  return (
    <StandaloneToolSideNavigation
      className={className}
      currentToolKey={getCurrentToolKey()}
    />
  )
}

function RouterToolSideNavigation({ className }: { className?: string }) {
  const navigate = useNavigate()
  const location = useLocation()

  return (
    <ToolSideNavigationContent
      className={className}
      currentToolKey={getToolKeyFromRouterPath(location.pathname)}
      onToolSelect={(tool) => {
        void navigate(getToolRoutePath(tool.key))
      }}
    />
  )
}

function StandaloneToolSideNavigation({
  className,
  currentToolKey,
}: {
  className?: string
  currentToolKey: string | null
}) {
  return (
    <ToolSideNavigationContent
      className={className}
      currentToolKey={currentToolKey}
      onToolSelect={navigateToTool}
    />
  )
}

function ToolSideNavigationContent({
  className,
  currentToolKey,
  onToolSelect,
}: {
  className?: string
  currentToolKey: string | null
  onToolSelect: (tool: Tool) => void
}) {
  const currentCategoryKey = findCategoryKeyForTool(currentToolKey)
  const items = React.useMemo(() => createToolMenuItems(), [])
  const toolByKey = React.useMemo(() => createToolByKey(), [])
  const [openKeys, setOpenKeys] = React.useState<string[]>(() =>
    currentCategoryKey ? [currentCategoryKey] : [],
  )

  React.useEffect(() => {
    if (!currentCategoryKey) {
      return
    }

    setOpenKeys((keys) =>
      keys.includes(currentCategoryKey) ? keys : [...keys, currentCategoryKey],
    )
  }, [currentCategoryKey])

  const handleMenuClick: MenuProps['onClick'] = ({ key }) => {
    const tool = toolByKey.get(key)
    if (tool) {
      onToolSelect(tool)
    }
  }

  return (
    <nav
      aria-label="工具导航"
      data-testid="tool-side-navigation"
      className={cn(
        'tool-side-navigation flex h-full min-h-0 flex-col overflow-hidden border border-slate-200/80 bg-white/92 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-950/88',
        className,
      )}
    >
      <div
        data-testid="tool-side-navigation-scroll"
        className="min-h-0 flex-1 overflow-y-auto"
      >
        <Menu
          aria-label="工具列表"
          items={items}
          mode="inline"
          onClick={handleMenuClick}
          onOpenChange={setOpenKeys}
          openKeys={openKeys}
          selectedKeys={currentToolKey ? [currentToolKey] : []}
        />
      </div>
    </nav>
  )
}
