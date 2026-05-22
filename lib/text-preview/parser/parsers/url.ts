import { stableItemId } from "../id";
import { getLineNumber } from "../line";
import type { ExtractedItem, TextParser } from "../types";

const urlPattern = /\bhttps?:\/\/[^\s<>"'`]+/g;
const trailingPunctuation = /[),.;!?]+$/;

export const urlParser: TextParser = {
  name: "url",
  parse(input, context) {
    const items: ExtractedItem[] = [];

    for (const match of input.matchAll(urlPattern)) {
      const raw = match[0];
      const value = raw.replace(trailingPunctuation, "");
      const start = match.index ?? 0;
      if (!value.includes(".")) continue;

      items.push({
        id: stableItemId("url", start, start + value.length, value),
        type: "url",
        label: "确定 URL",
        value,
        copyValue: value,
        confidence: "high",
        start,
        end: start + value.length,
        lineNumber: getLineNumber(context.lineStarts, start),
        evidence: ["包含 http:// 或 https:// 协议"]
      });
    }

    return items;
  }
};
