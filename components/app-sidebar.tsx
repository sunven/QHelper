'use client'

import { ToolboxIcon } from '@phosphor-icons/react'
import type * as React from 'react'
import { ToolSideNavigation } from '@/components/ToolSideNavigation'
import { WorkspaceLink } from '@/components/tool/WorkspaceLink'
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from '@/components/ui/sidebar'
import { DEFAULT_TOOL_ID, getToolsSpaPath } from '@/lib/tool-catalog'

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <WorkspaceLink href={`/${getToolsSpaPath(DEFAULT_TOOL_ID)}`}>
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                  <ToolboxIcon />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">QHelper</span>
                  <span className="truncate text-xs">Developer Tools</span>
                </div>
              </WorkspaceLink>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <ToolSideNavigation />
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  )
}
