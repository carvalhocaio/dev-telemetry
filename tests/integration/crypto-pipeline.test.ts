import { describe, expect, it } from "vitest";
import { createCrypto } from "@dev-telemetry/crypto";

/**
 * Integration tests — verify that components interact correctly across
 * module boundaries. No external services; DB is mocked where needed.
 */

const KEY = "a".repeat(64); // 32 bytes hex

describe("crypto pipeline integration", () => {
  it("encrypts and decrypts a GitHub PAT correctly", () => {
    const { encrypt, decrypt } = createCrypto(KEY);
    const pat = "ghp_abcdefghijklmnopqrstuvwxyz123456";
    const ciphertext = encrypt(pat);
    expect(ciphertext).not.toBe(pat);
    expect(decrypt(ciphertext)).toBe(pat);
  });

  it("encrypts and decrypts an LLM API key correctly", () => {
    const { encrypt, decrypt } = createCrypto(KEY);
    const llmKey = "sk-proj-" + "x".repeat(48);
    expect(decrypt(encrypt(llmKey))).toBe(llmKey);
  });

  it("each encryption of the same value produces a unique ciphertext (IV randomization)", () => {
    const { encrypt } = createCrypto(KEY);
    const secret = "same-secret-value";
    const results = new Set(Array.from({ length: 10 }, () => encrypt(secret)));
    expect(results.size).toBe(10);
  });

  it("ciphertext format is iv:data:tag", () => {
    const { encrypt } = createCrypto(KEY);
    const parts = encrypt("value").split(":");
    expect(parts).toHaveLength(3);
    const [iv, , tag] = parts as [string, string, string];
    // 12-byte IV → 24 hex chars; 16-byte GCM tag → 32 hex chars
    expect(iv).toHaveLength(24);
    expect(tag).toHaveLength(32);
  });

  it("tampered ciphertext is rejected (GCM authentication)", () => {
    const { encrypt, decrypt } = createCrypto(KEY);
    const parts = encrypt("sensitive-data").split(":");
    const flipped = parts[1]!.slice(0, -1) + (parts[1]!.slice(-1) === "0" ? "1" : "0");
    expect(() => decrypt(`${parts[0]}:${flipped}:${parts[2]}`)).toThrow();
  });
});
