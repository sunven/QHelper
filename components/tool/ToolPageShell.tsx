import { ToolNavigation } from '@/components/ToolNavigation';
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
    <div className={cn('tool-page-shell min-h-screen pb-4', className)} data-tool-category={tool.category}>
      <ToolNavigation />
      <main className="mx-auto max-w-[1520px] px-2 pb-4 pt-2 sm:px-3 lg:px-4">
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
