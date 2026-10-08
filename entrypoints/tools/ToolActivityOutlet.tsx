import { Activity, useEffect, useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router'
import { SettingsPage } from '@/components/tool/settings'
import {
  ToolSessionActions,
  ToolSessionContext,
} from '@/components/tool/ToolSessionContext'
import { ToolSessionToolbar } from '@/components/tool/ToolSessionToolbar'
import { ToolWorkspaceShell } from '@/components/tool/ToolWorkspaceShell'
import { toolRoutes } from '@/components/tool/tool-routes'
import {
  DEFAULT_TOOL_ID,
  getToolRoutePath,
  parseToolRouteParam,
} from '@/lib/tool-catalog'
import { SESSION_TOOL_IDS, supportsToolSession } from '@/lib/tool-data/catalog'
import { generationKey, subscribeData } from '@/lib/tool-data/storage'
import { recordRecentTool } from '@/lib/tool-discovery'
import { createToolSession, type ToolSession } from '@/lib/tool-sessions'

export function ToolActivityOutlet() {
  const { toolId } = useParams<{ toolId: string }>()
  const navigate = useNavigate()
  const isSettings = toolId === 'settings.html'
  const activeToolId = parseToolRouteParam(toolId)
  const [normal, setNormal] = useState<Record<string, ToolSession>>(() =>
    activeToolId ? { [activeToolId]: createToolSession(activeToolId) } : {},
  )
  const [temporary, setTemporary] = useState<Record<string, ToolSession>>({})

  useEffect(() => {
    if (!activeToolId) return
    setNormal((current) =>
      current[activeToolId]
        ? current
        : { ...current, [activeToolId]: createToolSession(activeToolId) },
    )
    void recordRecentTool(activeToolId).catch(() => undefined)
  }, [activeToolId])

  // Keep listening when tool Activities suspend their effects.
  useEffect(() => {
    const subscriptions = SESSION_TOOL_IDS.map((id) =>
      subscribeData(generationKey(id), () => {
        setNormal((current) =>
          current[id] ? { ...current, [id]: createToolSession(id) } : current,
        )
      }),
    )
    return () => {
      for (const unsubscribe of subscriptions) unsubscribe()
    }
  }, [])

  function openTemporarySession(
    id: string,
    values: Record<string, unknown> = {},
  ) {
    if (!supportsToolSession(id)) return
    if (
      temporary[id] &&
      !window.confirm('替换现有临时内容？未保存的修改会丢弃，普通草稿会保留。')
    )
      return
    setTemporary((current) => ({
      ...current,
      [id]: createToolSession(id, true, values),
    }))
    setNormal((current) =>
      current[id] ? current : { ...current, [id]: createToolSession(id) },
    )
    void navigate(getToolRoutePath(id))
  }

  function endTemporarySession(id: string) {
    if (
      !window.confirm(
        '结束临时处理并丢弃未保存的修改？已保存快照和普通草稿会保留。',
      )
    )
      return
    setTemporary((current) => {
      const next = { ...current }
      delete next[id]
      return next
    })
  }

  if (!activeToolId && !isSettings)
    return <Navigate replace to={getToolRoutePath(DEFAULT_TOOL_ID)} />

  return (
    <ToolSessionActions.Provider value={{ openTemporarySession }}>
      <ToolWorkspaceShell
        activeToolId={activeToolId ?? undefined}
        pageTitle={isSettings ? '设置' : undefined}
      >
        {isSettings && <SettingsPage />}
        {toolRoutes.flatMap(({ id, Component, preserveActivity }) => {
          const regular = normal[id]
          if (!regular) return []
          return [regular, temporary[id]]
            .filter((session): session is ToolSession => Boolean(session))
            .map((session) => {
              const visible =
                activeToolId === id && (temporary[id] ?? regular) === session
              if (!visible && !preserveActivity && !session.temporary)
                return null
              return (
                <Activity
                  key={session.id}
                  name={`tool-${id}-${session.temporary ? 'temporary' : 'normal'}`}
                  mode={visible ? 'visible' : 'hidden'}
                >
                  <ToolSessionContext.Provider value={session}>
                    {supportsToolSession(id) && (
                      <ToolSessionToolbar
                        session={session}
                        onStart={(values) => openTemporarySession(id, values)}
                        onEnd={() => endTemporarySession(id)}
                      />
                    )}
                    <Component />
                  </ToolSessionContext.Provider>
                </Activity>
              )
            })
        })}
      </ToolWorkspaceShell>
    </ToolSessionActions.Provider>
  )
}
