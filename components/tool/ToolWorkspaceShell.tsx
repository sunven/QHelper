import type { ReactNode } from 'react'
import { ToolSideNavigation } from '@/components/ToolSideNavigation'
import { cn } from '@/lib/utils'

type ToolWorkspaceShellProps = {
  children: ReactNode
  className?: string
}

export function ToolWorkspaceShell({
  children,
  className,
}: ToolWorkspaceShellProps) {
  return (
    <div
      className={cn(
        'tool-page-shell flex h-screen min-h-0 flex-col overflow-hidden',
        className,
      )}
    >
      <header
        aria-label="QHelper Tools 导航栏"
        data-testid="tool-workspace-navbar"
        className="flex h-14 shrink-0 items-center border-b border-slate-200/80 bg-white px-4 shadow-sm dark:border-slate-800 dark:bg-slate-950 sm:px-5"
      >
        <div className="text-base font-semibold text-slate-900 dark:text-slate-50">
          QHelper Tools
        </div>
      </header>

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden lg:flex-row">
        <div
          aria-label="工具菜单区域"
          data-testid="tool-side-navigation-region"
          className="min-h-0 shrink-0 lg:h-full lg:w-[18.5rem]"
        >
          <ToolSideNavigation />
        </div>

        <main
          data-testid="tool-page-main"
          className="min-h-0 min-w-0 flex-1 overflow-y-auto p-2"
        >
          {children}
        </main>
      </div>
    </div>
  )
}
