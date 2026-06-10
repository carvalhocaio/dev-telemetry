import type { Metadata } from "next";
import Link from "next/link";

const REPO_URL = "https://github.com/dev-telemetry/dev-telemetry";
const ISSUES_URL = `${REPO_URL}/issues`;
const DISCUSSIONS_URL = `${REPO_URL}/discussions`;

export const metadata: Metadata = {
  title: "Contribuir",
  description:
    "Como contribuir com o dev-telemetry: issues, PRs, rubricas de perfil, novos provedores LLM e traduções.",
  openGraph: {
    type: "website",
    title: "Contribuir · dev-telemetry",
    description:
      "Guia de contribuição do dev-telemetry — projeto OSS, multi-tenant e self-hostable.",
  },
};

const WELCOME = [
  "issues — bugs, ideias e propostas de feature",
  "pull requests — correções e novas funcionalidades",
  "rubricas de perfil — novos perfis de mercado para o classificador",
  "provedores LLM — integração de novos modelos/SDKs",
  "traduções — i18n da interface e da documentação",
] as const;

const SETUP_LINES = [
  "$ git clone https://github.com/dev-telemetry/dev-telemetry",
  "$ cd dev-telemetry",
  "$ bun install",
  "$ cp .env.example .env   # configure as variáveis abaixo",
  "$ bun run dev",
] as const;

const ENV_VARS = [
  "BETTER_AUTH_SECRET     — segredo de sessão",
  "BETTER_AUTH_URL        — URL base da app",
  "GITHUB_CLIENT_ID       — OAuth app do GitHub",
  "GITHUB_CLIENT_SECRET   — OAuth app do GitHub",
  "DATABASE_URL           — conexão PostgreSQL",
] as const;

/**
 * Public contributions guide (no auth required).
 */
export default function ContributionsPage() {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-10 px-4 py-16">
      {/* breadcrumb */}
      <Link
        href="/"
        className="font-mono text-xs text-muted transition-colors hover:text-accent"
      >
        <span className="text-accent">~</span> / dev-telemetry
      </Link>

      {/* heading */}
      <div className="space-y-2">
        <h1 className="font-display text-3xl font-bold tracking-tight text-foreground">
          <span className="text-accent">$</span> contribute
        </h1>
        <p className="font-mono text-sm text-muted">
          dev-telemetry é OSS, multi-tenant e self-hostable. contribuições são
          bem-vindas.
        </p>
      </div>

      {/* welcome contributions */}
      <section className="space-y-3">
        <h2 className="font-mono text-xs uppercase tracking-wider text-muted">
          o que aceitamos
        </h2>
        <ul className="border border-surface bg-surface/40 p-4 font-mono text-xs space-y-1">
          {WELCOME.map((item) => (
            <li key={item} className="text-muted">
              <span className="text-accent">·</span> {item}
            </li>
          ))}
        </ul>
      </section>

      {/* setup */}
      <section className="space-y-3">
        <h2 className="font-mono text-xs uppercase tracking-wider text-muted">
          setup local
        </h2>
        <div className="border border-surface bg-surface/40 p-4 font-mono text-xs space-y-1">
          {SETUP_LINES.map((line) => (
            <p key={line} className="text-muted">
              <span className="text-accent">{line.slice(0, 1)}</span>
              <span className="text-foreground">{line.slice(1)}</span>
            </p>
          ))}
        </div>
      </section>

      {/* env vars */}
      <section className="space-y-3">
        <h2 className="font-mono text-xs uppercase tracking-wider text-muted">
          variáveis de ambiente
        </h2>
        <div className="border border-surface bg-surface/40 p-4 font-mono text-xs space-y-1">
          {ENV_VARS.map((line) => (
            <p key={line} className="text-muted whitespace-pre">
              {line}
            </p>
          ))}
        </div>
      </section>

      {/* links */}
      <section className="space-y-3">
        <h2 className="font-mono text-xs uppercase tracking-wider text-muted">
          links
        </h2>
        <div className="border border-surface bg-surface/40 p-4 font-mono text-xs space-y-1">
          <p className="text-muted">
            <span className="text-accent">→</span>{" "}
            <a
              href={ISSUES_URL}
              target="_blank"
              rel="noreferrer"
              className="transition-colors hover:text-accent"
            >
              issues
            </a>
          </p>
          <p className="text-muted">
            <span className="text-accent">→</span>{" "}
            <a
              href={DISCUSSIONS_URL}
              target="_blank"
              rel="noreferrer"
              className="transition-colors hover:text-accent"
            >
              discussions
            </a>
          </p>
        </div>
      </section>

      {/* footer / back nav */}
      <footer className="border-t border-surface pt-4 font-mono text-xs text-muted/50 leading-relaxed">
        <Link href="/" className="transition-colors hover:text-accent">
          ← voltar à landing
        </Link>
        <br />
        licença MIT
      </footer>
    </main>
  );
}
