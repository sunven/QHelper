import { useEffect, useRef, useState } from 'react'
import type {
  FileHandleStore,
  LocalFileAccess,
  TextPreviewFileSystemFileHandle,
} from '@/lib/text-preview/fileSystemAccessTypes'
import { getDefaultFileHandleStore } from '@/lib/text-preview/fileHandleStore'
import { getDefaultLocalFileAccess } from '@/lib/text-preview/localFile'
import {
  addFileBackedWorkspaceTabs,
  addWorkspaceTab,
  closeWorkspaceTab,
  createInitialWorkspace,
  getActiveTab,
  markWorkspaceTabConflict,
  markWorkspaceTabHandleMissing,
  markWorkspaceTabPermissionNeeded,
  markWorkspaceTabSaved,
  markWorkspaceTabSaveFailed,
  markWorkspaceTabSaving,
  reloadFileBackedWorkspaceTab,
  renameWorkspaceTab,
  selectWorkspaceTab,
  updateWorkspaceTabInput,
  type FileBackedTabInput,
  type WorkspaceTab,
} from '@/lib/text-preview/workspace'
import {
  createWorkspacePersistence,
  type WorkspacePersistence,
} from '@/lib/text-preview/workspacePersistence'

type SaveAllSummary = {
  conflicts: string[]
  failed: string[]
  handleMissing: string[]
  permissionNeeded: string[]
  saved: string[]
  skippedClean: string[]
}

type WorkspaceControllerServices = {
  fileAccess: LocalFileAccess
  handleStore: FileHandleStore
  persistence: WorkspacePersistence
}

