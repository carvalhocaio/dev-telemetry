"use client";

import { LogOut } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import ScopeSelector from "@/components/ScopeSelector";
import SyncButton from "@/components/SyncButton";
import { signOut } from "@/lib/auth-client";
import { resolveMode } from "@/lib/range";
import { isScope, type Scope } from "@/types/report";

const SCOPE_STORAGE_KEY = "dt:scope";

/**
 * Contextual control bar for the dashboard (global navigation lives in NavBar):
 * shows the active profile on the left and the report controls + sign-out on the
 * right.
 */
export default function DashboardHeader() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const mode = resolveMode(searchParams.get("mode"));
  const rawScope = searchParams.get("scope");
  const scope: Scope = isScope(rawScope) ? rawScope : "all";
  const [orgs, setOrgs] = useState<string[]>([]);
  const [profileLabel, setProfileLabel] = useState<string | null>(null);

  // Restore persisted scope on first load (when URL has no scope param)
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

  // Persist scope whenever it changes
  useEffect(() => {
    localStorage.setItem(SCOPE_STORAGE_KEY, scope);
  }, [scope]);

  useEffect(() => {
    fetch("/api/me/orgs", { credentials: "include" })
      .then((r) => r.ok ? r.json() as Promise<{ orgs: string[] }> : null)
      .then((data) => { if (data) setOrgs(data.orgs); })
      .catch(() => null);
  }, []);

  useEffect(() => {
    fetch("/api/me/profile", { credentials: "include" })
      .then((r) => r.ok ? r.json() as Promise<{ label: string; group: string }> : null)
      .then((d) => { if (d?.label) setProfileLabel(d.group ? `${d.label} — ${d.group}` : d.label); })
      .catch(() => null);
  }, []);

  async function handleSignOut() {
    await signOut();
    window.location.href = "/login";
  }

  return (
    <header className="flex items-center justify-between gap-4 border-b border-border pb-4">
      <div className="font-mono text-xs uppercase tracking-widest text-muted">
        {profileLabel ?? <span className="animate-pulse">···</span>}
      </div>

      <div className="flex items-center gap-3">
        <SyncButton />
        <ScopeSelector currentScope={scope} currentMode={mode} orgs={orgs} />
        <button
          type="button"
          onClick={handleSignOut}
          aria-label="Sair"
          title="Sair"
          className="inline-flex items-center justify-center rounded-md border border-surface bg-surface/40 p-1.5 text-muted transition-colors hover:border-red-600 hover:text-red-600"
        >
          <LogOut size={14} aria-hidden="true" />
        </button>
      </div>
    </header>
  );
}
