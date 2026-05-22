export type CopyResult =
  | { ok: true }
  | { ok: false; reason: "unsupported" | "blocked" };

export async function copyText(value: string): Promise<CopyResult> {
  if (!navigator.clipboard?.writeText) {
    return { ok: false, reason: "unsupported" };
  }

  try {
    await navigator.clipboard.writeText(value);
    return { ok: true };
  } catch {
    return { ok: false, reason: "blocked" };
  }
}
