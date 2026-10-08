import { describe, expect, it } from "vitest";
import { createCrypto } from "@dev-telemetry/crypto";
import { NarrativeSchema, resolveModel, DEFAULT_MODELS } from "@dev-telemetry/ai";
import {
  buildReport,
  computeMetrics,
} from "@dev-telemetry/core";
import { capCommitMessage, capPrBody, QUOTA_BYTES } from "@dev-telemetry/github";

/**
 * Smoke tests — fast sanity checks that all key package exports are present
 * and return sensible types. No network, no DB, no file I/O.
 */
describe("smoke — package exports", () => {
  it("crypto: createCrypto is callable", () => {
    expect(createCrypto).toBeTypeOf("function");
  });

  it("crypto: round-trips plaintext", () => {
    const { encrypt, decrypt } = createCrypto("0".repeat(64));
    expect(decrypt(encrypt("hello world"))).toBe("hello world");
  });

  it("ai: NarrativeSchema is a Zod schema", () => {
    expect(NarrativeSchema).toBeDefined();
    expect(NarrativeSchema.safeParse).toBeTypeOf("function");
  });

  it("ai: resolveModel is callable", () => {
    expect(resolveModel).toBeTypeOf("function");
  });

  it("ai: DEFAULT_MODELS covers all providers", () => {
    expect(DEFAULT_MODELS).toHaveProperty("gemini");
    expect(DEFAULT_MODELS).toHaveProperty("openai");
    expect(DEFAULT_MODELS).toHaveProperty("anthropic");
  });

  it("core: buildReport is callable", () => {
    expect(buildReport).toBeTypeOf("function");
  });

  it("core: computeMetrics is callable", () => {
    expect(computeMetrics).toBeTypeOf("function");
  });

  it("github: capCommitMessage is callable", () => {
    expect(capCommitMessage).toBeTypeOf("function");
  });

  it("github: capPrBody is callable", () => {
    expect(capPrBody).toBeTypeOf("function");
  });

  it("github: QUOTA_BYTES is 3 GB", () => {
    expect(QUOTA_BYTES).toBe(3 * 1024 * 1024 * 1024);
  });
});
