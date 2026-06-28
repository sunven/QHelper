import type {
  FileHandleStore,
  LocalFileAccess,
  RejectedTextFile,
  TextPreviewFileSystemFileHandle,
} from './fileSystemAccessTypes'
import {
  addFileBackedWorkspaceTabs,
  createInitialWorkspace,
  getActiveTab,
  markWorkspaceTabConflict,
  markWorkspaceTabHandleMissing,
  markWorkspaceTabPermissionNeeded,
  markWorkspaceTabSaved,
  markWorkspaceTabSaveFailed,
  markWorkspaceTabSaving,
  reloadFileBackedWorkspaceTab,
  updateWorkspaceTabInput,
  type FileBackedTabInput,
  type WorkspaceState,
  type WorkspaceTab,
} from './workspace'
import type {
  WorkspaceClearResult,
  WorkspacePersistence,
} from './workspacePersistence'
import type { WorkspaceLoadResult } from './workspaceStore'

export type WorkspaceSessionStateStore = {
  getWorkspace: () => WorkspaceState
  updateWorkspace: (
    updater: (workspace: WorkspaceState) => WorkspaceState,
  ) => void
}

export type WorkspaceSessionOptions = {
  fileAccess: LocalFileAccess
  handleStore: FileHandleStore
  persistence: WorkspacePersistence
  stateStore: WorkspaceSessionStateStore
}

export type LoadInitialWorkspaceOptions = {
  shouldApply?: () => boolean
}

export type OpenWorkspaceFilesResult =
  | { kind: 'cancelled' }
  | {
      handleWarnings: string[]
      kind: 'opened'
      openedCount: number
      rejected: RejectedTextFile[]
    }
  | { kind: 'unsupported' }

export type SaveWorkspaceFileResult =
  | { kind: 'conflict'; tabName: string }
  | { kind: 'failed'; message: string; tabName: string }
  | { kind: 'handle-missing'; tabName: string }
  | { kind: 'permission-needed'; tabName: string }
  | { kind: 'saved'; tabName: string }
  | { kind: 'skipped' }

export type SaveAllWorkspaceFilesSummary = {
  conflicts: string[]
  failed: string[]
  handleMissing: string[]
  permissionNeeded: string[]
  saved: string[]
  skippedClean: string[]
}

export type ReloadWorkspaceFileResult =
  | { kind: 'failed'; message: string; tabName: string }
  | { kind: 'handle-missing'; tabName: string }
  | { kind: 'reloaded'; tabName: string }
  | { kind: 'skipped' }
  | { kind: 'too-large'; size: number; tabName: string }

export type ReloadWorkspaceFileOptions = {
  tooLargeMessage?: (size: number) => string
}

