export type ExtractedItemType = "ip" | "url" | "path" | "command";

export type Confidence = "high" | "medium" | "low";

export type ExtractedItem = {
  id: string;
  type: ExtractedItemType;
  label: string;
  value: string;
  copyValue: string;
  confidence: Confidence;
  start: number;
  end: number;
  lineNumber: number;
  evidence: string[];
};

export type PipelineWarning = {
  code:
    | "large-input"
    | "hard-stop"
    | "parser-failed"
    | "truncated-type"
    | "truncated-total";
  message: string;
  parserName?: string;
};

export type ParserDiagnostics = {
  parserCounts: Record<string, number>;
  droppedCandidates: DroppedCandidate[];
  failedParsers: string[];
  totalBeforeLimits: number;
  totalAfterLimits: number;
};

export type DroppedCandidate = {
  parserName: string;
  value: string;
  reason: string;
  start: number;
  end: number;
};

export type PipelineResult = {
  items: ExtractedItem[];
  warnings: PipelineWarning[];
  diagnostics: ParserDiagnostics;
};

export type ParserContext = {
  lineStarts: number[];
};

export type TextParser = {
  name: string;
  parse: (input: string, context: ParserContext) => ExtractedItem[];
};

export const GROUP_ORDER: ExtractedItemType[] = [
  "ip",
  "url",
  "command",
  "path"
];

export const GROUP_LABELS: Record<ExtractedItemType, string> = {
  ip: "IP 地址",
  url: "URL",
  command: "命令",
  path: "路径"
};
