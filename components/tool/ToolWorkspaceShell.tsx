import type { ReactNode } from 'react'
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
import { TooltipProvider } from '@/components/ui/tooltip'
import { TOOL_CATEGORIES } from '@/lib/navigation-config'
import { toolRegistry } from '@/lib/registry/ToolRegistry'
import { cn } from '@/lib/utils'

type ToolWorkspaceShellProps = {
  children: ReactNode
  className?: string
  activeToolId?: string
}

export function ToolWorkspaceShell({
  activeToolId,
  children,
  className,
}: ToolWorkspaceShellProps) {
  const activeTool = activeToolId ? toolRegistry.get(activeToolId) : undefined
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
            <div className="flex items-center gap-2 px-4">
              <SidebarTrigger className="-ml-1" />
              <Separator
                orientation="vertical"
                className="mr-2 data-[orientation=vertical]:h-4"
              />
              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem className="hidden md:block">
                    <BreadcrumbLink href="#/json">QHelper Tools</BreadcrumbLink>
                  </BreadcrumbItem>
                  {activeCategory ? (
                    <>
                      <BreadcrumbSeparator className="hidden md:block" />
                      <BreadcrumbItem className="hidden md:block">
                        <BreadcrumbLink href="#">
                          {activeCategory.name}
                        </BreadcrumbLink>
                      </BreadcrumbItem>
                    </>
                  ) : null}
                  <BreadcrumbSeparator className="hidden md:block" />
                  <BreadcrumbItem>
                    <BreadcrumbPage>
                      {activeTool?.name ?? '工具'}
                    </BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
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
