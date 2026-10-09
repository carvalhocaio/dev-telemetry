"use client";

import { SlidersHorizontal } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";

import CustomRangeFilter from "@/components/CustomRangeFilter";
import DailyTimeline from "@/components/dashboard/DailyTimeline";
import ModeSelector from "@/components/ModeSelector";
import {
  resolveMode,
  resolveRange,
  type CustomRange,
} from "@/lib/range";
import { isGranularity, isScope, type Scope } from "@/types/report";

/**
 * Reads the custom-mode params from the URL, returning them only when complete.
 */
function readCustom(searchParams: URLSearchParams): CustomRange | undefined {
  const res = searchParams.get("res");
  const start = searchParams.get("start");
  const end = searchParams.get("end");
  if (res && isGranularity(res) && start && end) {
    return { res, start, end };
  }
  return undefined;
}

export default function Dashboard() {
  const searchParams = useSearchParams();
  const mode = resolveMode(searchParams.get("mode"));
  const custom = readCustom(searchParams);
  const rawScope = searchParams.get("scope");
  const scope: Scope = isScope(rawScope) ? rawScope : "all";

  const [filterOpen, setFilterOpen] = useState(mode === "custom");

  const customRes = custom?.res;
  const customStart = custom?.start;
  const customEnd = custom?.end;

  const range = useMemo(
    () => {
      const c =
        customRes && customStart && customEnd
          ? { res: customRes, start: customStart, end: customEnd }
          : undefined;
      return resolveRange(mode, c, new Date());
    },
    [mode, customRes, customStart, customEnd],
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-melodrama text-xl font-bold tracking-tight text-foreground">
          Atividades Diárias
        </h2>
        <div className="flex items-center gap-3">
          <ModeSelector current={mode} />
          <button
            type="button"
            onClick={() => setFilterOpen((open) => !open)}
            aria-expanded={filterOpen}
            aria-controls="custom-range-filter"
            aria-label="Filtro de data personalizado"
            title="Filtro de data personalizado"
            className={`inline-flex items-center justify-center rounded-none border p-1.5 transition-colors hover:border-accent hover:text-foreground ${
              mode === "custom"
                ? "border-accent text-accent"
                : "border-surface bg-surface/40 text-muted"
            }`}
          >
            <SlidersHorizontal size={14} aria-hidden="true" />
          </button>
        </div>
      </div>

      {filterOpen && (
        <div id="custom-range-filter" className="flex justify-end">
          <CustomRangeFilter value={custom} onApply={() => setFilterOpen(false)} />
        </div>
      )}

      <DailyTimeline start={range.start} end={range.end} scope={scope} />
    </div>
  );
}
