import { resolveConflicts } from "./conflictResolver";
import { applyResultLimits } from "./limits";
import { getLineStarts } from "./line";
import { checkInputSize } from "./sizeGuard";
import { commandParser } from "./parsers/command";
import { ipParser } from "./parsers/ip";
import { pathParser } from "./parsers/path";
import { urlParser } from "./parsers/url";
import type { ExtractedItem, PipelineResult, TextParser } from "./types";

export const parsers: TextParser[] = [
  urlParser,
  ipParser,
  commandParser,
  pathParser
];

export function parseText(input: string, activeParsers = parsers): PipelineResult {
  const size = checkInputSize(input);
  const warnings = [...size.warnings];

  if (!size.canParse) {
    return {
      items: [],
      warnings,
      diagnostics: {
        parserCounts: {},
        droppedCandidates: [],
        failedParsers: [],
        totalBeforeLimits: 0,
        totalAfterLimits: 0
      }
    };
  }

  const context = {
    lineStarts: getLineStarts(input)
  };
  const parserCounts: Record<string, number> = {};
  const failedParsers: string[] = [];
  const allItems: ExtractedItem[] = [];

  for (const parser of activeParsers) {
    try {
      const items = parser.parse(input, context);
      parserCounts[parser.name] = items.length;
      allItems.push(...items);
    } catch {
      parserCounts[parser.name] = 0;
      failedParsers.push(parser.name);
      warnings.push({
        code: "parser-failed",
        parserName: parser.name,
        message: `部分解析器失败：${parser.name}。已保留其他识别结果。`
      });
    }
  }

  const conflictResult = resolveConflicts(allItems);
  const limitResult = applyResultLimits(conflictResult.items);
  warnings.push(...limitResult.warnings);

  return {
    items: limitResult.items,
    warnings,
    diagnostics: {
      parserCounts,
      droppedCandidates: conflictResult.droppedCandidates,
      failedParsers,
      totalBeforeLimits: conflictResult.items.length,
      totalAfterLimits: limitResult.items.length
    }
  };
}
