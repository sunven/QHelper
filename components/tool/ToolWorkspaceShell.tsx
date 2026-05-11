import type { ReactNode } from 'react'
import { GearSixIcon } from '@phosphor-icons/react'
import { AppSidebar } from '@/components/app-sidebar'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { Separator } from '@/components/ui/separator'
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { TOOL_CATEGORIES } from '@/lib/navigation-config'
import { toolRegistry } from '@/lib/registry/ToolRegistry'
import { getToolsSpaHash } from '@/lib/tools-spa'
import { cn } from '@/lib/utils'

type ToolWorkspaceShellProps = {
  children: ReactNode
  className?: string
  activeToolId?: string
  pageTitle?: string
}

export function ToolWorkspaceShell({
  activeToolId,
  children,
  className,
  pageTitle,
}: ToolWorkspaceShellProps) {
  const activeTool = activeToolId ? toolRegistry.get(activeToolId) : undefined
  const currentPageTitle = pageTitle ?? activeTool?.name ?? '工具'
  const activeCategory = TOOL_CATEGORIES.find((category) =>
    category.tools.some((tool) => tool.key === activeToolId),
  )

  return (
    <TooltipProvider>
      <SidebarProvider
        className={cn('tool-page-shell h-screen overflow-hidden', className)}
      >
        <AppSidebar data-testid="tool-side-navigation-region" />
        <SidebarInset>
          <header
            aria-label="QHelper Tools 导航栏"
            data-testid="tool-workspace-navbar"
            className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12"
          >
            <div className="flex min-w-0 flex-1 items-center gap-2 px-4">
              <SidebarTrigger className="-ml-1" />
              <Separator
                orientation="vertical"
                className="mr-2 data-[orientation=vertical]:h-4"
              />
              <Breadcrumb>
                <BreadcrumbList className="h-7 flex-nowrap leading-none">
                  <BreadcrumbItem className="hidden md:flex">
                    <BreadcrumbLink className="leading-none" href="#/json">
                      QHelper Tools
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  {activeCategory ? (
                    <>
                      <BreadcrumbSeparator className="hidden items-center md:flex [&>svg]:block" />
                      <BreadcrumbItem className="hidden md:flex">
                        <BreadcrumbLink className="leading-none" href="#">
                          {activeCategory.name}
                        </BreadcrumbLink>
                      </BreadcrumbItem>
                    </>
                  ) : null}
                  <BreadcrumbSeparator className="hidden items-center md:flex [&>svg]:block" />
                  <BreadcrumbItem>
                    <BreadcrumbPage className="leading-none">
                      {currentPageTitle}
                    </BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </div>
            <div className="ml-auto flex shrink-0 items-center px-4 pl-0">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button asChild variant="ghost" size="icon-sm">
                    <a
                      aria-label="打开设置"
                      data-testid="tool-settings-link"
                      href={getToolsSpaHash('settings')}
                    >
                      <GearSixIcon aria-hidden />
                    </a>
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">设置</TooltipContent>
              </Tooltip>
            </div>
          </header>

          <main
            data-testid="tool-page-main"
            className="min-h-0 min-w-0 flex-1 overflow-y-auto p-4 pt-0"
          >
            {children}
          </main>
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  )
}