export function createWorkspaceSession(options: WorkspaceSessionOptions) {
  const sessionHandles = new Map<string, TextPreviewFileSystemFileHandle>()
  const { fileAccess, handleStore, persistence, stateStore } = options

  async function loadInitialWorkspace(
    loadOptions: LoadInitialWorkspaceOptions = {},
  ): Promise<WorkspaceLoadResult> {
    const result = await persistence.loadWorkspaceData()
    if (loadOptions.shouldApply?.() ?? true) {
      stateStore.updateWorkspace(() => result.state)
    }
    return result
  }

  function saveWorkspaceData(state: WorkspaceState) {
    return persistence.saveWorkspaceData(state)
  }

  async function getHandle(fileId: string) {
    const sessionHandle = sessionHandles.get(fileId)
    if (sessionHandle) {
      return sessionHandle
    }

    const storedHandle = await handleStore.get(fileId)
    if (storedHandle) {
      sessionHandles.set(fileId, storedHandle)
    }
    return storedHandle
  }

  async function clearWorkspace(): Promise<WorkspaceClearResult> {
    const result = await persistence.clearWorkspaceData()
    sessionHandles.clear()
    stateStore.updateWorkspace(() => createInitialWorkspace())
    return result
  }

  async function openFiles(): Promise<OpenWorkspaceFilesResult> {
    if (!fileAccess.isSupported()) {
      return { kind: 'unsupported' }
    }

    const result = await fileAccess.openTextFiles()
    if (result.cancelled) {
      return { kind: 'cancelled' }
    }

    const filesToAdd: FileBackedTabInput[] = []
    const handleWarnings: string[] = []

    for (const file of result.files) {
      const storeResult = await handleStore.put(file.fileId, file.handle)
      sessionHandles.set(file.fileId, file.handle)
      if (!storeResult.ok && storeResult.warning) {
        handleWarnings.push(storeResult.warning)
      }
      filesToAdd.push({
        fileId: file.fileId,
        input: file.text,
        name: file.name,
        signature: file.signature,
      })
    }

    if (filesToAdd.length > 0) {
      stateStore.updateWorkspace((state) =>
        addFileBackedWorkspaceTabs(state, filesToAdd),
      )
    }

    return {
      handleWarnings,
      kind: 'opened',
      openedCount: filesToAdd.length,
      rejected: result.rejected,
    }
  }

  async function saveActiveFile(force = false) {
    const tab = getActiveTab(stateStore.getWorkspace())
    return saveFileTab(tab, force)
  }

  async function saveFileTab(
    tab: WorkspaceTab,
    force = false,
  ): Promise<SaveWorkspaceFileResult> {
    if (tab.source.kind !== 'local-file') {
      return { kind: 'skipped' }
    }

    const tabName = tab.source.name
    const handle = await getHandle(tab.source.fileId)
    if (!handle) {
      stateStore.updateWorkspace((state) =>
        markWorkspaceTabHandleMissing(state, tab.id),
      )
      return { kind: 'handle-missing', tabName }
    }

    const textToSave = tab.input
    stateStore.updateWorkspace((state) => markWorkspaceTabSaving(state, tab.id))
    const result = await fileAccess.saveTextFile({
      expectedSignature: tab.source.lastKnownSignature,
      force,
      handle,
      text: textToSave,
    })

    if (result.kind === 'saved') {
      stateStore.updateWorkspace((state) => {
        const currentTab = state.tabs.find((candidate) => candidate.id === tab.id)
        const saved = markWorkspaceTabSaved(state, tab.id, result.signature)
        if (currentTab && currentTab.input !== textToSave) {
          return updateWorkspaceTabInput(saved, tab.id, currentTab.input)
        }
        return saved
      })
      return { kind: 'saved', tabName }
    }

    if (result.kind === 'conflict') {
      stateStore.updateWorkspace((state) =>
        markWorkspaceTabConflict(state, tab.id, result.diskSignature),
      )
      return { kind: 'conflict', tabName }
    }

    if (result.kind === 'permission-needed') {
      stateStore.updateWorkspace((state) =>
        markWorkspaceTabPermissionNeeded(state, tab.id),
      )
      return { kind: 'permission-needed', tabName }
    }

    stateStore.updateWorkspace((state) =>
      markWorkspaceTabSaveFailed(state, tab.id, result.message),
    )
    return { kind: 'failed', message: result.message, tabName }
  }

  async function saveAllFiles(): Promise<SaveAllWorkspaceFilesSummary> {
    const summary: SaveAllWorkspaceFilesSummary = {
      conflicts: [],
      failed: [],
      handleMissing: [],
      permissionNeeded: [],
      saved: [],
      skippedClean: [],
    }

    for (const tab of stateStore.getWorkspace().tabs) {
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
      if (result.kind === 'saved') {
        summary.saved.push(tab.source.name)
      }
      if (result.kind === 'permission-needed') {
        summary.permissionNeeded.push(tab.source.name)
      }
      if (result.kind === 'handle-missing') {
        summary.handleMissing.push(tab.source.name)
      }
      if (result.kind === 'conflict') {
        summary.conflicts.push(tab.source.name)
      }
      if (result.kind === 'failed') {
        summary.failed.push(tab.source.name)
      }
    }

    return summary
  }

  async function reloadActiveFile(
    reloadOptions: ReloadWorkspaceFileOptions = {},
  ): Promise<ReloadWorkspaceFileResult> {
    const tab = getActiveTab(stateStore.getWorkspace())
    if (tab.source.kind !== 'local-file') {
      return { kind: 'skipped' }
    }

    const tabName = tab.source.name
    const handle = await getHandle(tab.source.fileId)
    if (!handle) {
      stateStore.updateWorkspace((state) =>
        markWorkspaceTabHandleMissing(state, tab.id),
      )
      return { kind: 'handle-missing', tabName }
    }

    const result = await fileAccess.reloadTextFile(handle)
    if (result.kind === 'reloaded') {
      stateStore.updateWorkspace((state) =>
        reloadFileBackedWorkspaceTab(
          state,
          tab.id,
          result.text,
          result.signature,
        ),
      )
      return { kind: 'reloaded', tabName }
    }

    if (result.kind === 'too-large') {
      const message = reloadOptions.tooLargeMessage?.(result.size)
      if (message) {
        stateStore.updateWorkspace((state) =>
          markWorkspaceTabSaveFailed(state, tab.id, message),
        )
      }
      return { kind: 'too-large', size: result.size, tabName }
    }

    stateStore.updateWorkspace((state) =>
      markWorkspaceTabSaveFailed(state, tab.id, result.message),
    )
    return { kind: 'failed', message: result.message, tabName }
  }

  function downloadActiveFileCopy() {
    const tab = getActiveTab(stateStore.getWorkspace())
    const name =
      tab.source.kind === 'local-file' ? tab.source.name : `${tab.title}.txt`
    fileAccess.createDownloadFallback(name, tab.input)
  }

  return {
    clearWorkspace,
    downloadActiveFileCopy,
    loadInitialWorkspace,
    openFiles,
    reloadActiveFile,
    saveActiveFile,
    saveAllFiles,
    saveFileTab,
    saveWorkspaceData,
  }
}
