"use client";

import { Lock, Settings, SlidersHorizontal } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

import AiPoweredBadge from "@/components/AiPoweredBadge";
import CustomRangeFilter from "@/components/CustomRangeFilter";
import ModeSelector from "@/components/ModeSelector";
import SyncButton from "@/components/SyncButton";
import { signOut } from "@/lib/auth-client";
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

export default function DashboardHeader() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const mode = resolveMode(searchParams.get("mode"));
  const custom = readCustom(searchParams);
  const [filterOpen, setFilterOpen] = useState(mode === "custom");

  async function handleSignOut() {
    await signOut();
    router.replace("/login");
  }

  return (
    <header className="flex flex-col gap-3 border-b border-surface pb-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="font-display text-lg font-medium tracking-tight">
          <span className="text-accent">$</span> dev-telemetry
        </h1>
        <div className="flex flex-wrap items-center gap-4">
          <AiPoweredBadge />
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
