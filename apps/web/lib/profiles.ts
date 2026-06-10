import "server-only";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * Built-in market profile rubrics.
 *
 * The rubric markdown lives at the monorepo root under `docs/profiles/`, while
 * Next.js sets `process.cwd()` to the `apps/web` directory in dev and build.
 * We therefore resolve up two levels into `docs/profiles`. Files are read once
 * at module load; this module is server-only and never reaches the browser.
 */
const PROFILES_DIR = join(process.cwd(), "../../docs/profiles");

function loadProfile(key: string): string {
  return readFileSync(join(PROFILES_DIR, `${key}.md`), "utf8");
}

/** UI-friendly metadata for the 9 built-in profiles, grouped by track. */
export const PROFILE_METADATA = [
  { key: "data_engineer_jr", group: "Eng. de Dados", label: "Júnior" },
  { key: "data_engineer_pleno", group: "Eng. de Dados", label: "Pleno" },
  { key: "data_engineer_sr", group: "Eng. de Dados", label: "Sênior" },
  { key: "software_engineer_estagio", group: "Eng. de Software", label: "Estágio" },
  { key: "software_engineer_jr", group: "Eng. de Software", label: "Júnior" },
  { key: "software_engineer_pleno", group: "Eng. de Software", label: "Pleno" },
  { key: "software_engineer_sr", group: "Eng. de Software", label: "Sênior" },
  { key: "student_dados", group: "Estudante", label: "Foco em Dados" },
  { key: "student_software", group: "Estudante", label: "Foco em Software" },
] as const;

export type BuiltInProfileKey = (typeof PROFILE_METADATA)[number]["key"];

export const BUILT_IN_KEYS = PROFILE_METADATA.map((p) => p.key);

/** Profile key → rubric markdown content, loaded at module init. */
export const PROFILE_REGISTRY: Record<string, string> = Object.fromEntries(
  PROFILE_METADATA.map((p) => [p.key, loadProfile(p.key)]),
);
