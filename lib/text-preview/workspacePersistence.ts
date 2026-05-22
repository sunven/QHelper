import type { FileHandleStore } from "./fileSystemAccessTypes";
import { getDefaultFileHandleStore } from "./fileHandleStore";
import {
  markWorkspaceTabHandleMissing,
  type WorkspaceState,
} from "./workspace";
import {
  clearWorkspace,
  loadWorkspace,
  saveWorkspace,
  type WorkspaceLoadResult,
  type WorkspaceSaveResult,
} from "./workspaceStore";

export type WorkspacePersistence = {
  clearWorkspaceData: () => Promise<WorkspaceClearResult>;
  loadWorkspaceData: () => Promise<WorkspaceLoadResult>;
  saveWorkspaceData: (state: WorkspaceState) => WorkspaceSaveResult;
};

export type WorkspaceClearResult = {
  ok: boolean;
  warning?: string;
};

export function createWorkspacePersistence(options: { handleStore?: FileHandleStore; storage?: Storage } = {}): WorkspacePersistence {
  const handleStore = options.handleStore ?? getDefaultFileHandleStore();
  const storage = options.storage;

  return {
    async loadWorkspaceData() {
      const loadResult = loadWorkspace(storage);
      let state = loadResult.state;
      const warnings = [loadResult.warning].filter((warning): warning is string => Boolean(warning));

      for (const tab of state.tabs) {
        if (tab.source.kind !== "local-file") continue;
        const handle = await handleStore.get(tab.source.fileId);
        if (!handle) {
          state = markWorkspaceTabHandleMissing(state, tab.id);
          warnings.push(`需要重新打开 ${tab.source.name} 才能保存回原文件。`);
        }
      }

      return {
        state,
        warning: warnings.join(" ")
      };
    },

    saveWorkspaceData(state) {
      return saveWorkspace(state, storage);
    },

    async clearWorkspaceData() {
      clearWorkspace(storage);
      const handleResult = await handleStore.clear();
      if (!handleResult.ok) {
        return { ok: false, warning: handleResult.warning };
      }
      return { ok: true };
    }
  };
}
