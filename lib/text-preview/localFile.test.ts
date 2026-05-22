import { afterEach, describe, expect, it, vi } from "vitest";
import type { TextPreviewFileSystemFileHandle } from "./fileSystemAccessTypes";
import { browserLocalFileAccess, createContentHash, createFileSignature, FILE_OPEN_BYTE_LIMIT } from "./localFile";

describe("localFile", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("creates stable content hashes", () => {
    expect(createContentHash("10.0.0.1")).toBe(createContentHash("10.0.0.1"));
    expect(createContentHash("10.0.0.1")).not.toBe(createContentHash("10.0.0.2"));
  });

  it("opens selected files as text without extension filters", async () => {
    const handle = createFakeHandle("# title", { name: "notes.md" });
    const picker = vi.fn(async () => [handle]);
    vi.stubGlobal("window", { showOpenFilePicker: picker });

    const result = await browserLocalFileAccess.openTextFiles();

    expect(picker).toHaveBeenCalledWith({
      excludeAcceptAllOption: false,
      multiple: true
    });
    expect(result).toMatchObject({
      cancelled: false,
      files: [
        {
          name: "notes.md",
          text: "# title"
        }
      ],
      rejected: []
    });
  });

  it("saves when disk content still matches the expected signature", async () => {
    const handle = createFakeHandle("10.0.0.1");
    const expectedSignature = createFileSignature(await handle.getFile(), "10.0.0.1");

    const result = await browserLocalFileAccess.saveTextFile({
      handle,
      expectedSignature,
      text: "10.0.0.2"
    });

    expect(result.kind).toBe("saved");
    await expect((await handle.getFile()).text()).resolves.toBe("10.0.0.2");
  });

  it("blocks save when disk content hash changed externally", async () => {
    const handle = createFakeHandle("10.0.0.1");
    const expectedSignature = createFileSignature(await handle.getFile(), "10.0.0.1");
    handle.setText("10.0.0.3");

    const result = await browserLocalFileAccess.saveTextFile({
      handle,
      expectedSignature,
      text: "10.0.0.2"
    });

    expect(result.kind).toBe("conflict");
    await expect((await handle.getFile()).text()).resolves.toBe("10.0.0.3");
  });

  it("returns permission-needed when write permission is denied", async () => {
    const handle = createFakeHandle("10.0.0.1", { permission: "denied" });
    const expectedSignature = createFileSignature(await handle.getFile(), "10.0.0.1");

    const result = await browserLocalFileAccess.saveTextFile({
      handle,
      expectedSignature,
      text: "10.0.0.2"
    });

    expect(result).toEqual({ kind: "permission-needed" });
  });

  it("rejects reloads over the file open byte limit", async () => {
    const handle = createFakeHandle("x".repeat(FILE_OPEN_BYTE_LIMIT + 1));

    const result = await browserLocalFileAccess.reloadTextFile(handle);

    expect(result).toMatchObject({ kind: "too-large", size: FILE_OPEN_BYTE_LIMIT + 1 });
  });
});

function createFakeHandle(
  initialText: string,
  options: { name?: string; permission?: PermissionState } = {}
): TextPreviewFileSystemFileHandle & { setText: (text: string) => void } {
  let text = initialText;
  let lastModified = 100;
  const name = options.name ?? "hosts.txt";
  const permission = options.permission ?? "granted";

  return {
    kind: "file",
    name,
    async getFile() {
      return new File([text], name, { lastModified, type: "text/plain" });
    },
    async createWritable() {
      return {
        async write(data) {
          text = String(data);
          lastModified += 1;
        },
        async close() {}
      };
    },
    async queryPermission() {
      return permission;
    },
    async requestPermission() {
      return permission;
    },
    setText(nextText: string) {
      text = nextText;
      lastModified += 1;
    }
  };
}
