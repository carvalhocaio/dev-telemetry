import { z } from "zod";

export const ExecutiveProjectHighlightSchema = z.object({
  name: z
    .string()
    .describe("Human-friendly name e.g. 'Novo Agente: Scheffer Arquivista'"),
  repo: z
    .string()
    .describe("Repo identifier e.g. 'scheffer-arquivista'"),
  highlights: z
    .array(z.string())
    .describe("Concrete technical bullet points"),
});

export const ExecutiveReportSchema = z.object({
  title: z
    .string()
    .describe("Title e.g. 'Report de Atividades — 08/10/2026'"),
  summary: z
    .string()
    .describe("Concise 1-2 sentence executive overview"),
  projects: z
    .array(ExecutiveProjectHighlightSchema)
    .describe("Projects worked on in the period"),
  markdownText: z
    .string()
    .describe("Formatted markdown ready for copy-pasting to Slack/Manager"),
});

export interface ExecutiveReport {
  title: string;
  summary: string;
  projects: Array<{
    name: string;
    repo: string;
    highlights: string[];
  }>;
  markdownText: string;
}

/**
 * Structured narrative produced by the LLM for a single time period.
 * Matches the shape the NarrativePanel component expects.
 */
export const NarrativeSchema = z.object({
  summary: z
    .string()
    .describe(
      "2-3 sentence narrative summary of the engineer's performance in the period, in Portuguese",
    ),
  themes: z
    .array(z.string())
    .min(1)
    .max(5)
    .describe("Key technical themes observed (3-5 items, in Portuguese)"),
  strengths: z
    .array(z.string())
    .min(1)
    .max(4)
    .describe("Notable strengths demonstrated in the period (2-4 items, in Portuguese)"),
  watchouts: z
    .array(z.string())
    .min(0)
    .max(3)
    .describe("Areas that need attention or improvement (0-3 items, in Portuguese)"),
});

export type Narrative = z.infer<typeof NarrativeSchema>;
