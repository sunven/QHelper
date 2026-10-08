import { useEffect, useMemo, useRef, useState } from 'react'
import {
  useCurrentToolSession,
  useSessionState,
} from '@/components/tool/ToolSessionContext'
import {
  createMemoryFileHandleStore,
  getDefaultFileHandleStore,
} from '@/lib/text-preview/fileHandleStore'
import type {
  FileHandleStore,
  LocalFileAccess,
} from '@/lib/text-preview/fileSystemAccessTypes'
import { getDefaultLocalFileAccess } from '@/lib/text-preview/localFile'
import {
  addWorkspaceTab,
  closeWorkspaceTab,
  createInitialWorkspace,
  getActiveTab,
  renameWorkspaceTab,
  selectWorkspaceTab,
  updateWorkspaceTabInput,
} from '@/lib/text-preview/workspace'
import {
  createWorkspacePersistence,
  type WorkspacePersistence,
} from '@/lib/text-preview/workspacePersistence'
import {
  createWorkspaceSession,
  type SaveAllWorkspaceFilesSummary,
  type WorkspaceSessionStateStore,
} from '@/lib/text-preview/workspaceSession'

type WorkspaceControllerServices = {
  fileAccess: LocalFileAccess
  handleStore: FileHandleStore
  persistence: WorkspacePersistence
}

