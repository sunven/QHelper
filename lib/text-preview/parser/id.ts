import type { ExtractedItemType } from "./types";

export function stableItemId(
  type: ExtractedItemType,
  start: number,
  end: number,
  value: string
): string {
  return `${type}:${start}:${end}:${fnv1a(value)}`;
}

export function fnv1a(value: string): string {
  let hash = 0x811c9dc5;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}
