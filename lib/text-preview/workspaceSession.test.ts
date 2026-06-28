import { describe, expect, it } from 'vitest'
import type {
  FileHandleStore,
  LocalFileAccess,
  OpenTextFilesResult,
  ReloadTextFileResult,
  SaveTextFileRequest,
  SaveTextFileResult,
  TextPreviewFileSystemFileHandle,
} from './fileSystemAccessTypes'
import {
  addFileBackedWorkspaceTabs,
  createInitialWorkspace,
  markWorkspaceTabConflict,
  updateWorkspaceTabInput,
  type FileSignature,
  type WorkspaceState,
} from './workspace'
import {
  createWorkspaceSession,
  type WorkspaceSessionStateStore,
} from './workspaceSession'
import type { WorkspacePersistence } from './workspacePersistence'
import {
  createWorkspacePersistence,
} from './workspacePersistence'
import { saveWorkspace } from './workspaceStore'

describe('workspaceSession', () => {
  it('loads persisted workspace data through the workspace seam', async () => {
    const storage = new MemoryStorage()
    const persisted = createFileWorkspace()
    saveWorkspace(persisted, storage)
    const stateStore = createStateStore()
    const session = createWorkspaceSession({
      ...createServices({
        persistence: createWorkspacePersistence({
          handleStore: createHandleStore(),
          storage,
        }),
      }),
      stateStore,
    })

    const result = await session.loadInitialWorkspace()

    expect(result.warning).toContain('需要重新打开 hosts.txt')
    expect(stateStore.getWorkspace().tabs[1].fileStatus).toEqual({
      kind: 'handle-missing',
    })
  })

  it('can skip applying loaded workspace data when the caller is cancelled', async () => {
    const stateStore = createStateStore()
    const session = createWorkspaceSession({
      ...createServices({
        persistence: {
          async clearWorkspaceData() {
            return { ok: true }
          },
          async loadWorkspaceData() {
            return {
              state: updateWorkspaceTabInput(
                createInitialWorkspace({ makeId: ids('loaded-tab') }),
                'loaded-tab',
                'loaded text',
              ),
            }
          },
          saveWorkspaceData() {
            return { ok: true }
          },
        },
      }),
      stateStore,
    })

    const result = await session.loadInitialWorkspace({
      shouldApply: () => false,
    })

    expect(result.state.tabs[0].input).toBe('loaded text')
    expect(stateStore.getWorkspace().tabs[0].input).toBe('')
  })

  it('opens files, stores their handles, and adds file-backed tabs', async () => {
    const handle = fakeHandle('hosts.txt')
    const handleStore = createHandleStore()
    const stateStore = createStateStore()
    const session = createWorkspaceSession({
      ...createServices({
        fileAccess: createFileAccess({
          openTextFiles: async () => ({
            cancelled: false,
            files: [
              {
                fileId: 'file-a',
                handle,
                name: 'hosts.txt',
                signature: signature('hash-a'),
                text: '10.0.0.1',
              },
            ],
            rejected: [],
          }),
        }),
        handleStore,
      }),
      stateStore,
    })

    const result = await session.openFiles()

    expect(result).toEqual({
      handleWarnings: [],
      kind: 'opened',
      openedCount: 1,
      rejected: [],
    })
    expect(stateStore.getWorkspace().tabs[1]).toMatchObject({
      input: '10.0.0.1',
      source: {
        fileId: 'file-a',
        kind: 'local-file',
        name: 'hosts.txt',
      },
      title: 'hosts.txt',
    })
    await expect(handleStore.get('file-a')).resolves.toBe(handle)
  })

  it('keeps opened tabs when handle persistence or file reads return warnings', async () => {
    const handle = fakeHandle('notes.md')
    const stateStore = createStateStore()
    const session = createWorkspaceSession({
      ...createServices({
        fileAccess: createFileAccess({
          openTextFiles: async () => ({
            cancelled: false,
            files: [
              {
                fileId: 'file-a',
                handle,
                name: 'notes.md',
                signature: signature('hash-a'),
                text: '# title',
              },
            ],
            rejected: [
              { name: 'huge.log', reason: 'too-large', size: 2_000_000 },
              { name: 'broken.txt', reason: 'read-failed' },
            ],
          }),
        }),
        handleStore: createHandleStore({
          putResult: { ok: false, warning: 'handle store failed' },
        }),
      }),
      stateStore,
    })

    const result = await session.openFiles()

    expect(result).toEqual({
      handleWarnings: ['handle store failed'],
      kind: 'opened',
      openedCount: 1,
      rejected: [
        { name: 'huge.log', reason: 'too-large', size: 2_000_000 },
        { name: 'broken.txt', reason: 'read-failed' },
      ],
    })
    expect(stateStore.getWorkspace().tabs[1].title).toBe('notes.md')
  })

  it('marks a dirty file-backed tab clean after saving', async () => {
    const handle = fakeHandle('hosts.txt')
    const stateStore = createStateStore(
      updateWorkspaceTabInput(createFileWorkspace(), 'tab-b', '10.0.0.2'),
    )
    const session = createWorkspaceSession({
      ...createServices({
        fileAccess: createFileAccess({
          saveTextFile: async (request) => {
            expect(request.text).toBe('10.0.0.2')
            expect(request.expectedSignature).toEqual(signature('hash-a'))
            return { kind: 'saved', signature: signature('hash-saved') }
          },
        }),
        handleStore: createHandleStore({ initialValues: { 'file-a': handle } }),
      }),
      stateStore,
    })

    const result = await session.saveActiveFile()

    expect(result).toEqual({ kind: 'saved', tabName: 'hosts.txt' })
    expect(stateStore.getWorkspace().tabs[1]).toMatchObject({
      fileStatus: { kind: 'clean' },
      source: {
        kind: 'local-file',
        lastKnownSignature: signature('hash-saved'),
      },
    })
  })

  it('preserves edits made while a save is in flight', async () => {
    let resolveSave:
      | ((result: Extract<SaveTextFileResult, { kind: 'saved' }>) => void)
      | undefined
    let markSaveStarted: (() => void) | undefined
    const saveStarted = new Promise<void>((resolve) => {
      markSaveStarted = resolve
    })
    const stateStore = createStateStore(
      updateWorkspaceTabInput(createFileWorkspace(), 'tab-b', 'first edit'),
    )
    const session = createWorkspaceSession({
      ...createServices({
        fileAccess: createFileAccess({
          saveTextFile: () =>
            new Promise((resolve) => {
              markSaveStarted?.()
              resolveSave = resolve
            }),
        }),
        handleStore: createHandleStore({
          initialValues: { 'file-a': fakeHandle('hosts.txt') },
        }),
      }),
      stateStore,
    })

    const save = session.saveActiveFile()
    await saveStarted
    stateStore.updateWorkspace((state) =>
      updateWorkspaceTabInput(state, 'tab-b', 'second edit'),
    )
    resolveSave?.({ kind: 'saved', signature: signature('hash-saved') })

    await expect(save).resolves.toEqual({
      kind: 'saved',
      tabName: 'hosts.txt',
    })
    expect(stateStore.getWorkspace().tabs[1]).toMatchObject({
      fileStatus: { kind: 'dirty' },
      input: 'second edit',
      source: {
        kind: 'local-file',
        lastKnownSignature: signature('hash-saved'),
      },
    })
  })

  it('maps save failures to file-backed tab statuses', async () => {
    const cases: Array<{
      expectedStatus: unknown
      result: SaveTextFileResult
      saveResult: unknown
    }> = [
      {
        expectedStatus: {
          diskSignature: signature('hash-disk'),
          kind: 'conflict',
        },
        result: {
          diskSignature: signature('hash-disk'),
          kind: 'conflict',
        },
        saveResult: { kind: 'conflict', tabName: 'hosts.txt' },
      },
      {
        expectedStatus: { kind: 'permission-needed' },
        result: { kind: 'permission-needed' },
        saveResult: { kind: 'permission-needed', tabName: 'hosts.txt' },
      },
      {
        expectedStatus: { kind: 'save-failed', message: 'disk failed' },
        result: { kind: 'failed', message: 'disk failed' },
        saveResult: {
          kind: 'failed',
          message: 'disk failed',
          tabName: 'hosts.txt',
        },
      },
    ]

    for (const testCase of cases) {
      const stateStore = createStateStore(
        updateWorkspaceTabInput(createFileWorkspace(), 'tab-b', 'changed'),
      )
      const session = createWorkspaceSession({
        ...createServices({
          fileAccess: createFileAccess({
            saveTextFile: async () => testCase.result,
          }),
          handleStore: createHandleStore({
            initialValues: { 'file-a': fakeHandle('hosts.txt') },
          }),
        }),
        stateStore,
      })

      await expect(session.saveActiveFile()).resolves.toEqual(
        testCase.saveResult,
      )
      expect(stateStore.getWorkspace().tabs[1].fileStatus).toEqual(
        testCase.expectedStatus,
      )
    }
  })

  it('marks a file-backed tab handle-missing when saving cannot recover the handle', async () => {
    const stateStore = createStateStore(
      updateWorkspaceTabInput(createFileWorkspace(), 'tab-b', 'changed'),
    )
    const session = createWorkspaceSession({
      ...createServices({
        handleStore: createHandleStore(),
      }),
      stateStore,
    })

    const result = await session.saveActiveFile()

    expect(result).toEqual({ kind: 'handle-missing', tabName: 'hosts.txt' })
    expect(stateStore.getWorkspace().tabs[1].fileStatus).toEqual({
      kind: 'handle-missing',
    })
  })

  it('summarizes save-all results without UI copy', async () => {
    const workspace = markWorkspaceTabConflict(
      updateWorkspaceTabInput(createMultiFileWorkspace(), 'tab-c', 'edited b'),
      'tab-d',
      signature('hash-disk'),
    )
    const stateStore = createStateStore(workspace)
    const session = createWorkspaceSession({
      ...createServices({
        fileAccess: createFileAccess({
          saveTextFile: async () => ({
            kind: 'saved',
            signature: signature('hash-saved'),
          }),
        }),
        handleStore: createHandleStore({
          initialValues: { 'file-b': fakeHandle('b.txt') },
        }),
      }),
      stateStore,
    })

    const result = await session.saveAllFiles()

    expect(result).toEqual({
      conflicts: ['c.txt'],
      failed: [],
      handleMissing: [],
      permissionNeeded: [],
      saved: ['b.txt'],
      skippedClean: ['a.txt'],
    })
  })

  it('reloads the active file-backed tab', async () => {
    const stateStore = createStateStore(
      updateWorkspaceTabInput(createFileWorkspace(), 'tab-b', 'changed'),
    )
    const session = createWorkspaceSession({
      ...createServices({
        fileAccess: createFileAccess({
          reloadTextFile: async () => ({
            kind: 'reloaded',
            signature: signature('hash-reloaded'),
            text: 'disk text',
          }),
        }),
        handleStore: createHandleStore({
          initialValues: { 'file-a': fakeHandle('hosts.txt') },
        }),
      }),
      stateStore,
    })

    const result = await session.reloadActiveFile()

    expect(result).toEqual({ kind: 'reloaded', tabName: 'hosts.txt' })
    expect(stateStore.getWorkspace().tabs[1]).toMatchObject({
      fileStatus: { kind: 'clean' },
      input: 'disk text',
      source: {
        kind: 'local-file',
        lastKnownSignature: signature('hash-reloaded'),
      },
    })
  })

  it('clears persisted workspace data and session file handles together', async () => {
    const workspace = updateWorkspaceTabInput(
      createFileWorkspace(),
      'tab-b',
      'changed',
    )
    const stateStore = createStateStore(workspace)
    const handleStore = createHandleStore({
      initialValues: { 'file-a': fakeHandle('hosts.txt') },
    })
    const session = createWorkspaceSession({
      ...createServices({ handleStore }),
      stateStore,
    })

    await expect(session.saveActiveFile()).resolves.toEqual({
      kind: 'saved',
      tabName: 'hosts.txt',
    })
    const clearResult = await session.clearWorkspace()
    const clearedWorkspace = stateStore.getWorkspace()
    stateStore.setWorkspace(workspace)
    const saveAfterClear = await session.saveActiveFile()

    expect(clearResult).toEqual({ ok: true })
    expect(clearedWorkspace.tabs).toHaveLength(1)
    expect(saveAfterClear).toEqual({
      kind: 'handle-missing',
      tabName: 'hosts.txt',
    })
  })
})

