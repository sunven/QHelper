import { ToolSideNavigation } from '@/components/ToolSideNavigation';
import { toolRegistry } from '@/lib/registry/ToolRegistry';
import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';

type ToolPageShellProps = {
  toolId: string;
  children: ReactNode;
  className?: string;
  description?: string;
  heroActions?: ReactNode;
};

export function ToolPageShell({
  toolId,
  children,
  className,
  heroActions,
}: ToolPageShellProps) {
  const tool = toolRegistry.get(toolId);

  if (!tool) {
    throw new Error(`Unknown tool: ${toolId}`);
  }

  return (
    <div className={cn('tool-page-shell flex h-screen min-h-0 flex-col overflow-hidden lg:flex-row', className)} data-tool-category={tool.category}>
      <div
        aria-label="工具菜单区域"
        data-testid="tool-side-navigation-region"
        className="min-h-0 shrink-0 px-2 pt-2 sm:px-3 lg:h-full lg:w-[18.5rem] lg:p-2"
      >
        <ToolSideNavigation />
      </div>

      <main data-testid="tool-page-main" className="min-h-0 min-w-0 flex-1 overflow-y-auto px-2 pb-4 pt-2 sm:px-3 lg:px-4">
        <section className="rounded-md border border-slate-200/80 bg-white/82 px-2.5 py-1.5 shadow-sm dark:border-slate-800 dark:bg-slate-950/70 sm:px-3">
          <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:justify-between">
            <h1 className="tool-hero-title text-balance font-mono text-lg font-semibold leading-6 text-slate-950 dark:text-slate-50 sm:text-xl">
              {tool.name}
            </h1>
            {heroActions ? <div className="flex flex-wrap gap-1.5 sm:justify-end">{heroActions}</div> : null}
          </div>
        </section>

        <div className="mt-2">{children}</div>
      </main>
    </div>
  );
}
