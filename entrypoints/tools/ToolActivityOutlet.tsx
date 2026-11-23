import { Activity, lazy, Suspense, useEffect, useState } from 'react'
import { Navigate, useParams } from 'react-router'
import { ToolWorkspaceShell } from '@/components/tool/ToolWorkspaceShell'
import { toolRoutes } from '@/components/tool/tool-routes'
import {
  DEFAULT_TOOL_ID,
  getToolRoutePath,
  parseToolRouteParam,
} from '@/lib/tool-catalog'

const SettingsPage = lazy(() =>
  import('@/components/tool/settings').then((module) => ({
    default: module.SettingsPage,
  })),
)

export function ToolActivityOutlet() {
  const { toolId } = useParams<{ toolId: string }>()
  const isSettings = toolId === 'settings.html'
  const activeToolId = parseToolRouteParam(toolId)
  const [visitedToolIds, setVisitedToolIds] = useState<string[]>(() =>
    activeToolId ? [activeToolId] : [],
  )

  useEffect(() => {
    if (!activeToolId) return
    setVisitedToolIds((current) =>
      current.includes(activeToolId) ? current : [...current, activeToolId],
    )
  }, [activeToolId])

  if (!activeToolId && !isSettings)
    return <Navigate replace to={getToolRoutePath(DEFAULT_TOOL_ID)} />

  return (
    <ToolWorkspaceShell
      activeToolId={activeToolId ?? undefined}
      pageTitle={isSettings ? '设置' : undefined}
    >
      {isSettings && (
        <Suspense
          fallback={
            <p role="status" className="p-4 text-sm text-muted-foreground">
              正在加载设置…
            </p>
          }
        >
          <SettingsPage />
        </Suspense>
      )}
      {toolRoutes.flatMap(({ id, Component, preserveActivity }) => {
        if (!visitedToolIds.includes(id)) return []
        const visible = activeToolId === id
        if (!visible && !preserveActivity) return []
        return [
          <Activity
            key={id}
            name={`tool-${id}`}
            mode={visible ? 'visible' : 'hidden'}
          >
            <Component />
          </Activity>,
        ]
      })}
    </ToolWorkspaceShell>
  )
}
