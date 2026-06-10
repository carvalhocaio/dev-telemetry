import {
  COMMIT_MESSAGE_MAX_BYTES,
  PR_BODY_MAX_BYTES,
} from "@dev-telemetry/db/schema";

/**
 * Truncates a UTF-8 string so its byte length does not exceed `maxBytes`.
 * Splits on a codepoint boundary to avoid generating invalid sequences.
 */
export function capBytes(str: string, maxBytes: number): string {
  const buf = Buffer.from(str, "utf8");
  if (buf.byteLength <= maxBytes) return str;
  // Walk backwards from the byte limit to find a safe codepoint boundary.
  let end = maxBytes;
  while (end > 0 && (buf[end]! & 0xc0) === 0x80) end--;
  return buf.slice(0, end).toString("utf8");
}

export const capCommitMessage = (msg: string) =>
  capBytes(msg, COMMIT_MESSAGE_MAX_BYTES);

export const capPrBody = (body: string) => capBytes(body, PR_BODY_MAX_BYTES);

// ---------------------------------------------------------------------------
// Byte estimation for quota accounting.
// These are rough estimates — precision is not critical, only the magnitude.
// ---------------------------------------------------------------------------

const COMMIT_FIXED_OVERHEAD = 256; // id, userId, repoId, sha, timestamps, url
const PR_FIXED_OVERHEAD = 512; // id, userId, repoId, number, title, timestamps, url

export function estimateCommitBytes(message: string): number {
  return COMMIT_FIXED_OVERHEAD + Buffer.byteLength(message, "utf8");
}

export function estimatePrBytes(title: string, body: string | null): number {
  return (
    PR_FIXED_OVERHEAD +
    Buffer.byteLength(title, "utf8") +
    (body ? Buffer.byteLength(body, "utf8") : 0)
  );
}

/** 3 GB default; override with USER_STORAGE_QUOTA_BYTES env var. */
export const QUOTA_BYTES =
  typeof process !== "undefined" && process.env["USER_STORAGE_QUOTA_BYTES"]
    ? parseInt(process.env["USER_STORAGE_QUOTA_BYTES"], 10)
    : 3 * 1024 * 1024 * 1024;

export function isWithinQuota(bytesUsed: number, quotaBytes: number): boolean {
  return bytesUsed < quotaBytes;
}
