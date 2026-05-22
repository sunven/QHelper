import { describe, expect, it } from "vitest";
import { clearWorkspace, loadWorkspace, saveWorkspace, WORKSPACE_STORAGE_KEY } from "./workspaceStore";
import { createInitialWorkspace, updateWorkspaceTabInput } from "./workspace";

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

describe("workspaceStore", () => {
  it("uses the QHelper namespaced localStorage key", () => {
    expect(WORKSPACE_STORAGE_KEY).toBe("qhelper.text-preview.workspace.v1");
  });

  it("loads an empty workspace when storage is empty", () => {
    const result = loadWorkspace(new MemoryStorage());

    expect(result.state.tabs).toHaveLength(1);
    expect(result.warning).toBeUndefined();
  });

  it("saves and loads workspace state from the allowed key", () => {
    const storage = new MemoryStorage();
    const initial = createInitialWorkspace({ makeId: () => "tab-a", now: 1000 });
    const workspace = updateWorkspaceTabInput(initial, "tab-a", "10.0.0.1", 2000);

    expect(saveWorkspace(workspace, storage)).toEqual({ ok: true });
    expect(storage.getItem(WORKSPACE_STORAGE_KEY)).toContain("10.0.0.1");
    expect(loadWorkspace(storage).state.tabs[0].input).toBe("10.0.0.1");
  });

  it("removes corrupt storage data and returns a warning", () => {
    const storage = new MemoryStorage();
    storage.setItem(WORKSPACE_STORAGE_KEY, "{");

    const result = loadWorkspace(storage);

    expect(result.warning).toContain("损坏");
    expect(storage.getItem(WORKSPACE_STORAGE_KEY)).toBeNull();
    expect(result.state.tabs[0].input).toBe("");
  });

  it("clears the workspace storage key", () => {
    const storage = new MemoryStorage();
    storage.setItem(WORKSPACE_STORAGE_KEY, "saved");

    clearWorkspace(storage);

    expect(storage.getItem(WORKSPACE_STORAGE_KEY)).toBeNull();
  });
});