export function useWorkspaceController(
  servicesOverride?: Partial<WorkspaceControllerServices>,
) {
  const toolSession = useCurrentToolSession()
  const [services] = useState<WorkspaceControllerServices>(() => {
    const baseHandles =
      servicesOverride?.handleStore ??
      (toolSession?.temporary
        ? createMemoryFileHandleStore()
        : getDefaultFileHandleStore())
    const run = toolSession?.storage.run
    const handleStore = run
      ? {
          ...baseHandles,
          put: (
            fileId: string,
            handle: Parameters<FileHandleStore['put']>[1],
          ) =>
            run(() => baseHandles.put(fileId, handle)).catch(() => ({
              ok: false,
              warning: '本机数据已清理，文件授权未保存。',
            })),
        }
      : baseHandles
    const basePersistence =
      servicesOverride?.persistence ??
      createWorkspacePersistence({ handleStore })
    const persistence: WorkspacePersistence = toolSession?.temporary
      ? {
          loadWorkspaceData: async () => ({
            state:
              (toolSession.values.workspace as ReturnType<
                typeof createInitialWorkspace
              >) ?? createInitialWorkspace(),
          }),
          saveWorkspaceData: (state) => {
            toolSession.values.workspace = state
            return { ok: true }
          },
          clearWorkspaceData: async () => {
            delete toolSession.values.workspace
            return handleStore.clear()
          },
        }
      : run
        ? {
            loadWorkspaceData: () =>
              run(() => basePersistence.loadWorkspaceData()),
            saveWorkspaceData: (state) =>
              run(async () => basePersistence.saveWorkspaceData(state)),
            clearWorkspaceData: () =>
              run(() => basePersistence.clearWorkspaceData()),
          }
        : basePersistence
    return {
      handleStore,
      persistence,
      fileAccess: servicesOverride?.fileAccess ?? getDefaultLocalFileAccess(),
    }
  })
  const [workspace, setWorkspaceState] = useSessionState('workspace', () =>
    createInitialWorkspace(),
  )
  const workspaceRef = useRef(workspace)
  workspaceRef.current = workspace
  const stateStore = useMemo<WorkspaceSessionStateStore>(
    () => ({
      getWorkspace() {
        return workspaceRef.current
      },
      updateWorkspace(updater) {
        setWorkspaceState((current) => {
          const next = updater(current)
          workspaceRef.current = next
          return next
        })
      },
    }),
    [setWorkspaceState],
  )
  const [session] = useState(() =>
    createWorkspaceSession({
      ...services,
      stateStore,
    }),
  )
  const [workspaceWarning, setWorkspaceWarning] = useState('')
  const [liveMessage, setLiveMessage] = useState('')
  const [hasLoaded, setHasLoaded] = useState(false)

  const activeTab = getActiveTab(workspace)
  const fileAccessSupported = services.fileAccess.isSupported()

  useEffect(() => {
    let cancelled = false

    async function loadInitialWorkspace() {
      const result = await session
        .loadInitialWorkspace({
          shouldApply: () => !cancelled,
        })
        .catch(() => ({
          state: createInitialWorkspace(),
          warning: '工作区读取失败，请重新打开工具。',
        }))
      if (cancelled) {
        return
      }
      setWorkspaceWarning(result.warning ?? '')
      setHasLoaded(true)
    }

    void loadInitialWorkspace()

    return () => {
      cancelled = true
    }
  }, [session])

  useEffect(() => {
    if (!hasLoaded) {
      return
    }

    let active = true
    void Promise.resolve(session.saveWorkspaceData(workspace))
      .then((result) => {
        if (active && !result.ok) setWorkspaceWarning(result.warning ?? '')
      })
      .catch(() => {
        if (active)
          setWorkspaceWarning('本机保存失败，数据可能已被其他页面清理。')
      })
    return () => {
      active = false
    }
  }, [hasLoaded, session, workspace])

  const actions = {
    addTab() {
      stateStore.updateWorkspace((state) => addWorkspaceTab(state))
      setLiveMessage('已新建标签。')
    },

    selectTab(tabId: string) {
      stateStore.updateWorkspace((state) => selectWorkspaceTab(state, tabId))
    },

    updateActiveInput(input: string) {
      stateStore.updateWorkspace((state) =>
        updateWorkspaceTabInput(state, getActiveTab(state).id, input),
      )
    },

    renameTab(tabId: string, title: string) {
      stateStore.updateWorkspace((state) =>
        renameWorkspaceTab(state, tabId, title),
      )
    },

    closeTab(tabId: string) {
      stateStore.updateWorkspace((state) => closeWorkspaceTab(state, tabId))
      setLiveMessage('已删除标签。')
    },

    async clearWorkspace() {
      try {
        const result = await session.clearWorkspace()
        setWorkspaceWarning(result.warning ?? '')
        setLiveMessage(
          result.ok
            ? toolSession?.temporary
              ? '已清空临时内容和临时文件授权。'
              : '已清空本机保存内容和文件授权。'
            : '已清空本机保存内容，但文件授权清理失败。',
        )
      } catch {
        setWorkspaceWarning('本机清理失败，请重试。')
      }
    },

    async openFiles() {
      const result = await session.openFiles()
      if (result.kind === 'unsupported') {
        setWorkspaceWarning(
          '当前浏览器不支持打开并保存本地文件。请使用 Chrome 或 Edge。',
        )
        return
      }
      if (result.kind === 'cancelled') {
        return
      }

      const warnings = [
        ...result.handleWarnings,
        ...result.rejected.map((rejected) =>
          rejected.reason === 'too-large'
            ? `${rejected.name} 超过 1MB，未打开。`
            : `${rejected.name} 读取失败，未打开。`,
        ),
      ]

      if (result.openedCount > 0) {
        setLiveMessage(`已打开 ${result.openedCount} 个文件。`)
      }

      setWorkspaceWarning(warnings.join(' '))
    },

    async saveActiveFile(force = false) {
      const result = await session.saveActiveFile(force)
      if (result.kind === 'saved') {
        setLiveMessage('已保存当前文件。')
      }
    },

    async saveAllFiles() {
      const summary = await session.saveAllFiles()
      const message = formatSaveAllSummary(summary)
      setLiveMessage(message)
      setWorkspaceWarning(message)
    },

    async reloadActiveFile() {
      const result = await session.reloadActiveFile({
        tooLargeMessage: () => '文件超过 1MB，未重新载入。',
      })
      if (result.kind === 'reloaded') {
        setLiveMessage('已重新载入本地文件。')
        return
      }

      if (result.kind === 'too-large' || result.kind === 'failed') {
        setWorkspaceWarning(
          result.kind === 'too-large'
            ? '文件超过 1MB，未重新载入。'
            : result.message,
        )
      }
    },

    downloadActiveFileCopy() {
      session.downloadActiveFileCopy()
    },
  }

  return {
    actions,
    activeTab,
    fileAccessSupported,
    liveMessage,
    setLiveMessage,
    workspace,
    workspaceWarning,
  }
}

function formatSaveAllSummary(summary: SaveAllWorkspaceFilesSummary) {
  const parts: string[] = []

  if (summary.saved.length > 0) {
    parts.push(`已保存 ${summary.saved.length} 个`)
  }
  if (summary.skippedClean.length > 0) {
    parts.push(`${summary.skippedClean.length} 个无需保存`)
  }
  if (summary.conflicts.length > 0) {
    parts.push(`${summary.conflicts.length} 个存在冲突`)
  }
  if (summary.permissionNeeded.length > 0) {
    parts.push(`${summary.permissionNeeded.length} 个需要重新授权`)
  }
  if (summary.handleMissing.length > 0) {
    parts.push(`${summary.handleMissing.length} 个需要重新打开`)
  }
  if (summary.failed.length > 0) {
    parts.push(`${summary.failed.length} 个保存失败`)
  }

  return parts.length > 0 ? `${parts.join('，')}。` : '没有需要保存的文件。'
}
