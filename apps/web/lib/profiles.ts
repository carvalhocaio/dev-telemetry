import "server-only";

/** UI-friendly metadata for the built-in profiles, grouped by track. */
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
