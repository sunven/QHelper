import type { PipelineWarning } from "./types";

export const LARGE_INPUT_BYTES = 200 * 1024;
export const HARD_STOP_BYTES = 1024 * 1024;

export type SizeGuardResult = {
  canParse: boolean;
  byteLength: number;
  warnings: PipelineWarning[];
};

const encoder = new TextEncoder();

export function checkInputSize(input: string): SizeGuardResult {
  const byteLength = encoder.encode(input).byteLength;

  if (byteLength > HARD_STOP_BYTES) {
    return {
      canParse: false,
      byteLength,
      warnings: [
        {
          code: "hard-stop",
          message: "文本超过 1MB，已停止解析，避免浏览器卡死。请删减后重试。"
        }
      ]
    };
  }

  if (byteLength > LARGE_INPUT_BYTES) {
    return {
      canParse: true,
      byteLength,
      warnings: [
        {
          code: "large-input",
          message: "文本较大，解析可能变慢；仍会在本地继续处理。"
        }
      ]
    };
  }

  return {
    canParse: true,
    byteLength,
    warnings: []
  };
}
