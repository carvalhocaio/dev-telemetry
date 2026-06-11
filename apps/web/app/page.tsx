import Link from "next/link";
import { headers } from "next/headers";

import { auth } from "@/lib/auth";

const REPO_URL = "https://github.com/dev-telemetry/dev-telemetry";

const CTA_CLASS =
  "w-full flex items-center justify-center gap-3 border border-muted bg-transparent font-mono text-sm text-foreground px-4 py-3 transition-colors hover:border-accent hover:text-accent";

const FEATURES = [
  "sync de commits e PRs direto do GitHub via PAT",
  "narrativa de produtividade com LLM multi-provider (gemini · openai · anthropic)",
  "classificador por percentil contra perfis de mercado",
  "filtros por organização e escopo pessoal",
  "self-hostable — seus dados ficam no seu deploy",
] as const;

const DEMO_LINES = [
  "→ commits e PRs sincronizados do GitHub",
  "→ narrativa técnica gerada por IA",
  "→ classificação por percentil vs. mercado",
  "→ multi-tenant · OSS · self-hostable",
] as const;

/**
 * Public landing page (no auth required). Authenticated users are offered a
 * direct link to the dashboard instead of the GitHub sign-in CTA.
 */
export default async function LandingPage() {
  const session = await auth.api.getSession({ headers: await headers() });

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-10 px-4 py-16">
      {/* breadcrumb */}
      <p className="font-mono text-xs text-muted">
        <span className="text-accent">~</span> / dev-telemetry
      </p>

      {/* hero */}
      <div className="space-y-2">
        <h1 className="font-display text-3xl font-bold tracking-tight text-foreground">
          <span className="text-accent">$</span> dev-telemetry
        </h1>
        <p className="font-mono text-sm text-muted">
          telemetria para devs — OSS, multi-tenant, self-hostable
        </p>
      </div>

      {/* terminal demo block */}
      <div className="border border-surface bg-surface/40 p-4 font-mono text-xs space-y-1">
        <p className="text-muted">
          <span className="text-accent">$</span>{" "}
          <span className="text-foreground">whoami</span>
        </p>
        {DEMO_LINES.map((line) => (
          <p key={line} className="text-muted">
            {line}
          </p>
        ))}
      </div>

      {/* feature list */}
      <ul className="border border-surface bg-surface/40 p-4 font-mono text-xs space-y-1">
        {FEATURES.map((feature) => (
          <li key={feature} className="text-muted">
            <span className="text-accent">·</span> {feature}
          </li>
        ))}
      </ul>

      {/* CTA */}
      <div className="space-y-3">
        {session ? (
          <Link href="/dashboard" className={CTA_CLASS}>
            <span aria-hidden="true" className="text-accent">
              █
            </span>
            ir para o dashboard →
          </Link>
        ) : (
          <Link href="/login" className={CTA_CLASS}>
            <span aria-hidden="true" className="text-accent">
              █
            </span>
            Entrar com GitHub
          </Link>
        )}
        <Link
          href="/contributions"
          className="block font-mono text-xs text-muted transition-colors hover:text-accent"
        >
          <span className="text-accent">$</span> contribuir →
        </Link>
      </div>

      {/* footer */}
      <footer className="border-t border-surface pt-4 font-mono text-xs text-muted/50 leading-relaxed">
        <a
          href={REPO_URL}
          target="_blank"
          rel="noreferrer"
          className="transition-colors hover:text-accent"
        >
          github.com/dev-telemetry/dev-telemetry
        </a>
        <br />
        licença MIT
      </footer>
    </main>
  );
}
