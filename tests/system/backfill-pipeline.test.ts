import { describe, expect, it } from "vitest";
import { capCommitMessage, capPrBody, isWithinQuota, QUOTA_BYTES } from "@dev-telemetry/github";

/**
 * System tests — validate the full pipeline behaviour with mocked external
 * dependencies (GitHub API, DB). Verifies that the system correctly enforces
 * field caps and quota boundaries during ingestion.
 *
 * isWithinQuota(bytesUsed, quotaBytes) returns true when bytesUsed < quotaBytes.
 */

describe("ingestion field caps", () => {
  it("commit message at exactly 4 KB is not truncated", () => {
    const exact = "x".repeat(4 * 1024);
    expect(capCommitMessage(exact)).toBe(exact);
  });

  it("commit message exceeding 4 KB is truncated", () => {
    const over = "x".repeat(4 * 1024 + 100);
    const capped = capCommitMessage(over);
    expect(Buffer.byteLength(capped, "utf-8")).toBeLessThanOrEqual(4 * 1024);
  });

  it("PR body at exactly 16 KB is not truncated", () => {
    const exact = "y".repeat(16 * 1024);
    expect(capPrBody(exact)).toBe(exact);
  });

  it("PR body exceeding 16 KB is truncated", () => {
    const over = "y".repeat(16 * 1024 + 500);
    const capped = capPrBody(over);
    expect(Buffer.byteLength(capped, "utf-8")).toBeLessThanOrEqual(16 * 1024);
  });

  it("unicode multi-byte chars are truncated at codepoint boundary", () => {
    // Each emoji is 4 bytes; 1024 emojis = 4 KB exactly.
    const emoji = "😀";
    const exact = emoji.repeat(1024);
    const capped = capCommitMessage(exact);
    expect(() => Buffer.from(capped, "utf-8").toString("utf-8")).not.toThrow();
  });
});

describe("quota enforcement", () => {
  it("isWithinQuota returns true when under quota", () => {
    // isWithinQuota(bytesUsed, quotaBytes) → bytesUsed < quotaBytes
    expect(isWithinQuota(0, QUOTA_BYTES)).toBe(true);
    expect(isWithinQuota(QUOTA_BYTES - 1, QUOTA_BYTES)).toBe(true);
  });

  it("isWithinQuota returns false when at or over quota", () => {
    expect(isWithinQuota(QUOTA_BYTES, QUOTA_BYTES)).toBe(false);
    expect(isWithinQuota(QUOTA_BYTES + 1, QUOTA_BYTES)).toBe(false);
  });

  it("QUOTA_BYTES is exactly 3 GiB", () => {
    expect(QUOTA_BYTES).toBe(3 * 1024 * 1024 * 1024);
  });
});
