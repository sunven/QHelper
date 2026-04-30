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
    <div className={cn('tool-page-shell min-h-screen pb-12', className)} data-tool-category={tool.category}>
      <ToolNavigation />
      <main className="mx-auto max-w-7xl px-4 pb-8 pt-4 sm:px-6 lg:px-8">
        <section className="rounded-lg border border-slate-200/80 bg-white/72 px-3 py-2.5 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-950/56 sm:px-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <h1 className="tool-hero-title text-balance font-mono text-2xl font-semibold text-slate-950 dark:text-slate-50 sm:text-3xl">
              {tool.name}
            </h1>
            {heroActions ? <div className="flex flex-wrap gap-2 sm:justify-end">{heroActions}</div> : null}
          </div>
        </section>

        <div className="mt-3">{children}</div>
      </main>
    </div>
  );
}
