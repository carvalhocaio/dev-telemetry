"use client";

import { LogOut, Settings } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import AiPoweredBadge from "@/components/AiPoweredBadge";
import ScopeSelector from "@/components/ScopeSelector";
import { signOut } from "@/lib/auth-client";
import { resolveMode } from "@/lib/range";
import { APP_VERSION, REPO_URL } from "@/lib/version";
import { isScope, type Scope } from "@/types/report";

export default function DashboardHeader() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const mode = resolveMode(searchParams.get("mode"));
  const rawScope = searchParams.get("scope");
  const scope: Scope = isScope(rawScope) ? rawScope : "all";
  const [orgs, setOrgs] = useState<string[]>([]);

  useEffect(() => {
    fetch("/api/me/orgs", { credentials: "include" })
      .then((r) => r.ok ? r.json() as Promise<{ orgs: string[] }> : null)
      .then((data) => { if (data) setOrgs(data.orgs); })
      .catch(() => null);
  }, []);

  async function handleSignOut() {
    await signOut();
    router.replace("/login");
  }

  return (
    <header className="flex flex-col gap-3 border-b border-surface pb-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-0.5">
          <h1 className="whitespace-nowrap font-display text-lg font-medium tracking-tight">
            <span className="text-accent">$</span> dev-telemetry
          </h1>
          <a
            href={REPO_URL}
            target="_blank"
            rel="noopener noreferrer"
            title="GitHub"
            className="font-mono text-[10px] text-muted transition-colors hover:text-accent"
          >
            {APP_VERSION}
          </a>
        </div>

        <div className="flex items-center gap-3">
          <AiPoweredBadge />
          <ScopeSelector currentScope={scope} currentMode={mode} orgs={orgs} />
          <button
            type="button"
            onClick={() => router.push("/settings")}
            aria-label="Configurações"
            title="Configurações"
            className="inline-flex items-center justify-center rounded-md border border-surface bg-surface/40 p-1.5 text-muted transition-colors hover:border-accent hover:text-foreground"
          >
            <Settings size={14} aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={handleSignOut}
            aria-label="Sair"
            title="Sair"
            className="inline-flex items-center justify-center rounded-md border border-surface bg-surface/40 p-1.5 text-muted transition-colors hover:border-level-abaixo hover:text-level-abaixo"
          >
            <LogOut size={14} aria-hidden="true" />
          </button>
        </div>
      </div>

    </header>
  );
}
