export function getLineStarts(input: string): number[] {
  const starts = [0];
  for (let index = 0; index < input.length; index += 1) {
    if (input[index] === "\n") {
      starts.push(index + 1);
    }
  }
  return starts;
}

export function getLineNumber(lineStarts: number[], offset: number): number {
  let low = 0;
  let high = lineStarts.length - 1;

  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    const start = lineStarts[mid] ?? 0;
    const nextStart = lineStarts[mid + 1] ?? Number.POSITIVE_INFINITY;

    if (offset >= start && offset < nextStart) {
      return mid + 1;
    }

    if (offset < start) {
      high = mid - 1;
    } else {
      low = mid + 1;
    }
  }

  return lineStarts.length;
}

export function getLineText(input: string, lineStart: number): string {
  const nextBreak = input.indexOf("\n", lineStart);
  const lineEnd = nextBreak === -1 ? input.length : nextBreak;
  return input.slice(lineStart, lineEnd);
}