class MemoryStorage implements Storage {
  private values = new Map<string, string>()

  get length() {
    return this.values.size
  }

  clear() {
    this.values.clear()
  }

  getItem(key: string) {
    return this.values.get(key) ?? null
  }

  key(index: number) {
    return Array.from(this.values.keys())[index] ?? null
  }

  removeItem(key: string) {
    this.values.delete(key)
  }

  setItem(key: string, value: string) {
    this.values.set(key, value)
  }
}

function createFileWorkspace() {
  return addFileBackedWorkspaceTabs(
    createInitialWorkspace({ makeId: ids('tab-a'), now: 1000 }),
    [
      {
        fileId: 'file-a',
        input: '10.0.0.1',
        name: 'hosts.txt',
        signature: signature('hash-a'),
      },
    ],
    { makeId: ids('tab-b'), now: 2000 },
  )
}

function createMultiFileWorkspace() {
  return addFileBackedWorkspaceTabs(
    createInitialWorkspace({ makeId: ids('tab-a'), now: 1000 }),
    [
      {
        fileId: 'file-a',
        input: 'a',
        name: 'a.txt',
        signature: signature('hash-a'),
      },
      {
        fileId: 'file-b',
        input: 'b',
        name: 'b.txt',
        signature: signature('hash-b'),
      },
      {
        fileId: 'file-c',
        input: 'c',
        name: 'c.txt',
        signature: signature('hash-c'),
      },
    ],
    { makeId: ids('tab-b', 'tab-c', 'tab-d'), now: 2000 },
  )
}

