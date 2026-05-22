import { stableItemId } from "../id";
import { getLineNumber } from "../line";
import type { ExtractedItem, TextParser } from "../types";

const pathPattern = /(?<![\w:])(?:~|\/)[A-Za-z0-9._~/-]*(?:\/[A-Za-z0-9._~-]+)+(?![\w.-])/g;

export const pathParser: TextParser = {
  name: "path",
  parse(input, context) {
    const items: ExtractedItem[] = [];

    for (const match of input.matchAll(pathPattern)) {
      const value = trimPath(match[0]);
      const start = match.index ?? 0;
      if (value.length < 2 || value === "//") continue;

      items.push({
        id: stableItemId("path", start, start + value.length, value),
        type: "path",
        label: "疑似路径",
        value,
        copyValue: value,
        confidence: value.startsWith("/") || value.startsWith("~/") ? "medium" : "low",
        start,
        end: start + value.length,
        lineNumber: getLineNumber(context.lineStarts, start),
        evidence: ["匹配 Unix 路径形态"]
      });
    }

    return items;
  }
};

function trimPath(value: string): string {
  return value.replace(/[),.;!?]+$/, "");
}