export function useWorkspaceController(
  servicesOverride?: Partial<WorkspaceControllerServices>,
) {
  const [services] = useState<WorkspaceControllerServices>(() => {
    const handleStore =
      servicesOverride?.handleStore ?? getDefaultFileHandleStore()
    return {
      handleStore,
      fileAccess: servicesOverride?.fileAccess ?? getDefaultLocalFileAccess(),
      persistence:
        servicesOverride?.persistence ??
        createWorkspacePersistence({ handleStore }),
    }
  })
  const [workspace, setWorkspace] = useState(() => createInitialWorkspace())
  const [workspaceWarning, setWorkspaceWarning] = useState('')
  const [liveMessage, setLiveMessage] = useState('')
  const [hasLoaded, setHasLoaded] = useState(false)
  const sessionHandlesRef = useRef(
    new Map<string, TextPreviewFileSystemFileHandle>(),
  )

  const activeTab = getActiveTab(workspace)
  const fileAccessSupported = services.fileAccess.isSupported()

  useEffect(() => {
    let cancelled = false

    async function loadInitialWorkspace() {
      const result = await services.persistence.loadWorkspaceData()
      if (cancelled) {
        return
      }
      setWorkspace(result.state)
      setWorkspaceWarning(result.warning ?? '')
      setHasLoaded(true)
    }

    void loadInitialWorkspace()

    return () => {
      cancelled = true
    }
  }, [services.persistence])

  useEffect(() => {
    if (!hasLoaded) {
      return
    }

    const result = services.persistence.saveWorkspaceData(workspace)
    if (!result.ok) {
      window.setTimeout(() => setWorkspaceWarning(result.warning ?? ''), 0)
    }
  }, [hasLoaded, services.persistence, workspace])

  async function getHandle(fileId: string) {
    const sessionHandle = sessionHandlesRef.current.get(fileId)
    if (sessionHandle) {
      return sessionHandle
    }

    const storedHandle = await services.handleStore.get(fileId)
    if (storedHandle) {
      sessionHandlesRef.current.set(fileId, storedHandle)
    }
    return storedHandle
  }

  async function saveFileTab(tab: WorkspaceTab, force: boolean) {
    if (tab.source.kind !== 'local-file') {
      return 'skipped'
    }

    const handle = await getHandle(tab.source.fileId)
    if (!handle) {
      setWorkspace((state) => markWorkspaceTabHandleMissing(state, tab.id))
      return 'handle-missing'
    }

    const textToSave = tab.input
    setWorkspace((state) => markWorkspaceTabSaving(state, tab.id))
    const result = await services.fileAccess.saveTextFile({
      force,
      handle,
      text: textToSave,
      expectedSignature: tab.source.lastKnownSignature,
    })

    if (result.kind === 'saved') {
      setWorkspace((state) => {
        const currentTab = state.tabs.find((candidate) => candidate.id === tab.id)
        const saved = markWorkspaceTabSaved(state, tab.id, result.signature)
        if (currentTab && currentTab.input !== textToSave) {
          return updateWorkspaceTabInput(saved, tab.id, currentTab.input)
        }
        return saved
      })
      return 'saved'
    }

    if (result.kind === 'conflict') {
      setWorkspace((state) =>
        markWorkspaceTabConflict(state, tab.id, result.diskSignature),
      )
      return 'conflict'
    }

    if (result.kind === 'permission-needed') {
      setWorkspace((state) => markWorkspaceTabPermissionNeeded(state, tab.id))
      return 'permission-needed'
    }

    setWorkspace((state) =>
      markWorkspaceTabSaveFailed(state, tab.id, result.message),
    )
    return 'failed'
  }

  const actions = {
    addTab() {
      setWorkspace((state) => addWorkspaceTab(state))
      setLiveMessage('已新建标签。')
    },

    selectTab(tabId: string) {
      setWorkspace((state) => selectWorkspaceTab(state, tabId))
    },

    updateActiveInput(input: string) {
      setWorkspace((state) =>
        updateWorkspaceTabInput(state, getActiveTab(state).id, input),
      )
    },

    renameTab(tabId: string, title: string) {
      setWorkspace((state) => renameWorkspaceTab(state, tabId, title))
    },

    closeTab(tabId: string) {
      setWorkspace((state) => closeWorkspaceTab(state, tabId))
      setLiveMessage('已删除标签。')
    },

    async clearWorkspace() {
      const result = await services.persistence.clearWorkspaceData()
      setWorkspace(createInitialWorkspace())
      setWorkspaceWarning(result.warning ?? '')
      sessionHandlesRef.current.clear()
      setLiveMessage(
        result.ok
          ? '已清空本机保存内容和文件授权。'
          : '已清空本机保存内容，但文件授权清理失败。',
      )
    },

    async openFiles() {
      if (!services.fileAccess.isSupported()) {
        setWorkspaceWarning(
          '当前浏览器不支持打开并保存本地文件。请使用 Chrome 或 Edge。',
        )
        return
      }

      const result = await services.fileAccess.openTextFiles()
      if (result.cancelled) {
        return
      }

      const filesToAdd: FileBackedTabInput[] = []
      const warnings: string[] = []

      for (const file of result.files) {
        const storeResult = await services.handleStore.put(
          file.fileId,
          file.handle,
        )
        sessionHandlesRef.current.set(file.fileId, file.handle)
        if (!storeResult.ok && storeResult.warning) {
          warnings.push(storeResult.warning)
        }
        filesToAdd.push({
          fileId: file.fileId,
          input: file.text,
          name: file.name,
          signature: file.signature,
        })
      }

      for (const rejected of result.rejected) {
        if (rejected.reason === 'too-large') {
          warnings.push(`${rejected.name} 超过 1MB，未打开。`)
        } else {
          warnings.push(`${rejected.name} 读取失败，未打开。`)
        }
      }

      if (filesToAdd.length > 0) {
        setWorkspace((state) => addFileBackedWorkspaceTabs(state, filesToAdd))
        setLiveMessage(`已打开 ${filesToAdd.length} 个文件。`)
      }

      setWorkspaceWarning(warnings.join(' '))
    },

    async saveActiveFile(force = false) {
      const tab = getActiveTab(workspace)
      const result = await saveFileTab(tab, force)
      if (result === 'saved') {
        setLiveMessage('已保存当前文件。')
      }
    },

    async saveAllFiles() {
      const summary: SaveAllSummary = {
        conflicts: [],
        failed: [],
        handleMissing: [],
        permissionNeeded: [],
        saved: [],
        skippedClean: [],
      }

      for (const tab of workspace.tabs) {
        if (tab.source.kind !== 'local-file') {
          continue
        }
        if (tab.fileStatus.kind === 'clean') {
          summary.skippedClean.push(tab.source.name)
          continue
        }
        if (tab.fileStatus.kind === 'conflict') {
          summary.conflicts.push(tab.source.name)
          continue
        }

        const result = await saveFileTab(tab, false)
        if (result === 'saved') {
          summary.saved.push(tab.source.name)
        }
        if (result === 'permission-needed') {
          summary.permissionNeeded.push(tab.source.name)
        }
        if (result === 'handle-missing') {
          summary.handleMissing.push(tab.source.name)
        }
        if (result === 'conflict') {
          summary.conflicts.push(tab.source.name)
        }
        if (result === 'failed') {
          summary.failed.push(tab.source.name)
        }
      }

      const message = formatSaveAllSummary(summary)
      setLiveMessage(message)
      setWorkspaceWarning(message)
    },

    async reloadActiveFile() {
      const tab = getActiveTab(workspace)
      if (tab.source.kind !== 'local-file') {
        return
      }

      const handle = await getHandle(tab.source.fileId)
      if (!handle) {
        setWorkspace((state) => markWorkspaceTabHandleMissing(state, tab.id))
        return
      }

      const result = await services.fileAccess.reloadTextFile(handle)
      if (result.kind === 'reloaded') {
        setWorkspace((state) =>
          reloadFileBackedWorkspaceTab(
            state,
            tab.id,
            result.text,
            result.signature,
          ),
        )
        setLiveMessage('已重新载入本地文件。')
        return
      }

      const message =
        result.kind === 'too-large' ? '文件超过 1MB，未重新载入。' : result.message
      setWorkspace((state) =>
        markWorkspaceTabSaveFailed(state, tab.id, message),
      )
      setWorkspaceWarning(message)
    },

    downloadActiveFileCopy() {
      const tab = getActiveTab(workspace)
      const name =
        tab.source.kind === 'local-file' ? tab.source.name : `${tab.title}.txt`
      services.fileAccess.createDownloadFallback(name, tab.input)
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

function formatSaveAllSummary(summary: SaveAllSummary) {
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
