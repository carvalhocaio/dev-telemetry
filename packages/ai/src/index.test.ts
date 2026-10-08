import { describe, expect, it, vi } from "vitest";
import { generateObject } from "ai";
import { ExecutiveReportSchema, NarrativeSchema } from "./schema";
import { DEFAULT_MODELS, resolveModel } from "./providers";
import {
  formatExecutiveReportMarkdown,
  generateExecutiveReport,
  generateNarrative,
} from "./narrative";

// Top-level mock — vi.mock is hoisted, so the factory must not reference
// local variables. We configure the return value per-test via mockResolvedValue.
vi.mock("ai", () => ({
  generateObject: vi.fn(),
}));

const mockGenerateObject = generateObject as unknown as {
  mockResolvedValueOnce: (val: unknown) => void;
  mockClear: () => void;
};

// ---------------------------------------------------------------------------
// Schema tests
// ---------------------------------------------------------------------------

describe("ExecutiveReportSchema", () => {
  it("accepts a valid executive report", () => {
    const result = ExecutiveReportSchema.safeParse({
      title: "Report de Atividades — 08/10/2026",
      summary: "Conclusão da refatoração de agentes e pipeline de dados.",
      projects: [
        {
          name: "Novo Agente: Scheffer Arquivista",
          repo: "scheffer-arquivista",
          highlights: [
            "Implementação do extrator de metadados com OCR.",
            "Testes unitários com 95% de cobertura.",
          ],
        },
      ],
      markdownText: "Report de Atividades — 08/10/2026\n\n1. Novo Agente...",
    });
    expect(result.success).toBe(true);
  });

  it("rejects missing title or projects", () => {
    expect(
      ExecutiveReportSchema.safeParse({
        summary: "Resumo",
        markdownText: "txt",
      }).success,
    ).toBe(false);
  });

  it("accepts report with empty projects array", () => {
    const result = ExecutiveReportSchema.safeParse({
      title: "Report de Atividades — 08/10/2026",
      summary: "Dia focado em alinhamentos e planejamento.",
      projects: [],
      markdownText: "Report de Atividades — 08/10/2026",
    });
    expect(result.success).toBe(true);
  });
});

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
// Markdown formatting tests
// ---------------------------------------------------------------------------

describe("formatExecutiveReportMarkdown", () => {
  it("formats single project report according to executive template", () => {
    const md = formatExecutiveReportMarkdown({
      title: "Report de Atividades — 08/10/2026",
      projects: [
        {
          name: "Scheffer Arquivista",
          repo: "scheffer-arquivista",
          highlights: [
            "Realização técnica objetiva, impacto e testes",
            "Outro ponto relevante",
          ],
        },
      ],
    });

    expect(md).toBe(
      "Report de Atividades — 08/10/2026\n\n1. Scheffer Arquivista (scheffer-arquivista)\n* Realização técnica objetiva, impacto e testes\n* Outro ponto relevante",
    );
  });

  it("formats multiple projects numbered sequentially", () => {
    const md = formatExecutiveReportMarkdown({
      title: "Report de Atividades — 01/10/2026 a 08/10/2026",
      projects: [
        {
          name: "Telemetry Core",
          repo: "dev-telemetry",
          highlights: ["Pivot para timeline de atividades"],
        },
        {
          name: "Web Dashboard",
          repo: "web",
          highlights: ["Design Lyra com botões Gerar Daily"],
        },
      ],
    });

    expect(md).toContain("1. Telemetry Core (dev-telemetry)\n* Pivot para timeline de atividades");
    expect(md).toContain("2. Web Dashboard (web)\n* Design Lyra com botões Gerar Daily");
  });

  it("handles empty projects cleanly", () => {
    const md = formatExecutiveReportMarkdown({
      title: "Report de Atividades — 08/10/2026",
      projects: [],
    });

    expect(md).toBe(
      "Report de Atividades — 08/10/2026\n\nNenhuma atividade técnica registrada no período.",
    );
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
// generateExecutiveReport — mocked
// ---------------------------------------------------------------------------

describe("generateExecutiveReport", () => {
  it("returns generated executive report and preserves provided markdownText", async () => {
    const fakeReport = {
      title: "Report de Atividades — 08/10/2026",
      summary: "Entregas importantes concluídas na pipeline de dados.",
      projects: [
        {
          name: "Scheffer Arquivista",
          repo: "scheffer-arquivista",
          highlights: ["Refatoração do extrator de arquivos."],
        },
      ],
      markdownText: "Report de Atividades — 08/10/2026\n\n1. Scheffer Arquivista (scheffer-arquivista)\n* Refatoração do extrator de arquivos.",
    };

    mockGenerateObject.mockResolvedValueOnce({
      object: fakeReport,
    });

    const result = await generateExecutiveReport({
      provider: "gemini",
      model: "gemini-2.0-flash",
      apiKey: "fake-key",
      startDate: "2026-10-08",
      endDate: "2026-10-08",
      commits: [
        {
          message: "feat: add extractor",
          repo: "scheffer-arquivista",
          additions: 120,
          deletions: 10,
          date: "2026-10-08",
        },
      ],
      prs: [
        {
          title: "feat: extractor v2",
          repo: "scheffer-arquivista",
          state: "merged",
          date: "2026-10-08",
        },
      ],
    });

    expect(result).toEqual(fakeReport);
  });

  it("generates markdownText fallback if markdownText from model is empty", async () => {
    const fakeReport = {
      title: "Report de Atividades — 08/10/2026",
      summary: "Correção de bugs.",
      projects: [
        {
          name: "Scheffer Arquivista",
          repo: "scheffer-arquivista",
          highlights: ["Correção de encoding."],
        },
      ],
      markdownText: "",
    };

    mockGenerateObject.mockResolvedValueOnce({
      object: fakeReport,
    });

    const result = await generateExecutiveReport({
      provider: "gemini",
      model: "gemini-2.0-flash",
      apiKey: "fake-key",
      startDate: "2026-10-08",
      endDate: "2026-10-08",
      commits: [],
      prs: [],
    });

    expect(result.markdownText).toBe(
      "Report de Atividades — 08/10/2026\n\n1. Scheffer Arquivista (scheffer-arquivista)\n* Correção de encoding.",
    );
  });
});

// ---------------------------------------------------------------------------
// generateNarrative — legacy backwards compatibility
// ---------------------------------------------------------------------------

describe("generateNarrative", () => {
  it("returns the generated narrative object from generateObject", async () => {
    const fakeNarrative = {
      summary: "Período forte com entregas consistentes.",
      themes: ["backend", "testes"],
      strengths: ["qualidade", "ritmo"],
      watchouts: [],
    };

    mockGenerateObject.mockResolvedValueOnce({
      object: fakeNarrative,
    });

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
  });
});
