import { describe, expect, it } from "vitest";
import { parseText } from "./pipeline";
import type { TextParser } from "./types";

describe("parseText", () => {
  it("extracts canonical sample into separate copyable values", () => {
    const result = parseText(`192.168.80.45
ls -l $(which kubectl)`);

    expect(result.items.map((item) => [item.type, item.copyValue])).toEqual([
      ["ip", "192.168.80.45"],
      ["command", "ls -l $(which kubectl)"]
    ]);
  });

  it("does not extract password or token-shaped strings", () => {
    const result = parseText("password=wd)Q6aR!2C1a token=ghp_exampleSyntheticToken");

    expect(result.items).toEqual([]);
  });

  it("does not duplicate URL path as a path result", () => {
    const result = parseText("curl https://example.internal/api/v1/pods");
    const valuesByType = result.items.map((item) => `${item.type}:${item.copyValue}`);

    expect(valuesByType).toContain("command:curl https://example.internal/api/v1/pods");
    expect(valuesByType).toContain("url:https://example.internal/api/v1/pods");
    expect(valuesByType.some((value) => value.startsWith("path:/api/v1"))).toBe(false);
  });

  it("keeps command and nested path as separately copyable objects", () => {
    const result = parseText("kubectl --kubeconfig ~/.kube/config get pods");
    const valuesByType = result.items.map((item) => `${item.type}:${item.copyValue}`);

    expect(valuesByType).toContain("command:kubectl --kubeconfig ~/.kube/config get pods");
    expect(valuesByType).toContain("path:~/.kube/config");
  });

  it("isolates parser failure and keeps partial results", () => {
    const failingParser: TextParser = {
      name: "broken",
      parse() {
        throw new Error("boom");
      }
    };

    const result = parseText("192.168.80.45", [failingParser]);
    expect(result.items).toEqual([]);
    expect(result.warnings[0]?.message).toContain("部分解析器失败");
    expect(result.diagnostics.failedParsers).toEqual(["broken"]);
  });

  it("hard stops over 1MB", () => {
    const result = parseText("a".repeat(1024 * 1024 + 1));

    expect(result.items).toEqual([]);
    expect(result.warnings[0]?.code).toBe("hard-stop");
  });

  it("warns over 200KB and still parses", () => {
    const result = parseText(`${"x".repeat(205 * 1024)}\n192.168.80.45`);

    expect(result.warnings.some((warning) => warning.code === "large-input")).toBe(true);
    expect(result.items.some((item) => item.copyValue === "192.168.80.45")).toBe(true);
  });

  it("caps results to 200 per type", () => {
    const input = Array.from({ length: 205 }, (_, index) => `10.0.0.${index % 250}`).join("\n");
    const result = parseText(input);

    expect(result.items.filter((item) => item.type === "ip")).toHaveLength(200);
    expect(result.warnings.some((warning) => warning.code === "truncated-type")).toBe(true);
  });

  it("caps all current result types when they exceed per-type limits", () => {
    const types = ["ip", "url", "path", "command"] as const;
    const parser: TextParser = {
      name: "bulk",
      parse() {
        return types.flatMap((type, typeIndex) =>
          Array.from({ length: 205 }, (_, itemIndex) => {
            const index = typeIndex * 1000 + itemIndex;
            return {
              id: `bulk-${type}-${itemIndex}`,
              type,
              label: "bulk",
              value: `value-${type}-${itemIndex}`,
              copyValue: `value-${type}-${itemIndex}`,
              confidence: "high",
              start: index * 10,
              end: index * 10 + 4,
              lineNumber: index + 1,
              evidence: ["test bulk item"]
            };
          })
        );
      }
    };
    const result = parseText("bulk", [parser]);

    expect(result.items).toHaveLength(800);
    expect(result.warnings.filter((warning) => warning.code === "truncated-type")).toHaveLength(4);
  });

  it("parses 200KB input inside the performance budget", () => {
    const input = Array.from({ length: 5000 }, (_, index) => `line ${index} 10.2.0.${index % 250}`).join("\n");
    const startedAt = performance.now();

    parseText(input);

    expect(performance.now() - startedAt).toBeLessThan(250);
  });
});
