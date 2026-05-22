import { HARD_STOP_BYTES } from "./parser/sizeGuard";
import type {
  LocalFileAccess,
  OpenTextFilesResult,
  ReloadTextFileResult,
  SaveTextFileRequest,
  SaveTextFileResult,
  TextPreviewFileSystemFileHandle,
  TextPreviewWindow,
} from "./fileSystemAccessTypes";
import type { FileSignature } from "./workspace";

export const FILE_OPEN_BYTE_LIMIT = HARD_STOP_BYTES;

const textEncoder = new TextEncoder();

export function getDefaultLocalFileAccess(): LocalFileAccess {
  const testAccess = getTextPreviewWindow().__TEXT_PREVIEW_FILE_ACCESS__;
  return testAccess ?? browserLocalFileAccess;
}

export const browserLocalFileAccess: LocalFileAccess = {
  isSupported() {
    return typeof getTextPreviewWindow().showOpenFilePicker === "function";
  },

  async openTextFiles(): Promise<OpenTextFilesResult> {
    const picker = getTextPreviewWindow().showOpenFilePicker;
    if (!picker) {
      return {
        cancelled: false,
        files: [],
        rejected: [{ name: "unsupported", reason: "read-failed" }]
      };
    }

    try {
      const handles = await picker({
        excludeAcceptAllOption: false,
        multiple: true
      });
      const files: OpenTextFilesResult["files"] = [];
      const rejected: OpenTextFilesResult["rejected"] = [];

      for (const handle of handles) {
        try {
          const file = await handle.getFile();
          if (file.size > FILE_OPEN_BYTE_LIMIT) {
            rejected.push({ name: file.name || handle.name, reason: "too-large", size: file.size });
            continue;
          }

          const text = await file.text();
          files.push({
            fileId: createFileId(),
            handle,
            name: file.name || handle.name,
            text,
            signature: createFileSignature(file, text)
          });
        } catch {
          rejected.push({ name: handle.name, reason: "read-failed" });
        }
      }

      return { cancelled: false, files, rejected };
    } catch (error) {
      if (isAbortError(error)) {
        return { cancelled: true, files: [], rejected: [] };
      }
      throw error;
    }
  },

  async reloadTextFile(handle: TextPreviewFileSystemFileHandle): Promise<ReloadTextFileResult> {
    try {
      const file = await handle.getFile();
      if (file.size > FILE_OPEN_BYTE_LIMIT) {
        return { kind: "too-large", size: file.size };
      }

      const text = await file.text();
      return {
        kind: "reloaded",
        text,
        signature: createFileSignature(file, text)
      };
    } catch (error) {
      return { kind: "failed", message: errorMessage(error, "重新载入文件失败。") };
    }
  },

  async saveTextFile(request: SaveTextFileRequest): Promise<SaveTextFileResult> {
    try {
      const permission = await requestWritePermission(request.handle);
      if (permission !== "granted") {
        return { kind: "permission-needed" };
      }

      const currentFile = await request.handle.getFile();
      const currentText = await currentFile.text();
      const currentSignature = createFileSignature(currentFile, currentText);

      if (!request.force && currentSignature.contentHash !== request.expectedSignature.contentHash) {
        return { kind: "conflict", diskSignature: currentSignature };
      }

      const writable = await request.handle.createWritable();
      await writable.write(request.text);
      await writable.close();

      const savedFile = await request.handle.getFile();
      const savedText = await savedFile.text();

      return {
        kind: "saved",
        signature: createFileSignature(savedFile, savedText)
      };
    } catch (error) {
      return { kind: "failed", message: errorMessage(error, "保存文件失败。") };
    }
  },

  createDownloadFallback(name: string, text: string) {
    const documentRef = getTextPreviewWindow().document;
    const url = URL.createObjectURL(new Blob([text], { type: "text/plain;charset=utf-8" }));
    const link = documentRef.createElement("a");
    link.href = url;
    link.download = name;
    link.click();
    URL.revokeObjectURL(url);
  }
};

export function createContentHash(text: string) {
  const bytes = textEncoder.encode(text);
  let hash = 0x811c9dc5;

  for (const byte of bytes) {
    hash ^= byte;
    hash = Math.imul(hash, 0x01000193);
  }

  return `fnv1a32:${(hash >>> 0).toString(16).padStart(8, "0")}`;
}

export function createFileSignature(file: Pick<File, "lastModified" | "size">, text: string): FileSignature {
  return {
    contentHash: createContentHash(text),
    lastModified: file.lastModified,
    size: file.size
  };
}

function createFileId() {
  if (globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID();
  }
  return `file-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

async function requestWritePermission(handle: TextPreviewFileSystemFileHandle): Promise<PermissionState> {
  const descriptor = { mode: "readwrite" as const };
  const current = await handle.queryPermission?.(descriptor);
  if (current === "granted") return current;
  return (await handle.requestPermission?.(descriptor)) ?? "denied";
}

function isAbortError(error: unknown) {
  return error instanceof DOMException && error.name === "AbortError";
}

function errorMessage(error: unknown, fallback: string) {
  return error instanceof Error && error.message ? error.message : fallback;
}

function getTextPreviewWindow() {
  return window as TextPreviewWindow;
}
