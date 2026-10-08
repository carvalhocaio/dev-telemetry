export { ExecutiveReportSchema, ExecutiveProjectHighlightSchema, NarrativeSchema } from "./schema";
export type { ExecutiveReport, Narrative } from "./schema";

export { resolveModel, DEFAULT_MODELS } from "./providers";
export type { LlmProvider } from "./providers";

export {
  generateExecutiveReport,
  generateNarrative,
  formatExecutiveReportMarkdown,
} from "./narrative";
export type {
  GenerateExecutiveReportInput,
  ExecutiveReportCommit,
  ExecutiveReportPr,
  GenerateNarrativeInput,
  CommitSummary,
  PrSummary,
} from "./narrative";