function createStateStore(initial = createInitialWorkspace()) {
  let workspace = initial

  return {
    getWorkspace() {
      return workspace
    },
    setWorkspace(nextWorkspace: WorkspaceState) {
      workspace = nextWorkspace
    },
    updateWorkspace(updater) {
      workspace = updater(workspace)
    },
  } satisfies WorkspaceSessionStateStore & {
    setWorkspace: (nextWorkspace: WorkspaceState) => void
  }
}

function createServices(
  overrides: Partial<{
    fileAccess: LocalFileAccess
    handleStore: FileHandleStore
    persistence: WorkspacePersistence
  }> = {},
) {
  const handleStore = overrides.handleStore ?? createHandleStore()

  return {
    fileAccess: overrides.fileAccess ?? createFileAccess(),
    handleStore,
    persistence:
      overrides.persistence ?? createPersistence({ handleStore }),
  }
}

function createPersistence(options: { handleStore: FileHandleStore }) {
  const initial = createInitialWorkspace()
  let workspace = initial

  return {
    async clearWorkspaceData() {
      workspace = initial
      return options.handleStore.clear()
    },
    async loadWorkspaceData() {
      return { state: workspace }
    },
    saveWorkspaceData(state) {
      workspace = state
      return { ok: true }
    },
  } satisfies WorkspacePersistence
}

