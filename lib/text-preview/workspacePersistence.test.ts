import { describe, expect, it } from "vitest";
import type { FileHandleStore, TextPreviewFileSystemFileHandle } from "./fileSystemAccessTypes";
import { createMemoryFileHandleStore } from "./fileHandleStore";
import { createInitialWorkspace, addFileBackedWorkspaceTabs } from "./workspace";
import { createWorkspacePersistence } from "./workspacePersistence";
import { saveWorkspace, WORKSPACE_STORAGE_KEY } from "./workspaceStore";

class MemoryStorage implements Storage {
  private values = new Map<string, string>();

  get length() {
    return this.values.size;
  }

  clear() {
    this.values.clear();
  }

  getItem(key: string) {
    return this.values.get(key) ?? null;
  }

  key(index: number) {
    return Array.from(this.values.keys())[index] ?? null;
  }

  removeItem(key: string) {
    this.values.delete(key);
  }

  setItem(key: string, value: string) {
    this.values.set(key, value);
  }
}

describe("workspacePersistence", () => {
  it("marks file-backed tabs handle-missing when the handle store cannot recover them", async () => {
    const storage = new MemoryStorage();
    const workspace = addFileBackedWorkspaceTabs(
      createInitialWorkspace({ now: 1000, makeId: ids("tab-a") }),
      [
        {
          fileId: "file-a",
          name: "hosts.txt",
          input: "10.0.0.1",
          signature: { contentHash: "hash-a", lastModified: 100, size: 8 }
        }
      ],
      { now: 2000, makeId: ids("tab-b") }
    );
    saveWorkspace(workspace, storage);

    const persistence = createWorkspacePersistence({
      storage,
      handleStore: createMemoryFileHandleStore()
    });

    const result = await persistence.loadWorkspaceData();

    expect(result.state.tabs[1].fileStatus).toEqual({ kind: "handle-missing" });
    expect(result.warning).toContain("需要重新打开 hosts.txt");
  });

  it("clears localStorage and handle store together", async () => {
    const storage = new MemoryStorage();
    const handle = fakeHandle();
    const handleStore = createMemoryFileHandleStore({ "file-a": handle });
    storage.setItem(WORKSPACE_STORAGE_KEY, "saved");

    const persistence = createWorkspacePersistence({ storage, handleStore });

    expect(await persistence.clearWorkspaceData()).toEqual({ ok: true });
    expect(storage.getItem(WORKSPACE_STORAGE_KEY)).toBeNull();
    await expect(handleStore.get("file-a")).resolves.toBeUndefined();
  });

  it("returns a warning if the handle store fails during clear", async () => {
    const storage = new MemoryStorage();
    storage.setItem(WORKSPACE_STORAGE_KEY, "saved");
    const handleStore: FileHandleStore = {
      async clear() {
        return { ok: false, warning: "clear failed" };
      },
      async delete() {
        return { ok: true };
      },
      async get() {
        return undefined;
      },
      async put() {
        return { ok: true };
      }
    };
    const persistence = createWorkspacePersistence({ storage, handleStore });

    const result = await persistence.clearWorkspaceData();

    expect(result).toEqual({ ok: false, warning: "clear failed" });
    expect(storage.getItem(WORKSPACE_STORAGE_KEY)).toBeNull();
  });
});

const ids = (...values: string[]) => {
  let index = 0;
  return () => values[index++] ?? `fallback-${index}`;
};

function fakeHandle(): TextPreviewFileSystemFileHandle {
  return {
    kind: "file",
    name: "hosts.txt",
    async getFile() {
      return new File(["10.0.0.1"], "hosts.txt", { type: "text/plain" });
    },
    async createWritable() {
      return {
        async close() {},
        async write() {}
      };
    }
  };
}
