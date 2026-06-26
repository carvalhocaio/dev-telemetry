import Link from "next/link";
import { headers } from "next/headers";

import { auth } from "@/lib/auth";

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
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-16 px-6 py-16">
      {/* breadcrumb / eyebrow */}
      <p className="font-mono text-xs text-muted">
        <span className="text-accent">~/</span> dev-telemetry
      </p>

      {/* hero */}
      <section>
        <h1 className="font-display text-6xl font-bold tracking-tight text-foreground">
          <span className="text-accent">$</span> dev-telemetry
        </h1>
        <p className="mt-3 max-w-lg font-mono text-sm text-muted">
          telemetria para devs — commits, PRs e narrativa IA em tempo real
        </p>
      </section>

      {/* terminal demo block */}
      <div className="space-y-2 border border-border bg-surface p-6 font-mono text-sm">
        <p>
          <span className="text-accent">$</span>
          <span className="text-foreground"> whoami</span>
        </p>
        {DEMO_LINES.map((line) => (
          <p key={line} className="text-muted">
            {line}
          </p>
        ))}
        <p className="mt-4">
          <span className="text-accent">$</span>
          <span className="animate-pulse text-muted"> _</span>
        </p>
      </div>

      {/* feature grid */}
      <section>
        <h2 className="mb-6 font-mono text-[10px] uppercase tracking-widest text-muted">
          CAPACIDADES
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feature) => (
            <div key={feature} className="border border-border bg-surface p-4">
              <span aria-hidden className="font-mono text-xs text-accent">
                ·
              </span>
              <p className="mt-1 font-mono text-sm text-foreground">{feature}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="flex max-w-sm flex-col gap-3">
        <Link
          href={session ? "/dashboard" : "/login"}
          className="flex items-center justify-center gap-3 border border-accent bg-transparent px-6 py-4 font-mono text-sm text-accent transition-colors hover:bg-accent hover:text-background"
        >
          {session ? "IR PARA O PAINEL →" : "CONECTAR VIA GITHUB →"}
        </Link>
        <Link
          href="/contributions"
          className="text-center font-mono text-xs text-muted transition-colors hover:text-accent"
        >
          <span className="text-accent">$</span> contribuir para o projeto
        </Link>
      </section>
    </main>
  );
}
