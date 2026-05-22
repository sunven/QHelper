import type { FileSignature } from "./workspace";

export type FileSystemPermissionMode = "read" | "readwrite";

export type TextPreviewWritableFileStream = {
  close: () => Promise<void>;
  write: (data: string | Blob | BufferSource) => Promise<void>;
};

export type TextPreviewFileSystemFileHandle = {
  createWritable: () => Promise<TextPreviewWritableFileStream>;
  getFile: () => Promise<File>;
  kind: "file";
  name: string;
  queryPermission?: (descriptor?: { mode: FileSystemPermissionMode }) => Promise<PermissionState>;
  requestPermission?: (descriptor?: { mode: FileSystemPermissionMode }) => Promise<PermissionState>;
};

export type TextPreviewOpenFilePicker = (options?: {
  excludeAcceptAllOption?: boolean;
  multiple?: boolean;
  types?: Array<{
    accept: Record<string, string[]>;
    description?: string;
  }>;
}) => Promise<TextPreviewFileSystemFileHandle[]>;

export type TextPreviewWindow = Window & {
  __TEXT_PREVIEW_FILE_ACCESS__?: LocalFileAccess;
  __TEXT_PREVIEW_FILE_HANDLE_STORE__?: FileHandleStore;
  showOpenFilePicker?: TextPreviewOpenFilePicker;
};

export type OpenedTextFile = {
  fileId: string;
  handle: TextPreviewFileSystemFileHandle;
  name: string;
  signature: FileSignature;
  text: string;
};

export type RejectedTextFile = {
  name: string;
  reason: "too-large" | "read-failed";
  size?: number;
};

export type OpenTextFilesResult = {
  cancelled: boolean;
  files: OpenedTextFile[];
  rejected: RejectedTextFile[];
};

export type SaveTextFileRequest = {
  expectedSignature: FileSignature;
  force?: boolean;
  handle: TextPreviewFileSystemFileHandle;
  text: string;
};

export type SaveTextFileResult =
  | { kind: "saved"; signature: FileSignature }
  | { diskSignature: FileSignature; kind: "conflict" }
  | { kind: "permission-needed" }
  | { kind: "failed"; message: string };

export type ReloadTextFileResult =
  | { kind: "reloaded"; signature: FileSignature; text: string }
  | { kind: "too-large"; size: number }
  | { kind: "failed"; message: string };

export type LocalFileAccess = {
  createDownloadFallback: (name: string, text: string) => void;
  isSupported: () => boolean;
  openTextFiles: () => Promise<OpenTextFilesResult>;
  reloadTextFile: (handle: TextPreviewFileSystemFileHandle) => Promise<ReloadTextFileResult>;
  saveTextFile: (request: SaveTextFileRequest) => Promise<SaveTextFileResult>;
};

export type FileHandleStore = {
  clear: () => Promise<{ ok: boolean; warning?: string }>;
  delete: (fileId: string) => Promise<{ ok: boolean; warning?: string }>;
  get: (fileId: string) => Promise<TextPreviewFileSystemFileHandle | undefined>;
  put: (fileId: string, handle: TextPreviewFileSystemFileHandle) => Promise<{ ok: boolean; warning?: string }>;
};
