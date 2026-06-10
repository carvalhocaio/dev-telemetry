/**
 * Profile resolution — picks the rubric content used as LLM narrative context.
 *
 * Precedence:
 *   1. `custom` + non-empty content → the user's own rubric,
 *   2. a known built-in key → its registry entry,
 *   3. fallback to `data_engineer_pleno` (the Phase 1 default), then any entry.
 */
export function resolveProfile(
  registry: Record<string, string>,
  profileKey: string | null | undefined,
  customContent: string | null | undefined,
): string {
  if (profileKey === "custom" && customContent) return customContent;
  if (profileKey && registry[profileKey]) return registry[profileKey];
  return registry["data_engineer_pleno"] ?? Object.values(registry)[0] ?? "";
}
