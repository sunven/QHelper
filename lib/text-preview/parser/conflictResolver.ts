import type { DroppedCandidate, ExtractedItem } from "./types";

const priority: Record<ExtractedItem["type"], number> = {
  url: 5,
  command: 4,
  ip: 3,
  path: 2
};

export type ConflictResult = {
  items: ExtractedItem[];
  droppedCandidates: DroppedCandidate[];
};

export function resolveConflicts(items: ExtractedItem[]): ConflictResult {
  const ordered = [...items].sort((left, right) => {
    const byPriority = priority[right.type] - priority[left.type];
    if (byPriority !== 0) return byPriority;
    const byLength = right.end - right.start - (left.end - left.start);
    if (byLength !== 0) return byLength;
    return left.start - right.start;
  });

  const accepted: ExtractedItem[] = [];
  const droppedCandidates: DroppedCandidate[] = [];

  for (const candidate of ordered) {
    const conflict = accepted.find((item) => overlaps(item, candidate));
    if (!conflict) {
      accepted.push(candidate);
      continue;
    }

    if (candidate.type === conflict.type) {
      droppedCandidates.push({
        parserName: candidate.type,
        value: candidate.value,
        reason: `overlaps accepted ${conflict.type}`,
        start: candidate.start,
        end: candidate.end
      });
      continue;
    }

    if (candidate.type === "path" && conflict.type === "url") {
      droppedCandidates.push({
        parserName: "path",
        value: candidate.value,
        reason: "URL 内部路径默认不重复展示",
        start: candidate.start,
        end: candidate.end
      });
      continue;
    }

    accepted.push(candidate);
  }

  return {
    items: accepted.sort((left, right) => left.start - right.start),
    droppedCandidates
  };
}

function overlaps(left: ExtractedItem, right: ExtractedItem): boolean {
  return left.start < right.end && right.start < left.end;
}
