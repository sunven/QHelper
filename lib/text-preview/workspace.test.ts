import { describe, expect, it } from "vitest";
import {
  addFileBackedWorkspaceTabs,
  addWorkspaceTab,
  closeWorkspaceTab,
  createInitialWorkspace,
  markWorkspaceTabConflict,
  markWorkspaceTabSaved,
  renameWorkspaceTab,
  sanitizeWorkspace,
  selectWorkspaceTab,
  updateWorkspaceTabInput
} from "./workspace";

const ids = (...values: string[]) => {
  let index = 0;
  return () => values[index++] ?? `fallback-${index}`;
};

describe("workspace", () => {
  it("creates a single empty workspace tab", () => {
    const workspace = createInitialWorkspace({ now: 1000, makeId: ids("tab-a") });

    expect(workspace).toEqual({
      version: 2,
      activeTabId: "tab-a",
      tabs: [
        {
          id: "tab-a",
          title: "未命名 1",
          input: "",
          createdAt: 1000,
          updatedAt: 1000,
          source: { kind: "manual" },
          fileStatus: { kind: "manual" }
        }
      ]
    });
  });

  it("adds tabs with unique untitled names and selects the new tab", () => {
    const initial = createInitialWorkspace({ now: 1000, makeId: ids("tab-a") });
    const workspace = addWorkspaceTab(initial, { now: 2000, makeId: ids("tab-b") });

    expect(workspace.activeTabId).toBe("tab-b");
    expect(workspace.tabs.map((tab) => tab.title)).toEqual(["未命名 1", "未命名 2"]);
  });

  it("does not reuse an untitled number after an earlier tab is renamed", () => {
    const initial = createInitialWorkspace({ makeId: ids("tab-a") });
    const renamed = renameWorkspaceTab(initial, "tab-a", "项目 A");
    const workspace = addWorkspaceTab(renamed, { makeId: ids("tab-b") });

    expect(workspace.tabs.map((tab) => tab.title)).toEqual(["项目 A", "未命名 2"]);
  });

  it("keeps each tab input isolated", () => {
    const first = createInitialWorkspace({ now: 1000, makeId: ids("tab-a") });
    const second = addWorkspaceTab(first, { now: 2000, makeId: ids("tab-b") });
    const updated = updateWorkspaceTabInput(second, "tab-a", "10.0.0.1", 3000);

    expect(updated.tabs.find((tab) => tab.id === "tab-a")?.input).toBe("10.0.0.1");
    expect(updated.tabs.find((tab) => tab.id === "tab-b")?.input).toBe("");
  });

  it("adds file-backed tabs with file names and clean status", () => {
    const initial = createInitialWorkspace({ now: 1000, makeId: ids("tab-a") });
    const workspace = addFileBackedWorkspaceTabs(
      initial,
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

    expect(workspace.activeTabId).toBe("tab-b");
    expect(workspace.tabs[1]).toMatchObject({
      id: "tab-b",
      title: "hosts.txt",
      input: "10.0.0.1",
      source: {
        kind: "local-file",
        fileId: "file-a",
        name: "hosts.txt",
        lastKnownSignature: { contentHash: "hash-a", lastModified: 100, size: 8 },
        lastLoadedAt: 2000
      },
      fileStatus: { kind: "clean" }
    });
  });

  it("renames tabs and falls back for blank titles", () => {
    const initial = createInitialWorkspace({ makeId: ids("tab-a") });
    const renamed = renameWorkspaceTab(initial, "tab-a", "  项目 A  ", 2000);
    const blank = renameWorkspaceTab(renamed, "tab-a", " ", 3000);

    expect(renamed.tabs[0].title).toBe("项目 A");
    expect(blank.tabs[0].title).toBe("未命名 1");
  });

  it("does not rename file-backed tabs", () => {
    const initial = createInitialWorkspace({ now: 1000, makeId: ids("tab-a") });
    const workspace = addFileBackedWorkspaceTabs(
      initial,
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

    const renamed = renameWorkspaceTab(workspace, "tab-b", "项目 A", 3000);

    expect(renamed.tabs[1].title).toBe("hosts.txt");
  });

  it("marks file-backed tabs dirty after editing", () => {
    const initial = createInitialWorkspace({ now: 1000, makeId: ids("tab-a") });
    const workspace = addFileBackedWorkspaceTabs(
      initial,
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

    const updated = updateWorkspaceTabInput(workspace, "tab-b", "10.0.0.2", 3000);

    expect(updated.tabs[1].fileStatus).toEqual({ kind: "dirty" });
  });

  it("transitions file-backed tabs through saved and conflict states", () => {
    const initial = createInitialWorkspace({ now: 1000, makeId: ids("tab-a") });
    const workspace = addFileBackedWorkspaceTabs(
      initial,
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
    const conflict = markWorkspaceTabConflict(workspace, "tab-b", {
      contentHash: "hash-disk",
      lastModified: 300,
      size: 8
    });
    const saved = markWorkspaceTabSaved(conflict, "tab-b", {
      contentHash: "hash-saved",
      lastModified: 400,
      size: 8
    }, 5000);

    expect(conflict.tabs[1].fileStatus).toEqual({
      kind: "conflict",
      diskSignature: { contentHash: "hash-disk", lastModified: 300, size: 8 }
    });
    expect(saved.tabs[1].fileStatus).toEqual({ kind: "clean" });
    expect(saved.tabs[1].source).toMatchObject({
      kind: "local-file",
      lastKnownSignature: { contentHash: "hash-saved", lastModified: 400, size: 8 },
      lastSavedAt: 5000
    });
  });

  it("closes the active tab and selects the nearest remaining tab", () => {
    const first = createInitialWorkspace({ makeId: ids("tab-a") });
    const second = addWorkspaceTab(first, { makeId: ids("tab-b") });
    const third = addWorkspaceTab(second, { makeId: ids("tab-c") });
    const selected = selectWorkspaceTab(third, "tab-b");
    const closed = closeWorkspaceTab(selected, "tab-b");

    expect(closed.activeTabId).toBe("tab-c");
    expect(closed.tabs.map((tab) => tab.id)).toEqual(["tab-a", "tab-c"]);
  });

  it("closing the last tab creates a new empty workspace", () => {
    const initial = createInitialWorkspace({ makeId: ids("tab-a") });
    const closed = closeWorkspaceTab(initial, "tab-a", { now: 2000, makeId: ids("tab-b") });

    expect(closed.activeTabId).toBe("tab-b");
    expect(closed.tabs).toHaveLength(1);
    expect(closed.tabs[0].input).toBe("");
  });

  it("sanitizes persisted workspace data", () => {
    const workspace = sanitizeWorkspace(
      {
        version: 2,
        activeTabId: "missing",
        tabs: [
          {
            id: "tab-a",
            title: "",
            input: "10.0.0.1",
            createdAt: Number.NaN,
            updatedAt: 1234,
            source: { kind: "manual" },
            fileStatus: { kind: "manual" }
          }
        ]
      },
      { now: 5000, makeId: ids("tab-fallback") }
    );

    expect(workspace.activeTabId).toBe("tab-a");
    expect(workspace.tabs[0]).toMatchObject({
      id: "tab-a",
      title: "未命名 1",
      input: "10.0.0.1",
      createdAt: 5000,
      updatedAt: 1234,
      source: { kind: "manual" },
      fileStatus: { kind: "manual" }
    });
  });

  it("migrates v1 persisted tabs to v2 manual tabs", () => {
    const workspace = sanitizeWorkspace(
      {
        version: 1,
        activeTabId: "tab-a",
        tabs: [
          {
            id: "tab-a",
            title: "项目 A",
            input: "saved text",
            createdAt: 100,
            updatedAt: 200
          }
        ]
      },
      { now: 1000, makeId: ids("tab-new") }
    );

    expect(workspace).toEqual({
      version: 2,
      activeTabId: "tab-a",
      tabs: [
        {
          id: "tab-a",
          title: "项目 A",
          input: "saved text",
          createdAt: 100,
          updatedAt: 200,
          source: { kind: "manual" },
          fileStatus: { kind: "manual" }
        }
      ]
    });
  });

  it("sanitizes invalid file-backed metadata back to a manual tab", () => {
    const workspace = sanitizeWorkspace(
      {
        version: 2,
        activeTabId: "tab-a",
        tabs: [
          {
            id: "tab-a",
            title: "hosts.txt",
            input: "10.0.0.1",
            createdAt: 100,
            updatedAt: 200,
            source: {
              kind: "local-file",
              fileId: "",
              name: "hosts.txt",
              lastKnownSignature: { contentHash: "", lastModified: 1, size: 8 },
              lastLoadedAt: 100
            },
            fileStatus: { kind: "clean" }
          }
        ]
      },
      { now: 1000, makeId: ids("tab-new") }
    );

    expect(workspace.tabs[0]).toMatchObject({
      source: { kind: "manual" },
      fileStatus: { kind: "manual" }
    });
  });

  it("falls back to an empty workspace for unknown versions", () => {
    const workspace = sanitizeWorkspace(
      {
        version: 99,
        activeTabId: "tab-a",
        tabs: [{ id: "tab-a", title: "项目 A", input: "saved text" }]
      },
      { now: 1000, makeId: ids("tab-new") }
    );

    expect(workspace.activeTabId).toBe("tab-new");
    expect(workspace.tabs[0].input).toBe("");
  });
});
