"use client";

import { LogOut } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";

import GenerateReportButton from "@/components/dashboard/GenerateReportButton";
import SyncButton from "@/components/SyncButton";
import { signOut } from "@/lib/auth-client";
import { resolveMode } from "@/lib/range";
import { isScope, type Scope } from "@/types/report";

export default function DashboardHeader() {
  const searchParams = useSearchParams();
  const rawScope = searchParams.get("scope");
  const scope: Scope = isScope(rawScope) ? rawScope : "all";
  const filterStart = searchParams.get("start") ?? undefined;
  const filterEnd = searchParams.get("end") ?? undefined;

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
          <GenerateReportButton
            scope={scope}
            filterStart={filterStart}
            filterEnd={filterEnd}
          />
          <SyncButton />
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
          <GenerateReportButton
            scope={scope}
            filterStart={filterStart}
            filterEnd={filterEnd}
          />
          <SyncButton />
        </div>
      </div>
    </header>
  );
}
