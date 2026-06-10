import { z } from "zod";

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
