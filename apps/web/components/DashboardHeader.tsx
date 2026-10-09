"use client";

import { LogOut } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import GenerateReportButton from "@/components/dashboard/GenerateReportButton";
import ScopeSelector from "@/components/ScopeSelector";
import SyncButton from "@/components/SyncButton";
import { signOut } from "@/lib/auth-client";
import { resolveMode } from "@/lib/range";
import { isScope, type Scope } from "@/types/report";

const SCOPE_STORAGE_KEY = "dt:scope";

export default function DashboardHeader() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const mode = resolveMode(searchParams.get("mode"));
  const rawScope = searchParams.get("scope");
  const scope: Scope = isScope(rawScope) ? rawScope : "all";
  const [orgs, setOrgs] = useState<string[]>([]);

  useEffect(() => {
    if (!searchParams.get("scope")) {
      const saved = localStorage.getItem(SCOPE_STORAGE_KEY);
      if (saved && saved !== "all") {
        const params = new URLSearchParams(searchParams.toString());
        params.set("scope", saved);
        router.replace(`/dashboard?${params.toString()}`);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    localStorage.setItem(SCOPE_STORAGE_KEY, scope);
  }, [scope]);

  useEffect(() => {
    fetch("/api/me/orgs", { credentials: "include" })
      .then((r) => (r.ok ? (r.json() as Promise<{ orgs: string[] }>) : null))
      .then((data) => {
        if (data) setOrgs(data.orgs);
      })
      .catch(() => null);
  }, []);

  async function handleSignOut() {
    await signOut();
    window.location.href = "/login";
  }

  return (
    <header className="border-b border-border pb-4">
      {/* ── Desktop: single row ── */}
      <div className="hidden sm:flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs uppercase tracking-widest text-muted">
            Dev Telemetry · Timeline
          </span>
        </div>
        <div className="flex items-center gap-3">
          <GenerateReportButton scope={scope} />
          <SyncButton />
          <ScopeSelector currentScope={scope} currentMode={mode} orgs={orgs} />
          <button
            type="button"
            onClick={handleSignOut}
            aria-label="Sair"
            title="Sair"
            className="inline-flex cursor-pointer items-center justify-center rounded-none border border-surface bg-surface/40 p-1.5 text-muted transition-colors hover:border-red-600 hover:text-red-600"
          >
            <LogOut size={14} aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* ── Mobile: stacked rows ── */}
      <div className="flex flex-col gap-3 sm:hidden">
        <div className="flex items-center justify-between">
          <span className="font-mono text-xs uppercase tracking-widest text-muted">
            Dev Telemetry · Timeline
          </span>
          <button
            type="button"
            onClick={handleSignOut}
            aria-label="Sair"
            title="Sair"
            className="inline-flex cursor-pointer items-center justify-center rounded-none border border-surface bg-surface/40 p-1.5 text-muted transition-colors hover:border-red-600 hover:text-red-600"
          >
            <LogOut size={14} aria-hidden="true" />
          </button>
        </div>
        <div className="flex items-center gap-2">
          <GenerateReportButton scope={scope} />
          <SyncButton />
        </div>
        <ScopeSelector currentScope={scope} currentMode={mode} orgs={orgs} fullWidth />
      </div>
    </header>
  );
}
