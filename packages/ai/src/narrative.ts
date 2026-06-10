import { generateObject } from "ai";
import { NarrativeSchema } from "./schema.js";
import { resolveModel, type LlmProvider } from "./providers.js";
import type { Narrative } from "./schema.js";

export interface CommitSummary {
  message: string;
  date: string; // ISO date
  additions: number;
  deletions: number;
}

export interface PrSummary {
  title: string;
  body: string | null;
  state: string; // open | merged | closed
  date: string; // ISO date
}

export interface GenerateNarrativeInput {
  provider: LlmProvider;
  model: string;
  apiKey: string;
  /** Markdown content of the profile/rubric (e.g. data_engineer_pleno.md). */
  profileContent: string;
  /** Performance level key (muito_acima | acima | atendendo | abaixo). */
  level: string;
  granularity: string; // daily | weekly | monthly
  period: string; // human-readable label, e.g. "Semana de 2025-01-06"
  commits: CommitSummary[];
  prs: PrSummary[];
}

const LEVEL_LABELS: Record<string, string> = {
  muito_acima: "muito acima do esperado",
  acima: "acima do esperado",
  atendendo: "atendendo às expectativas",
  abaixo: "abaixo do esperado",
};

function buildSystemPrompt(profileContent: string): string {
  return `Você é um analista de performance técnica sênior. Analise os dados de engenharia fornecidos e gere uma narrativa estruturada em Português do Brasil.

Use o seguinte perfil de referência para contextualizar a avaliação de performance:

---
${profileContent}
---

Seja específico, objetivo e evite generalidades. Use os dados concretos (commits, PRs, adições/deleções) para fundamentar cada ponto.`;
}

function buildPrompt(input: GenerateNarrativeInput): string {
  const levelLabel = LEVEL_LABELS[input.level] ?? input.level;
  const commitLines = input.commits
    .slice(0, 30) // cap to avoid prompt bloat
    .map((c) => `- ${c.date}: ${c.message.slice(0, 120)} (+${c.additions}/-${c.deletions})`)
    .join("\n");
  const prLines = input.prs
    .slice(0, 20)
    .map((pr) => {
      const body = pr.body ? `: ${pr.body.slice(0, 200)}` : "";
      return `- [${pr.state.toUpperCase()}] ${pr.title}${body}`;
    })
    .join("\n");

  return `Período: ${input.period} (${input.granularity})
Nível de performance calculado: ${levelLabel}

Commits (${input.commits.length} total, exibindo até 30):
${commitLines || "Nenhum commit no período."}

Pull Requests (${input.prs.length} total, exibindo até 20):
${prLines || "Nenhum PR no período."}`;
}

/**
 * Generates a structured narrative for a time period using the user's chosen
 * LLM provider and API key. The API key is decrypted by the caller and passed
 * here in memory — it is never logged or persisted by this function.
 */
export async function generateNarrative(
  input: GenerateNarrativeInput,
): Promise<Narrative> {
  const model = resolveModel(input.provider, input.model, input.apiKey);

  const { object } = await generateObject({
    model,
    schema: NarrativeSchema,
    system: buildSystemPrompt(input.profileContent),
    prompt: buildPrompt(input),
  });

  return object;
}
