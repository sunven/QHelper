export const WORKSPACE_VERSION = 2;
export const MAX_WORKSPACE_TABS = 20;

const DEFAULT_TITLE_PREFIX = "未命名";
const MAX_TITLE_LENGTH = 64;

export type FileSignature = {
  contentHash: string;
  lastModified: number;
  size: number;
};

export type WorkspaceTabSource =
  | { kind: "manual" }
  | {
      fileId: string;
      kind: "local-file";
      lastKnownSignature: FileSignature;
      lastLoadedAt: number;
      lastSavedAt?: number;
      name: string;
    };

export type WorkspaceFileStatus =
  | { kind: "manual" }
  | { kind: "clean" }
  | { kind: "dirty" }
  | { kind: "saving" }
  | { diskSignature: FileSignature; kind: "conflict" }
  | { kind: "permission-needed" }
  | { kind: "handle-missing" }
  | { kind: "save-failed"; message: string };

export type WorkspaceTab = {
  id: string;
  title: string;
  input: string;
  createdAt: number;
  updatedAt: number;
  source: WorkspaceTabSource;
  fileStatus: WorkspaceFileStatus;
};

export type WorkspaceState = {
  version: typeof WORKSPACE_VERSION;
  activeTabId: string;
  tabs: WorkspaceTab[];
};

export type FileBackedTabInput = {
  fileId: string;
  input: string;
  name: string;
  signature: FileSignature;
};

type IdFactory = () => string;

