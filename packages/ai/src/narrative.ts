import { generateObject } from "ai";
import {
  ExecutiveReportSchema,
  NarrativeSchema,
  type ExecutiveReport,
  type Narrative,
} from "./schema";
import { resolveModel, type LlmProvider } from "./providers";

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
  profileContent?: string;
  /** Performance level key (muito_acima | acima | atendendo | abaixo). */
  level?: string;
  granularity?: string; // daily | weekly | monthly
  period?: string; // human-readable label, e.g. "Semana de 2025-01-06"
  commits: CommitSummary[];
  prs: PrSummary[];
}

export interface ExecutiveReportCommit {
  message: string;
  repo: string;
  additions: number;
  deletions: number;
  date: string;
}

export interface ExecutiveReportPr {
  title: string;
  repo: string;
  state: string;
  date: string;
}

export interface GenerateExecutiveReportInput {
  provider: LlmProvider;
  model: string;
  apiKey: string;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  commits: ExecutiveReportCommit[];
  prs: ExecutiveReportPr[];
}

function formatDateBR(isoDate: string): string {
  const parts = isoDate.split("-");
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return isoDate;
}

export function formatExecutiveReportMarkdown(report: {
  title: string;
  summary?: string;
  projects: Array<{
    name: string;
    repo: string;
    highlights: string[];
  }>;
}): string {
  const lines: string[] = [report.title.trim(), ""];

  if (report.projects.length === 0) {
    lines.push("Nenhuma atividade técnica registrada no período.");
    return lines.join("\n").trim();
  }

  report.projects.forEach((proj, index) => {
    lines.push(`${index + 1}. ${proj.name} (${proj.repo})`);
    for (const highlight of proj.highlights) {
      lines.push(`* ${highlight}`);
    }
    lines.push("");
  });

  return lines.join("\n").trim();
}

function buildExecutiveSystemPrompt(): string {
  return `Você é um Tech Lead e Staff Engineer experiente gerando relatórios executivos de atividades (dailies e reports de progresso) para gestão e stakeholders, em Português do Brasil.

Diretrizes obrigatórias:
- Tom profissional, executivo, editorial e estritamente técnico.
- Agrupe todas as realizações por projeto/repositório.
- Atribua um nome amigável e legível para cada projeto (ex: 'Novo Agente: Scheffer Arquivista' para o repositório 'scheffer-arquivista').
- Para cada projeto, elabore bullet points com realizações técnicas concretas, impacto de engenharia, arquitetura, testes e integrações.
- Descarte ruídos: mensagens banais, merge commits automáticos sem contexto, ajustes triviais de formatação/typos e commits repetitivos.
- No campo 'markdownText', estruture a saída exatamente no formato:
{Título}

1. {Nome Amigável do Projeto} ({repo})
* {Realização técnica objetiva, impacto e testes...}
* {Outro ponto relevante...}

2. {Próximo Projeto} ({repo})
* ...`;
}

function buildExecutivePrompt(input: GenerateExecutiveReportInput): string {
  const startBR = formatDateBR(input.startDate);
  const endBR = formatDateBR(input.endDate);
  const periodLabel = input.startDate === input.endDate ? startBR : `${startBR} a ${endBR}`;
  const suggestedTitle = `Report de Atividades — ${periodLabel}`;

  const commitsByRepo: Record<string, ExecutiveReportCommit[]> = {};
  for (const c of input.commits) {
    const repo = c.repo || "geral";
    if (!commitsByRepo[repo]) commitsByRepo[repo] = [];
    commitsByRepo[repo].push(c);
  }

  const prsByRepo: Record<string, ExecutiveReportPr[]> = {};
  for (const pr of input.prs) {
    const repo = pr.repo || "geral";
    if (!prsByRepo[repo]) prsByRepo[repo] = [];
    prsByRepo[repo].push(pr);
  }

  const allRepos = Array.from(
    new Set([...Object.keys(commitsByRepo), ...Object.keys(prsByRepo)]),
  );

  const repoSections = allRepos
    .map((repo) => {
      const repoCommits = (commitsByRepo[repo] || []).slice(0, 30);
      const repoPrs = (prsByRepo[repo] || []).slice(0, 20);

      const commitLines = repoCommits
        .map(
          (c) =>
            `  - [Commit ${c.date}] ${c.message.slice(0, 150)} (+${c.additions}/-${c.deletions})`,
        )
        .join("\n");

      const prLines = repoPrs
        .map((pr) => `  - [PR: ${pr.state.toUpperCase()} em ${pr.date}] ${pr.title}`)
        .join("\n");

      return `Repositório: ${repo}\nCommits:\n${commitLines || "  - Nenhum commit"}\nPull Requests:\n${prLines || "  - Nenhum PR"}`;
    })
    .join("\n\n");

  return `Gere o relatório executivo para o período: ${periodLabel} (${input.startDate} até ${input.endDate}).
Título sugerido: "${suggestedTitle}"

Atividades registradas (${input.commits.length} commits, ${input.prs.length} PRs no total):
${repoSections || "Nenhuma atividade registrada no período."}`;
}

export async function generateExecutiveReport(
  input: GenerateExecutiveReportInput,
): Promise<ExecutiveReport> {
  const model = resolveModel(input.provider, input.model, input.apiKey);

  const { object } = await generateObject({
    model,
    schema: ExecutiveReportSchema,
    system: buildExecutiveSystemPrompt(),
    prompt: buildExecutivePrompt(input),
  });

  const formattedMarkdown = formatExecutiveReportMarkdown(object);
  const markdownText =
    object.markdownText && object.markdownText.trim().length > 0
      ? object.markdownText.trim()
      : formattedMarkdown;

  return {
    ...object,
    markdownText,
  };
}

// ---------------------------------------------------------------------------
// Backwards compatibility for legacy narrative generation
// ---------------------------------------------------------------------------

const LEVEL_LABELS: Record<string, string> = {
  muito_acima: "muito acima do esperado",
  acima: "acima do esperado",
  atendendo: "atendendo às expectativas",
  abaixo: "abaixo do esperado",
};

function buildNarrativeSystemPrompt(profileContent: string): string {
  return `Você é um analista de performance técnica sênior. Analise os dados de engenharia fornecidos e gere uma narrativa estruturada em Português do Brasil.

Use o seguinte perfil de referência para contextualizar a avaliação de performance:

---
${profileContent}
---

Seja específico, objetivo e evite generalidades. Use os dados concretos (commits, PRs, adições/deleções) para fundamentar cada ponto.`;
}

function buildNarrativePrompt(input: GenerateNarrativeInput): string {
  const levelLabel = input.level ? (LEVEL_LABELS[input.level] ?? input.level) : "atendendo";
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

  return `Período: ${input.period ?? "Período"} (${input.granularity ?? "daily"})
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
    system: buildNarrativeSystemPrompt(input.profileContent ?? ""),
    prompt: buildNarrativePrompt(input),
  });

  return object;
}