function createFileAccess(
  overrides: Partial<LocalFileAccess> = {},
): LocalFileAccess {
  return {
    createDownloadFallback() {},
    isSupported: () => true,
    openTextFiles: async (): Promise<OpenTextFilesResult> => ({
      cancelled: false,
      files: [],
      rejected: [],
    }),
    reloadTextFile: async (): Promise<ReloadTextFileResult> => ({
      kind: 'reloaded',
      signature: signature('hash-reloaded'),
      text: 'reloaded',
    }),
    saveTextFile: async (
      _request: SaveTextFileRequest,
    ): Promise<SaveTextFileResult> => ({
      kind: 'saved',
      signature: signature('hash-saved'),
    }),
    ...overrides,
  }
}

function createHandleStore(
  options: {
    initialValues?: Record<string, TextPreviewFileSystemFileHandle>
    putResult?: { ok: boolean; warning?: string }
  } = {},
) {
  const handles = new Map(Object.entries(options.initialValues ?? {}))

  return {
    async clear() {
      handles.clear()
      return { ok: true }
    },
    async delete(fileId) {
      handles.delete(fileId)
      return { ok: true }
    },
    async get(fileId) {
      return handles.get(fileId)
    },
    async put(fileId, handle) {
      handles.set(fileId, handle)
      return options.putResult ?? { ok: true }
    },
  } satisfies FileHandleStore
}

function fakeHandle(name: string): TextPreviewFileSystemFileHandle {
  return {
    kind: 'file',
    name,
    async createWritable() {
      return {
        async close() {},
        async write() {},
      }
    },
    async getFile() {
      return new File(['text'], name, { type: 'text/plain' })
    },
  }
}

function signature(contentHash: string): FileSignature {
  return {
    contentHash,
    lastModified: 100,
    size: 8,
  }
}

const ids = (...values: string[]) => {
  let index = 0
  return () => values[index++] ?? `fallback-${index}`
}
