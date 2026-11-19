import {
  Activity,
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { Navigate, useNavigate, useParams } from 'react-router'
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
import { createToolSession, type ToolSession } from '@/lib/tool-sessions'

const SettingsPage = lazy(() =>
  import('@/components/tool/settings').then((module) => ({
    default: module.SettingsPage,
  })),
)

export function ToolActivityOutlet() {
  const { toolId } = useParams<{ toolId: string }>()
  const navigate = useNavigate()
  const isSettings = toolId === 'settings.html'
  const activeToolId = parseToolRouteParam(toolId)
  const [normal, setNormal] = useState<Record<string, ToolSession>>(() =>
    activeToolId ? { [activeToolId]: createToolSession(activeToolId) } : {},
  )
  const [temporary, setTemporary] = useState<Record<string, ToolSession>>({})
  // openTemporarySession 走 ref 读取最新临时会话，保持回调与 context 值稳定。
  const temporaryRef = useRef(temporary)
  temporaryRef.current = temporary

  useEffect(() => {
    if (!activeToolId) return
    setNormal((current) =>
      current[activeToolId]
        ? current
        : { ...current, [activeToolId]: createToolSession(activeToolId) },
    )
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

  const openTemporarySession = useCallback(
    (id: string, values: Record<string, unknown> = {}) => {
      if (!supportsToolSession(id)) return
      if (
        temporaryRef.current[id] &&
        !window.confirm(
          '替换现有临时内容？未保存的修改会丢弃，普通草稿会保留。',
        )
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
    },
    [navigate],
  )

  const sessionActions = useMemo(
    () => ({ openTemporarySession }),
    [openTemporarySession],
  )

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
    <ToolSessionActions.Provider value={sessionActions}>
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
