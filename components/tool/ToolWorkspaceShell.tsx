import { ToolSideNavigation } from '@/components/ToolSideNavigation';
import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';

type ToolWorkspaceShellProps = {
  children: ReactNode;
  className?: string;
};

export function ToolWorkspaceShell({ children, className }: ToolWorkspaceShellProps) {
  return (
    <div className={cn('tool-page-shell flex h-screen min-h-0 flex-col overflow-hidden lg:flex-row', className)}>
      <div
        aria-label="工具菜单区域"
        data-testid="tool-side-navigation-region"
        className="min-h-0 shrink-0 px-2 pt-2 sm:px-3 lg:h-full lg:w-[18.5rem] lg:p-2"
      >
        <ToolSideNavigation />
      </div>

      <main data-testid="tool-page-main" className="min-h-0 min-w-0 flex-1 overflow-y-auto px-2 pb-4 pt-2 sm:px-3 lg:px-4">
        {children}
      </main>
    </div>
  );
}
