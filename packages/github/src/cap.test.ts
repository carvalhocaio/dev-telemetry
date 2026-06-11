import { describe, expect, it } from "vitest";
import {
  capBytes,
  capCommitMessage,
  capPrBody,
  estimateCommitBytes,
  estimatePrBytes,
  isWithinQuota,
  QUOTA_BYTES,
} from "./cap.js";

describe("capBytes", () => {
  it("returns the string unchanged when under the limit", () => {
    expect(capBytes("hello", 100)).toBe("hello");
  });

  it("truncates ASCII to the exact byte limit", () => {
    const result = capBytes("abcde", 3);
    expect(result).toBe("abc");
    expect(Buffer.byteLength(result, "utf8")).toBeLessThanOrEqual(3);
  });

  it("does not split a multi-byte UTF-8 character", () => {
    // "é" is 2 bytes (U+00E9). With a 1-byte limit it should be dropped entirely.
    const result = capBytes("é", 1);
    expect(Buffer.byteLength(result, "utf8")).toBeLessThanOrEqual(1);
  });

  it("handles emoji correctly (4-byte codepoints)", () => {
    // "🔐" is 4 bytes. With a 5-byte limit it fits; with a 3-byte limit it should be dropped.
    expect(Buffer.byteLength(capBytes("🔐", 4), "utf8")).toBeLessThanOrEqual(4);
    expect(Buffer.byteLength(capBytes("🔐", 3), "utf8")).toBeLessThanOrEqual(3);
  });

  it("returns empty string when limit is 0", () => {
    expect(capBytes("hello", 0)).toBe("");
  });
});

describe("capCommitMessage / capPrBody", () => {
  it("capCommitMessage passes through short messages", () => {
    const short = "feat: add feature";
    expect(capCommitMessage(short)).toBe(short);
  });

  it("capCommitMessage truncates messages > 4 KB", () => {
    const long = "x".repeat(5000);
    const result = capCommitMessage(long);
    expect(Buffer.byteLength(result, "utf8")).toBeLessThanOrEqual(4 * 1024);
  });

  it("capPrBody truncates bodies > 16 KB", () => {
    const long = "y".repeat(20000);
    const result = capPrBody(long);
    expect(Buffer.byteLength(result, "utf8")).toBeLessThanOrEqual(16 * 1024);
  });
});

describe("estimateCommitBytes / estimatePrBytes", () => {
  it("returns a positive number for a non-empty message", () => {
    expect(estimateCommitBytes("feat: add feature")).toBeGreaterThan(0);
  });

  it("is larger for longer messages", () => {
    expect(estimateCommitBytes("x".repeat(100))).toBeGreaterThan(
      estimateCommitBytes("x"),
    );
  });

  it("accounts for PR body when present", () => {
    const withBody = estimatePrBytes("title", "body text");
    const withoutBody = estimatePrBytes("title", null);
    expect(withBody).toBeGreaterThan(withoutBody);
  });
});

describe("isWithinQuota", () => {
  it("returns true when bytes used is less than quota", () => {
    expect(isWithinQuota(100, 200)).toBe(true);
  });

  it("returns false when bytes used equals quota", () => {
    expect(isWithinQuota(200, 200)).toBe(false);
  });

  it("QUOTA_BYTES is 3 GB by default", () => {
    expect(QUOTA_BYTES).toBe(3 * 1024 * 1024 * 1024);
  });
});
