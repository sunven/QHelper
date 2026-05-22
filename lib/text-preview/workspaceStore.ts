import { createInitialWorkspace, sanitizeWorkspace } from './workspace'
import type { WorkspaceState } from './workspace'

export const WORKSPACE_STORAGE_KEY = 'qhelper.text-preview.workspace.v1'

export type WorkspaceLoadResult = {
  state: WorkspaceState
  warning?: string
}

export type WorkspaceSaveResult = {
  ok: boolean
  warning?: string
}

export function loadWorkspace(
  storage: Storage | undefined = getBrowserStorage(),
): WorkspaceLoadResult {
  if (!storage) {
    return {
      state: createInitialWorkspace(),
      warning: '本机保存不可用，刷新页面后内容可能丢失。',
    }
  }

  const rawValue = storage.getItem(WORKSPACE_STORAGE_KEY)
  if (!rawValue) {
    return { state: createInitialWorkspace() }
  }

  try {
    return { state: sanitizeWorkspace(JSON.parse(rawValue)) }
  } catch {
    storage.removeItem(WORKSPACE_STORAGE_KEY)
    return {
      state: createInitialWorkspace(),
      warning: '已忽略损坏的本机保存数据。',
    }
  }
}

export function saveWorkspace(
  state: WorkspaceState,
  storage: Storage | undefined = getBrowserStorage(),
): WorkspaceSaveResult {
  if (!storage) {
    return {
      ok: false,
      warning: '本机保存不可用，刷新页面后内容可能丢失。',
    }
  }

  try {
    storage.setItem(WORKSPACE_STORAGE_KEY, JSON.stringify(state))
    return { ok: true }
  } catch {
    return {
      ok: false,
      warning: '本机保存失败，刷新页面后内容可能丢失。',
    }
  }
}

export function clearWorkspace(storage: Storage | undefined = getBrowserStorage()) {
  storage?.removeItem(WORKSPACE_STORAGE_KEY)
}

function getBrowserStorage() {
  if (typeof window === 'undefined') return undefined
  return window.localStorage
}
