import { describe, expect, it } from "vitest";
import { GROUP_LABELS, GROUP_ORDER } from "./types";

describe("parser result grouping", () => {
  it("uses the approved Text Preview result group order and labels", () => {
    expect(GROUP_ORDER).toEqual(["ip", "url", "command", "path"]);
    expect(GROUP_LABELS).toEqual({
      ip: "IP 地址",
      url: "URL",
      command: "命令",
      path: "路径"
    });
  });
});
