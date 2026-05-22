import { describe, expect, it } from "vitest";
import { FILE_HANDLE_DATABASE_NAME } from "./fileHandleStore";

describe("fileHandleStore", () => {
  it("uses the QHelper namespaced IndexedDB database name", () => {
    expect(FILE_HANDLE_DATABASE_NAME).toBe("qhelper-text-preview-file-handles");
  });
});
