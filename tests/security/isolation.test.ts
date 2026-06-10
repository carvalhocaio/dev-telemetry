import { describe, expect, it } from "vitest";
import { createCrypto } from "@dev-telemetry/crypto";
import { isWithinQuota, QUOTA_BYTES, capCommitMessage, capPrBody } from "@dev-telemetry/github";

/**
 * Security tests — verify security properties: secret encryption strength,
 * data isolation invariants, field cap enforcement (anti-injection), and quota
 * boundary checks.
 *
 * isWithinQuota(bytesUsed, quotaBytes): returns true when bytesUsed < quotaBytes.
 */

describe("secret encryption — AES-256-GCM", () => {
  const KEY = "f".repeat(64);

  it("plaintext is never present in ciphertext", () => {
    const { encrypt } = createCrypto(KEY);
    const secret = "ghp_my_super_secret_token";
    const ciphertext = encrypt(secret);
    expect(ciphertext).not.toContain(secret);
  });

  it("ciphertext contains no whitespace or newlines (safe for storage)", () => {
    const { encrypt } = createCrypto(KEY);
    const ciphertext = encrypt("api-key-value");
    expect(ciphertext).not.toMatch(/\s/);
  });

  it("different keys cannot decrypt each other's ciphertext", () => {
    const keyA = "a".repeat(64);
    const keyB = "b".repeat(64);
    const cryptoA = createCrypto(keyA);
    const cryptoB = createCrypto(keyB);
    const ciphertext = cryptoA.encrypt("sensitive");
    expect(() => cryptoB.decrypt(ciphertext)).toThrow();
  });

  it("key shorter than 32 bytes is rejected", () => {
    expect(() => createCrypto("tooshort")).toThrow("32 bytes");
  });

  it("key longer than 32 bytes is rejected", () => {
    expect(() => createCrypto("a".repeat(66))).toThrow("32 bytes");
  });

  it("decryption of malformed ciphertext fails gracefully", () => {
    const { decrypt } = createCrypto(KEY);
    expect(() => decrypt("")).toThrow();
    expect(() => decrypt("invalid")).toThrow();
  });
});

describe("field caps — anti-oversized-payload", () => {
  it("commit message: oversized payload is truncated, not rejected", () => {
    const huge = "A".repeat(100_000);
    const capped = capCommitMessage(huge);
    expect(Buffer.byteLength(capped, "utf-8")).toBeLessThanOrEqual(4096);
  });

  it("PR body: oversized payload is truncated, not rejected", () => {
    const huge = "B".repeat(500_000);
    const capped = capPrBody(huge);
    expect(Buffer.byteLength(capped, "utf-8")).toBeLessThanOrEqual(16384);
  });

  it("empty strings are handled without throwing", () => {
    expect(() => capCommitMessage("")).not.toThrow();
    expect(() => capPrBody("")).not.toThrow();
  });
});

describe("quota enforcement — abuse prevention", () => {
  it("adding bytes that exceed quota is rejected", () => {
    // At full quota, even 1 byte more should be rejected
    expect(isWithinQuota(QUOTA_BYTES, QUOTA_BYTES)).toBe(false);
  });

  it("usage well under quota is allowed", () => {
    expect(isWithinQuota(0, QUOTA_BYTES)).toBe(true);
    expect(isWithinQuota(100 * 1024 * 1024, QUOTA_BYTES)).toBe(true); // 100 MB
  });

  it("usage just under quota is allowed", () => {
    expect(isWithinQuota(QUOTA_BYTES - 1, QUOTA_BYTES)).toBe(true);
  });
});