export function createTabId() {
  if (globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID();
  }

  return `tab-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function createInitialWorkspace(options: { now?: number; makeId?: IdFactory } = {}): WorkspaceState {
  const tab = createWorkspaceTab([], options);

  return {
    version: WORKSPACE_VERSION,
    activeTabId: tab.id,
    tabs: [tab]
  };
}

export function createWorkspaceTab(
  existingTabs: WorkspaceTab[],
  options: { input?: string; now?: number; makeId?: IdFactory; title?: string } = {}
): WorkspaceTab {
  const now = options.now ?? Date.now();

  return {
    id: (options.makeId ?? createTabId)(),
    title: normalizeTabTitle(options.title, getNextUntitledIndex(existingTabs)),
    input: options.input ?? "",
    createdAt: now,
    updatedAt: now,
    source: { kind: "manual" },
    fileStatus: { kind: "manual" }
  };
}

export function getActiveTab(workspace: WorkspaceState): WorkspaceTab {
  return workspace.tabs.find((tab) => tab.id === workspace.activeTabId) ?? workspace.tabs[0];
}

export function addWorkspaceTab(
  workspace: WorkspaceState,
  options: { now?: number; makeId?: IdFactory; title?: string } = {}
): WorkspaceState {
  if (workspace.tabs.length >= MAX_WORKSPACE_TABS) return workspace;

  const tab = createWorkspaceTab(workspace.tabs, options);

  return {
    ...workspace,
    activeTabId: tab.id,
    tabs: [...workspace.tabs, tab]
  };
}

export function addFileBackedWorkspaceTabs(
  workspace: WorkspaceState,
  files: FileBackedTabInput[],
  options: { now?: number; makeId?: IdFactory } = {}
): WorkspaceState {
  const now = options.now ?? Date.now();
  const makeId = options.makeId ?? createTabId;
  const availableSlots = Math.max(0, MAX_WORKSPACE_TABS - workspace.tabs.length);
  const tabsToAdd = files.slice(0, availableSlots).map((file) => createFileBackedWorkspaceTab(workspace.tabs, file, now, makeId));

  if (tabsToAdd.length === 0) return workspace;

  return {
    ...workspace,
    activeTabId: tabsToAdd[tabsToAdd.length - 1].id,
    tabs: [...workspace.tabs, ...tabsToAdd]
  };
}

export function selectWorkspaceTab(workspace: WorkspaceState, tabId: string): WorkspaceState {
  if (!workspace.tabs.some((tab) => tab.id === tabId)) return workspace;
  return { ...workspace, activeTabId: tabId };
}

export function updateWorkspaceTabInput(
  workspace: WorkspaceState,
  tabId: string,
  input: string,
  now = Date.now()
): WorkspaceState {
  return {
    ...workspace,
    tabs: workspace.tabs.map((tab) =>
      tab.id === tabId
        ? {
            ...tab,
            input,
            updatedAt: now,
            fileStatus: nextStatusAfterEdit(tab.fileStatus)
          }
        : tab
    )
  };
}

export function renameWorkspaceTab(
  workspace: WorkspaceState,
  tabId: string,
  title: string,
  now = Date.now()
): WorkspaceState {
  return {
    ...workspace,
    tabs: workspace.tabs.map((tab, index) =>
      tab.id === tabId && tab.source.kind === "manual"
        ? {
            ...tab,
            title: normalizeTabTitle(title, index + 1),
            updatedAt: now
          }
        : tab
    )
  };
}

export function closeWorkspaceTab(
  workspace: WorkspaceState,
  tabId: string,
  options: { now?: number; makeId?: IdFactory } = {}
): WorkspaceState {
  const tabIndex = workspace.tabs.findIndex((tab) => tab.id === tabId);
  if (tabIndex === -1) return workspace;

  const remainingTabs = workspace.tabs.filter((tab) => tab.id !== tabId);
  if (remainingTabs.length === 0) {
    return createInitialWorkspace(options);
  }

  if (workspace.activeTabId !== tabId) {
    return {
      ...workspace,
      tabs: remainingTabs
    };
  }

  const nextActiveTab = remainingTabs[Math.min(tabIndex, remainingTabs.length - 1)];

  return {
    ...workspace,
    activeTabId: nextActiveTab.id,
    tabs: remainingTabs
  };
}

export function markWorkspaceTabSaving(workspace: WorkspaceState, tabId: string): WorkspaceState {
  return updateWorkspaceTabFileStatus(workspace, tabId, { kind: "saving" });
}

export function markWorkspaceTabSaved(
  workspace: WorkspaceState,
  tabId: string,
  signature: FileSignature,
  now = Date.now()
): WorkspaceState {
  return {
    ...workspace,
    tabs: workspace.tabs.map((tab) =>
      tab.id === tabId && tab.source.kind === "local-file"
        ? {
            ...tab,
            title: tab.source.name,
            updatedAt: now,
            source: {
              ...tab.source,
              lastKnownSignature: signature,
              lastSavedAt: now
            },
            fileStatus: { kind: "clean" }
          }
        : tab
    )
  };
}

export function markWorkspaceTabConflict(
  workspace: WorkspaceState,
  tabId: string,
  diskSignature: FileSignature
): WorkspaceState {
  return updateWorkspaceTabFileStatus(workspace, tabId, { kind: "conflict", diskSignature });
}

export function markWorkspaceTabPermissionNeeded(workspace: WorkspaceState, tabId: string): WorkspaceState {
  return updateWorkspaceTabFileStatus(workspace, tabId, { kind: "permission-needed" });
}

export function markWorkspaceTabHandleMissing(workspace: WorkspaceState, tabId: string): WorkspaceState {
  return updateWorkspaceTabFileStatus(workspace, tabId, { kind: "handle-missing" });
}

export function markWorkspaceTabSaveFailed(workspace: WorkspaceState, tabId: string, message: string): WorkspaceState {
  return updateWorkspaceTabFileStatus(workspace, tabId, { kind: "save-failed", message });
}

export function reloadFileBackedWorkspaceTab(
  workspace: WorkspaceState,
  tabId: string,
  input: string,
  signature: FileSignature,
  now = Date.now()
): WorkspaceState {
  return {
    ...workspace,
    tabs: workspace.tabs.map((tab) =>
      tab.id === tabId && tab.source.kind === "local-file"
        ? {
            ...tab,
            input,
            title: tab.source.name,
            updatedAt: now,
            source: {
              ...tab.source,
              lastKnownSignature: signature,
              lastLoadedAt: now
            },
            fileStatus: { kind: "clean" }
          }
        : tab
    )
  };
}

export function sanitizeWorkspace(
  value: unknown,
  options: { now?: number; makeId?: IdFactory } = {}
): WorkspaceState {
  const now = options.now ?? Date.now();
  const makeId = options.makeId ?? createTabId;

  if (!isRecord(value)) {
    return createInitialWorkspace({ now, makeId });
  }

  if (value.version === 1 && Array.isArray(value.tabs)) {
    return migrateWorkspaceV1(value, { now, makeId });
  }

  if (value.version !== WORKSPACE_VERSION || !Array.isArray(value.tabs)) {
    return createInitialWorkspace({ now, makeId });
  }

  const usedIds = new Set<string>();
  const tabs = value.tabs
    .slice(0, MAX_WORKSPACE_TABS)
    .map((rawTab, index): WorkspaceTab | null => sanitizeWorkspaceTab(rawTab, index, usedIds, { now, makeId }))
    .filter((tab): tab is WorkspaceTab => tab !== null);

  return buildSanitizedWorkspace(tabs, value.activeTabId, { now, makeId });
}

function createFileBackedWorkspaceTab(
  existingTabs: WorkspaceTab[],
  file: FileBackedTabInput,
  now: number,
  makeId: IdFactory
): WorkspaceTab {
  const title = normalizeTabTitle(file.name, existingTabs.length + 1);

  return {
    id: makeId(),
    title,
    input: file.input,
    createdAt: now,
    updatedAt: now,
    source: {
      kind: "local-file",
      fileId: file.fileId,
      name: title,
      lastKnownSignature: file.signature,
      lastLoadedAt: now
    },
    fileStatus: { kind: "clean" }
  };
}

function updateWorkspaceTabFileStatus(
  workspace: WorkspaceState,
  tabId: string,
  fileStatus: Exclude<WorkspaceFileStatus, { kind: "manual" }>
): WorkspaceState {
  return {
    ...workspace,
    tabs: workspace.tabs.map((tab) =>
      tab.id === tabId && tab.source.kind === "local-file"
        ? {
            ...tab,
            fileStatus
          }
        : tab
    )
  };
}

function nextStatusAfterEdit(status: WorkspaceFileStatus): WorkspaceFileStatus {
  if (status.kind === "manual") return status;
  if (status.kind === "conflict") return status;
  return { kind: "dirty" };
}

function migrateWorkspaceV1(
  value: Record<string, unknown>,
  options: { now: number; makeId: IdFactory }
): WorkspaceState {
  const usedIds = new Set<string>();
  const rawTabs = Array.isArray(value.tabs) ? value.tabs : [];
  const tabs = rawTabs
    .slice(0, MAX_WORKSPACE_TABS)
    .map((rawTab, index): WorkspaceTab | null => {
      if (!isRecord(rawTab)) return null;

      const id = sanitizeTabId(rawTab.id, usedIds, options.makeId);

      return {
        id,
        title: normalizeTabTitle(typeof rawTab.title === "string" ? rawTab.title : "", index + 1),
        input: typeof rawTab.input === "string" ? rawTab.input : "",
        createdAt: finiteNumberOr(rawTab.createdAt, options.now),
        updatedAt: finiteNumberOr(rawTab.updatedAt, options.now),
        source: { kind: "manual" },
        fileStatus: { kind: "manual" }
      };
    })
    .filter((tab): tab is WorkspaceTab => tab !== null);

  return buildSanitizedWorkspace(tabs, value.activeTabId, options);
}

function sanitizeWorkspaceTab(
  rawTab: unknown,
  index: number,
  usedIds: Set<string>,
  options: { now: number; makeId: IdFactory }
): WorkspaceTab | null {
  if (!isRecord(rawTab)) return null;

  const id = sanitizeTabId(rawTab.id, usedIds, options.makeId);
  const source = sanitizeWorkspaceTabSource(rawTab.source, index, options.now);
  const title =
    source.kind === "local-file"
      ? source.name
      : normalizeTabTitle(typeof rawTab.title === "string" ? rawTab.title : "", index + 1);

  return {
    id,
    title,
    input: typeof rawTab.input === "string" ? rawTab.input : "",
    createdAt: finiteNumberOr(rawTab.createdAt, options.now),
    updatedAt: finiteNumberOr(rawTab.updatedAt, options.now),
    source,
    fileStatus: sanitizeWorkspaceFileStatus(rawTab.fileStatus, source)
  };
}

function sanitizeTabId(value: unknown, usedIds: Set<string>, makeId: IdFactory) {
  const rawId = typeof value === "string" && value.trim().length > 0 ? value.trim() : makeId();
  const id = usedIds.has(rawId) ? makeId() : rawId;
  usedIds.add(id);
  return id;
}

function sanitizeWorkspaceTabSource(value: unknown, fallbackIndex: number, now: number): WorkspaceTabSource {
  if (!isRecord(value) || value.kind !== "local-file") {
    return { kind: "manual" };
  }

  const signature = sanitizeFileSignature(value.lastKnownSignature);
  const fileId = typeof value.fileId === "string" && value.fileId.trim().length > 0 ? value.fileId.trim() : "";
  const name = normalizeTabTitle(typeof value.name === "string" ? value.name : "", fallbackIndex + 1);

  if (!signature || fileId.length === 0) {
    return { kind: "manual" };
  }

  return {
    kind: "local-file",
    fileId,
    name,
    lastKnownSignature: signature,
    lastLoadedAt: finiteNumberOr(value.lastLoadedAt, now),
    lastSavedAt: optionalFiniteNumber(value.lastSavedAt)
  };
}

function sanitizeFileSignature(value: unknown): FileSignature | null {
  if (!isRecord(value)) return null;

  const contentHash = typeof value.contentHash === "string" && value.contentHash.length > 0 ? value.contentHash : "";
  const lastModified = finiteNumberOr(value.lastModified, Number.NaN);
  const size = finiteNumberOr(value.size, Number.NaN);

  if (!contentHash || !Number.isFinite(lastModified) || !Number.isFinite(size) || size < 0) {
    return null;
  }

  return { contentHash, lastModified, size };
}

function sanitizeWorkspaceFileStatus(value: unknown, source: WorkspaceTabSource): WorkspaceFileStatus {
  if (source.kind === "manual") return { kind: "manual" };
  if (!isRecord(value)) return { kind: "handle-missing" };

  switch (value.kind) {
    case "clean":
    case "dirty":
    case "saving":
    case "permission-needed":
    case "handle-missing":
      return { kind: value.kind };
    case "conflict": {
      const diskSignature = sanitizeFileSignature(value.diskSignature);
      return diskSignature ? { kind: "conflict", diskSignature } : { kind: "dirty" };
    }
    case "save-failed":
      return {
        kind: "save-failed",
        message: typeof value.message === "string" && value.message.trim() ? value.message : "保存失败。"
      };
    default:
      return { kind: "handle-missing" };
  }
}

function buildSanitizedWorkspace(
  tabs: WorkspaceTab[],
  rawActiveTabId: unknown,
  options: { now: number; makeId: IdFactory }
): WorkspaceState {
  if (tabs.length === 0) {
    return createInitialWorkspace({ now: options.now, makeId: options.makeId });
  }

  const activeTabId =
    typeof rawActiveTabId === "string" && tabs.some((tab) => tab.id === rawActiveTabId) ? rawActiveTabId : tabs[0].id;

  return {
    version: WORKSPACE_VERSION,
    activeTabId,
    tabs
  };
}

function normalizeTabTitle(title: string | undefined, fallbackIndex: number) {
  const normalized = title?.trim().replace(/\s+/g, " ").slice(0, MAX_TITLE_LENGTH);
  return normalized && normalized.length > 0 ? normalized : `${DEFAULT_TITLE_PREFIX} ${fallbackIndex}`;
}

function getNextUntitledIndex(tabs: WorkspaceTab[]) {
  const used = new Set<number>();

  for (const tab of tabs) {
    const match = new RegExp(`^${DEFAULT_TITLE_PREFIX} (\\d+)$`).exec(tab.title);
    if (match) {
      used.add(Number(match[1]));
    }
  }

  let index = Math.max(1, tabs.length + 1);
  while (used.has(index)) index += 1;
  return index;
}

function optionalFiniteNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function finiteNumberOr(value: unknown, fallback: number) {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
