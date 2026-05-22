import type { ExtractedItem, PipelineWarning } from "./types";

const PER_TYPE_LIMIT = 200;
const TOTAL_LIMIT = 1000;

export type LimitResult = {
  items: ExtractedItem[];
  warnings: PipelineWarning[];
};

export function applyResultLimits(items: ExtractedItem[]): LimitResult {
  const warnings: PipelineWarning[] = [];
  const byTypeCount = new Map<ExtractedItem["type"], number>();
  const perTypeLimited: ExtractedItem[] = [];
  const hiddenByType = new Map<ExtractedItem["type"], number>();

  for (const item of items) {
    const nextCount = (byTypeCount.get(item.type) ?? 0) + 1;
    byTypeCount.set(item.type, nextCount);

    if (nextCount <= PER_TYPE_LIMIT) {
      perTypeLimited.push(item);
    } else {
      hiddenByType.set(item.type, (hiddenByType.get(item.type) ?? 0) + 1);
    }
  }

  for (const [type, count] of hiddenByType) {
    warnings.push({
      code: "truncated-type",
      message: `${type} 结果超过 ${PER_TYPE_LIMIT} 条，已隐藏 ${count} 条。`
    });
  }

  if (perTypeLimited.length > TOTAL_LIMIT) {
    warnings.push({
      code: "truncated-total",
      message: `总结果超过 ${TOTAL_LIMIT} 条，已隐藏 ${perTypeLimited.length - TOTAL_LIMIT} 条。`
    });
  }

  return {
    items: perTypeLimited.slice(0, TOTAL_LIMIT),
    warnings
  };
}
