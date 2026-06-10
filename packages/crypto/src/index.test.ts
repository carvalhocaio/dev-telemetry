import { describe, expect, it } from "vitest";
import { createCrypto } from "./index.js";

// 32-byte test key (never use in production).
const TEST_KEY = "0".repeat(64);

describe("createCrypto", () => {
  it("throws if the key is not 32 bytes", () => {
    expect(() => createCrypto("deadbeef")).toThrow("32 bytes");
  });

  it("encrypt produces iv:data:tag format", () => {
    const { encrypt } = createCrypto(TEST_KEY);
    const result = encrypt("hello");
    const parts = result.split(":");
    expect(parts).toHaveLength(3);
    const [iv, , tag] = parts as [string, string, string];
    expect(iv).toHaveLength(24); // 12 bytes * 2 hex chars
    expect(tag).toHaveLength(32); // 16 bytes * 2 hex chars
  });

  it("decrypt round-trips plaintext", () => {
    const { encrypt, decrypt } = createCrypto(TEST_KEY);
    const plaintext = "github_pat_supersecret_token_value_123";
    expect(decrypt(encrypt(plaintext))).toBe(plaintext);
  });

  it("each encrypt call produces a different ciphertext (unique IVs)", () => {
    const { encrypt } = createCrypto(TEST_KEY);
    const a = encrypt("same");
    const b = encrypt("same");
    expect(a).not.toBe(b);
  });

  it("decrypt throws on tampered ciphertext", () => {
    const { encrypt, decrypt } = createCrypto(TEST_KEY);
    const parts = encrypt("secret").split(":");
    // Flip one bit in the ciphertext segment.
    const tampered = parts[1]!.slice(0, -1) + (parts[1]!.slice(-1) === "0" ? "1" : "0");
    expect(() => decrypt(`${parts[0]}:${tampered}:${parts[2]}`)).toThrow();
  });

  it("decrypt throws on malformed input", () => {
    const { decrypt } = createCrypto(TEST_KEY);
    expect(() => decrypt("notvalid")).toThrow("Invalid ciphertext format");
  });

  it("round-trips unicode and long strings", () => {
    const { encrypt, decrypt } = createCrypto(TEST_KEY);
    const unicode = "テスト 🔐 special çhàrs";
    expect(decrypt(encrypt(unicode))).toBe(unicode);
    const long = "x".repeat(4096);
    expect(decrypt(encrypt(long))).toBe(long);
  });
});
