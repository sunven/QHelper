import { getToolCatalogTool } from '@/lib/tool-catalog';
import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';

type ToolPageShellProps = {
  toolId: string;
  children: ReactNode;
  className?: string;
  description?: string;
};

export function ToolPageShell({
  toolId,
  children,
  className,
}: ToolPageShellProps) {
  const tool = getToolCatalogTool(toolId);

  if (!tool) {
    throw new Error(`Unknown tool: ${toolId}`);
  }

  return (
    <article
      aria-labelledby={`tool-page-title-${toolId}`}
      className={cn('tool-page-view min-h-full', className)}
      data-tool-category={tool.category}
      data-tool-id={toolId}
    >
      <h1 className="sr-only" id={`tool-page-title-${toolId}`}>
        {tool.name}
      </h1>
      {children}
    </article>
  );
}
