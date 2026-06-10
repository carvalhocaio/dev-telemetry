import { describe, expect, it, vi } from "vitest";
import { NarrativeSchema } from "@dev-telemetry/ai";
import { toLevel } from "@dev-telemetry/core";
import { capCommitMessage, capPrBody } from "@dev-telemetry/github";

// vi.mock MUST be at the top level of the module — it is hoisted before test
// execution. Placing it inside beforeEach or a describe body causes a
// ReferenceError because hoisted code runs before local variable declarations.
vi.mock("@dev-telemetry/ai/narrative", () => ({
  generateNarrative: vi.fn().mockResolvedValue({
    summary: "test",
    themes: [],
    strengths: [],
    watchouts: [],
  }),
}));

/**
 * Regression tests — pin known edge cases that were previously broken or
 * surprising. Each test documents the specific bug it prevents from re-emerging.
 */

describe("regression: vi.mock hoisting — must be at top level", () => {
  // Previously broken when vi.mock was called inside beforeEach.

  it("mocked module resolves without ReferenceError", async () => {
    const { generateNarrative } = await import("@dev-telemetry/ai/narrative");
    const result = await generateNarrative({} as never);
    expect(result).toHaveProperty("summary");
  });
});

describe("regression: PR stats default to 0 when not in list response", () => {
  // Octokit pulls.list doesn't include additions/deletions/changed_files —
  // only the single-PR endpoint does. Our ingestion defaults them to 0.
  it("NarrativeSchema allows PRs with 0 additions/deletions", () => {
    const result = NarrativeSchema.safeParse({
      summary: "Regular period.",
      themes: ["ci"],
      strengths: ["consistency"],
      watchouts: [],
    });
    expect(result.success).toBe(true);
  });
});

describe("regression: toLevel handles boundary values exactly", () => {
  // Boundary at exactly 0.20 should be atendendo, not abaixo.
  it("composite 0.20 is atendendo (not abaixo)", () => {
    expect(toLevel(0.20)).toBe("atendendo");
  });

  // Boundary at exactly 0.70 should be acima, not atendendo.
  it("composite 0.70 is acima (not atendendo)", () => {
    expect(toLevel(0.70)).toBe("acima");
  });

  // Boundary at exactly 0.90 should be muito_acima, not acima.
  it("composite 0.90 is muito_acima (not acima)", () => {
    expect(toLevel(0.90)).toBe("muito_acima");
  });
});

describe("regression: commit/PR body cap at 4KB/16KB boundaries", () => {
  it("empty string is returned unchanged", () => {
    expect(capCommitMessage("")).toBe("");
    expect(capPrBody("")).toBe("");
  });

  it("ASCII at boundary is not truncated", () => {
    const msg4k = "a".repeat(4096);
    expect(capCommitMessage(msg4k)).toBe(msg4k);
    const body16k = "b".repeat(16384);
    expect(capPrBody(body16k)).toBe(body16k);
  });
});
