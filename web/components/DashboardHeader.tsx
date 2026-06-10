"use client";

import { Lock, SlidersHorizontal } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useState } from "react";

import CustomRangeFilter from "@/components/CustomRangeFilter";
import ModeSelector from "@/components/ModeSelector";
import SyncButton from "@/components/SyncButton";
import { useAuth } from "@/hooks/useAuth";
import { resolveMode, type CustomRange } from "@/lib/range";
import { isGranularity } from "@/types/report";

function readCustom(searchParams: URLSearchParams): CustomRange | undefined {
  const res = searchParams.get("res");
  const start = searchParams.get("start");
  const end = searchParams.get("end");
  if (res && isGranularity(res) && start && end) {
    return { res, start, end };
  }
  return undefined;
}

/**
 * Compact terminal-style top bar: title, mode selector, a disclosure for the
 * custom date filter, sync button and a manual lock (logout). Reads the mode and
 * custom params from the URL so it stays in sync with the dashboard body.
 */
export default function DashboardHeader() {
  const searchParams = useSearchParams();
  const mode = resolveMode(searchParams.get("mode"));
  const custom = readCustom(searchParams);
  const { logout } = useAuth();
  const [filterOpen, setFilterOpen] = useState(mode === "custom");

  return (
    <header className="flex flex-col gap-3 border-b border-surface pb-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="font-display text-lg font-medium tracking-tight">
          <span className="text-accent">$</span> dev-telemetry
        </h1>
        <div className="flex flex-wrap items-center gap-4">
          <ModeSelector current={mode} />
          <button
            type="button"
            onClick={() => setFilterOpen((open) => !open)}
            aria-expanded={filterOpen}
            aria-controls="custom-range-filter"
            aria-label="Filtro de data personalizado"
            title="Filtro de data personalizado"
            className={`inline-flex items-center justify-center rounded-md border p-1.5 transition-colors hover:border-accent hover:text-foreground ${
              mode === "custom"
                ? "border-accent text-accent"
                : "border-surface bg-surface/40 text-muted"
            }`}
          >
            <SlidersHorizontal size={14} aria-hidden="true" />
          </button>
          <SyncButton />
          <button
            type="button"
            onClick={() => logout()}
            aria-label="Bloquear sessão"
            title="Bloquear sessão"
            className="inline-flex items-center justify-center rounded-md border border-surface bg-surface/40 p-1.5 text-muted transition-colors hover:border-accent hover:text-foreground"
          >
            <Lock size={14} aria-hidden="true" />
          </button>
        </div>
      </div>

      {filterOpen && (
        <div id="custom-range-filter">
          <CustomRangeFilter value={custom} />
        </div>
      )}
    </header>
  );
}
