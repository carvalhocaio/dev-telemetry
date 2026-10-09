"use client";

import { LogOut } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";

import GenerateReportButton from "@/components/dashboard/GenerateReportButton";
import SyncButton from "@/components/SyncButton";
import { signOut } from "@/lib/auth-client";
import { resolveMode, resolveRange, type CustomRange } from "@/lib/range";
import { isGranularity, isScope, type Scope } from "@/types/report";

function readCustom(searchParams: URLSearchParams): CustomRange | undefined {
  const res = searchParams.get("res");
  const start = searchParams.get("start");
  const end = searchParams.get("end");
  if (res && isGranularity(res) && start && end) {
    return { res, start, end };
  }
  return undefined;
}

export default function DashboardHeader() {
  const searchParams = useSearchParams();
  const rawScope = searchParams.get("scope");
  const scope: Scope = isScope(rawScope) ? rawScope : "all";
  const mode = resolveMode(searchParams.get("mode"));
  const custom = readCustom(searchParams);

  const range = resolveRange(mode, custom, new Date());
  const filterStart = range.start;
  const filterEnd = range.end;

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
