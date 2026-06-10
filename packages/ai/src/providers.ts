import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createOpenAI } from "@ai-sdk/openai";
import { createAnthropic } from "@ai-sdk/anthropic";
import type { LanguageModelV1 } from "ai";

export type LlmProvider = "gemini" | "openai" | "anthropic";

/** Sensible default model IDs per provider (user can override in settings). */
export const DEFAULT_MODELS: Record<LlmProvider, string> = {
  gemini: "gemini-2.0-flash",
  openai: "gpt-4o-mini",
  anthropic: "claude-haiku-4-5-20251001",
};

/**
 * Instantiates the correct AI SDK model for the given provider and API key.
 * The key is injected per-request from the decrypted user secret — it never
 * touches the environment.
 */
export function resolveModel(
  provider: LlmProvider,
  model: string,
  apiKey: string,
): LanguageModelV1 {
  switch (provider) {
    case "gemini":
      return createGoogleGenerativeAI({ apiKey })(model);
    case "openai":
      return createOpenAI({ apiKey })(model);
    case "anthropic":
      return createAnthropic({ apiKey })(model);
  }
}
