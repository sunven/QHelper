import { stableItemId } from "../id";
import { getLineStarts, getLineText } from "../line";
import type { ExtractedItem, TextParser } from "../types";

const commandStarters = new Set([
  "awk",
  "cat",
  "chmod",
  "chown",
  "cp",
  "curl",
  "docker",
  "du",
  "echo",
  "find",
  "git",
  "grep",
  "helm",
  "journalctl",
  "jq",
  "kubectl",
  "less",
  "ls",
  "mkdir",
  "mv",
  "netstat",
  "node",
  "npm",
  "openssl",
  "ping",
  "ps",
  "python",
  "python3",
  "rm",
  "rsync",
  "scp",
  "sed",
  "ssh",
  "sudo",
  "tail",
  "tar",
  "terraform",
  "top",
  "traceroute",
  "which",
  "yarn"
]);

export const commandParser: TextParser = {
  name: "command",
  parse(input) {
    const items: ExtractedItem[] = [];
    const lineStarts = getLineStarts(input);

    for (const [lineIndex, lineStart] of lineStarts.entries()) {
      const line = getLineText(input, lineStart);
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;

      const leadingWhitespace = line.length - line.trimStart().length;
      const commandStart = lineStart + leadingWhitespace;
      const normalized = stripPrompt(trimmed);
      const promptOffset = trimmed.length - normalized.length;
      const value = normalized.trim();
      const actualStart = commandStart + promptOffset + (normalized.length - normalized.trimStart().length);

      if (!looksLikeCommand(value)) continue;

      items.push({
        id: stableItemId("command", actualStart, actualStart + value.length, value),
        type: "command",
        label: "疑似 shell",
        value,
        copyValue: value,
        confidence: hasCommandSignal(value) ? "medium" : "low",
        start: actualStart,
        end: actualStart + value.length,
        lineNumber: lineIndex + 1,
        evidence: commandEvidence(value)
      });
    }

    return items;
  }
};

function stripPrompt(value: string): string {
  return value.replace(/^(?:[$#>]\s+|[\w.-]+@[\w.-]+:[^\s]+[$#]\s+)/, "");
}

function looksLikeCommand(value: string): boolean {
  const firstToken = value.split(/\s+/)[0] ?? "";
  const pathParts = firstToken.split("/");
  const executable = firstToken.includes("/") ? pathParts[pathParts.length - 1] ?? firstToken : firstToken;
  return commandStarters.has(executable) && (value.includes(" ") || hasCommandSignal(value));
}

function hasCommandSignal(value: string): boolean {
  return /(?:\$\(|\||&&|\|\||>|<|--?[A-Za-z0-9-]+|\$\w+)/.test(value);
}

function commandEvidence(value: string): string[] {
  const evidence = ["以常见 shell 命令开头"];
  if (/\$\(/.test(value)) evidence.push("包含命令替换 `$()`");
  if (/\|/.test(value)) evidence.push("包含管道");
  if (/--?[A-Za-z0-9-]+/.test(value)) evidence.push("包含命令参数");
  return evidence;
}
