import { describe, expect, it, vi } from "vitest";
import { NarrativeSchema } from "./schema.js";
import { DEFAULT_MODELS, resolveModel } from "./providers.js";

// Top-level mock — vi.mock is hoisted, so the factory must not reference
// local variables. We configure the return value per-test via mockResolvedValue.
vi.mock("ai", () => ({
  generateObject: vi.fn(),
}));

// ---------------------------------------------------------------------------
// Schema tests
// ---------------------------------------------------------------------------

describe("NarrativeSchema", () => {
  it("accepts a valid narrative", () => {
    const result = NarrativeSchema.safeParse({
      summary: "Período produtivo com foco em refatorações.",
      themes: ["refatoração", "testes"],
      strengths: ["consistência", "qualidade de código"],
      watchouts: [],
    });
    expect(result.success).toBe(true);
  });

  it("rejects missing required fields", () => {
    expect(NarrativeSchema.safeParse({ summary: "ok" }).success).toBe(false);
  });

  it("rejects themes with more than 5 items", () => {
    const result = NarrativeSchema.safeParse({
      summary: "ok",
      themes: ["a", "b", "c", "d", "e", "f"],
      strengths: ["x"],
      watchouts: [],
    });
    expect(result.success).toBe(false);
  });

  it("allows empty watchouts array", () => {
    const result = NarrativeSchema.safeParse({
      summary: "Ótimo período.",
      themes: ["feature delivery"],
      strengths: ["velocidade"],
      watchouts: [],
    });
    expect(result.success).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Provider factory tests (no real API calls)
// ---------------------------------------------------------------------------

describe("DEFAULT_MODELS", () => {
  it("defines a model for each provider", () => {
    expect(DEFAULT_MODELS.gemini).toBeTruthy();
    expect(DEFAULT_MODELS.openai).toBeTruthy();
    expect(DEFAULT_MODELS.anthropic).toBeTruthy();
  });
});

describe("resolveModel", () => {
  const fakeKey = "test-api-key-never-sent";

  it("returns a model object for gemini", () => {
    const model = resolveModel("gemini", DEFAULT_MODELS.gemini!, fakeKey);
    expect(model).toBeDefined();
    expect(typeof model).toBe("object");
  });

  it("returns a model object for openai", () => {
    const model = resolveModel("openai", DEFAULT_MODELS.openai!, fakeKey);
    expect(model).toBeDefined();
  });

  it("returns a model object for anthropic", () => {
    const model = resolveModel("anthropic", DEFAULT_MODELS.anthropic!, fakeKey);
    expect(model).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// generateNarrative — mocked (no real API calls in tests)
// ---------------------------------------------------------------------------

describe("generateNarrative", () => {
  it("returns the generated narrative object from generateObject", async () => {
    const { generateObject } = await import("ai");
    const { generateNarrative } = await import("./narrative.js");

    const fakeNarrative = {
      summary: "Período forte com entregas consistentes.",
      themes: ["backend", "testes"],
      strengths: ["qualidade", "ritmo"],
      watchouts: [],
    };

    vi.mocked(generateObject).mockResolvedValueOnce({
      object: fakeNarrative,
    } as unknown as Awaited<ReturnType<typeof generateObject>>);

    const result = await generateNarrative({
      provider: "gemini",
      model: "gemini-2.0-flash",
      apiKey: "fake-key",
      profileContent: "# Engenheiro de Dados Pleno\nRubrica de referência.",
      level: "muito_acima",
      granularity: "weekly",
      period: "Semana de 2025-01-06",
      commits: [
        { message: "feat: add pipeline", date: "2025-01-07", additions: 120, deletions: 10 },
      ],
      prs: [
        { title: "feat: new pipeline", body: "Adiciona pipeline ETL.", state: "merged", date: "2025-01-08" },
      ],
    });

    expect(result).toEqual(fakeNarrative);
    expect(vi.mocked(generateObject)).toHaveBeenCalledOnce();
  });
});
