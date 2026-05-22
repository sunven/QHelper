import { stableItemId } from "../id";
import { getLineNumber } from "../line";
import type { ExtractedItem, TextParser } from "../types";

const ipv4Pattern = /(?<![\d.])(?:\d{1,3}\.){3}\d{1,3}(?![\d.])/g;

export const ipParser: TextParser = {
  name: "ip",
  parse(input, context) {
    const items: ExtractedItem[] = [];

    for (const match of input.matchAll(ipv4Pattern)) {
      const value = match[0];
      const start = match.index ?? 0;
      const octets = value.split(".").map(Number);
      if (octets.some((octet) => !Number.isInteger(octet) || octet < 0 || octet > 255)) {
        continue;
      }

      items.push({
        id: stableItemId("ip", start, start + value.length, value),
        type: "ip",
        label: "确定 IP",
        value,
        copyValue: value,
        confidence: "high",
        start,
        end: start + value.length,
        lineNumber: getLineNumber(context.lineStarts, start),
        evidence: ["IPv4 四段均在 0-255 范围内"]
      });
    }

    return items;
  }
};
