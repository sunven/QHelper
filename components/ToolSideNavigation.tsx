import {
  BinaryIcon,
  BracketsCurlyIcon,
  ClockIcon,
  DatabaseIcon,
  GlobeIcon,
  ImageIcon,
  LockKeyIcon,
  RobotIcon,
  ToolboxIcon,
} from '@phosphor-icons/react'
import * as React from 'react'
import { useInRouterContext, useLocation, useNavigate } from 'react-router'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from '@/components/ui/sidebar'
import { TOOL_CATEGORIES, type Tool } from '@/lib/navigation-config'
import { getCurrentToolKey, navigateToTool } from '@/lib/navigation-utils'
import { getToolRoutePath } from '@/lib/tools-spa'
import { cn } from '@/lib/utils'

type ToolMenuItem = {
  key: string
  label: string
  children: {
    key: string
    label: string
  }[]
}

const categoryIcons: Record<string, React.ReactNode> = {
  common: <BracketsCurlyIcon />,
  encoding: <BinaryIcon />,
  image: <ImageIcon />,
  security: <LockKeyIcon />,
  web_format: <GlobeIcon />,
  data_format: <DatabaseIcon />,
  ai: <RobotIcon />,
  other: <ClockIcon />,
}

export function findCategoryKeyForTool(toolKey: string | null): string | null {
  if (!toolKey) {
    return null
  }

  const category = TOOL_CATEGORIES.find((item) =>
    item.tools.some((tool) => tool.key === toolKey),
  )
  return category?.key ?? null
}

export function createToolMenuItems(): ToolMenuItem[] {
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
      currentToolKey={location.pathname
        .replace(/^\/+/, '')
        .split('/')[0]
        ?.replace(/\.html$/, '') || null}
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

  function handleCategoryOpenChange(categoryKey: string, open: boolean) {
    setOpenKeys((keys) => {
      if (open) {
        return keys.includes(categoryKey) ? keys : [...keys, categoryKey]
      }

      return keys.filter((key) => key !== categoryKey)
    })
  }

  function handleToolSelect(event: React.MouseEvent, toolKey: string) {
    event.preventDefault()

    const tool = toolByKey.get(toolKey)
    if (tool) {
      onToolSelect(tool)
    }
  }

  return (
    <nav
      aria-label="工具导航"
      data-testid="tool-side-navigation"
      className={cn('tool-side-navigation', className)}
    >
      <SidebarGroup>
        <SidebarGroupLabel>Tools</SidebarGroupLabel>
        <SidebarMenu data-testid="tool-side-navigation-scroll">
          {TOOL_CATEGORIES.map((category) => (
            <Collapsible
              key={category.key}
              asChild
              open={openKeys.includes(category.key)}
              onOpenChange={(open) =>
                handleCategoryOpenChange(category.key, open)
              }
              className="group/collapsible"
            >
              <SidebarMenuItem>
                <CollapsibleTrigger asChild>
                  <SidebarMenuButton
                    tooltip={category.name}
                    isActive={category.key === currentCategoryKey}
                  >
                    {categoryIcons[category.key] ?? <ToolboxIcon />}
                    <span>{category.name}</span>
                  </SidebarMenuButton>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <SidebarMenuSub>
                    {category.tools.map((tool) => (
                      <SidebarMenuSubItem key={tool.key}>
                        <SidebarMenuSubButton
                          asChild
                          isActive={currentToolKey === tool.key}
                        >
                          <a
                            href={tool.path}
                            onClick={(event) =>
                              handleToolSelect(event, tool.key)
                            }
                            role="menuitem"
                          >
                            <span>{tool.name}</span>
                          </a>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    ))}
                  </SidebarMenuSub>
                </CollapsibleContent>
              </SidebarMenuItem>
            </Collapsible>
          ))}
        </SidebarMenu>
      </SidebarGroup>
    </nav>
  )
}
