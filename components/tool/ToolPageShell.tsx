import type { ReactNode } from 'react'
import { getToolCatalogTool, type OrdinaryToolId } from '@/lib/tool-catalog'

type ToolPageShellProps = {
  toolId: OrdinaryToolId
  children: ReactNode
}

export function ToolPageShell({ toolId, children }: ToolPageShellProps) {
  const tool = getToolCatalogTool(toolId)

  if (!tool) {
    throw new Error(`Unknown tool: ${toolId}`)
  }

  return (
    <article
      aria-labelledby={`tool-page-title-${toolId}`}
      className="tool-page-view min-h-full"
      data-tool-category={tool.category}
      data-tool-id={toolId}
    >
      <h1 className="sr-only" id={`tool-page-title-${toolId}`}>
        {tool.name}
      </h1>
      {children}
    </article>
  )
}
