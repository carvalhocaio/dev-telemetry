"use client";

import { SlidersHorizontal } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import CustomRangeFilter from "@/components/CustomRangeFilter";
import DashboardView from "@/components/DashboardView";
import ModeSelector from "@/components/ModeSelector";
import SyncButton from "@/components/SyncButton";
import { fillPeriods } from "@/lib/calendar";
import {
  resolveMode,
  resolveRange,
  type CustomRange,
} from "@/lib/range";
import { useReport } from "@/hooks/useReport";
import { useReportRefetch } from "@/hooks/useReportRefetch";
import { isGranularity, isScope, type Coverage, type Scope } from "@/types/report";

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

/**
 * Client entry point for the dashboard body. Maps the URL mode to API params
 * (`lib/range.ts`), fetches the report (`useReport`), gap-fills the chart
 * (`lib/calendar.ts`) and renders loading / error / data states.
 *
 * Adaptive "todo" resolution: the request resolution comes from the coverage of
 * the previous report. The first fetch has no coverage, so `resolveRange`
 * defaults "todo" to monthly; when the report arrives we store its coverage in
 * state, which re-runs `resolveRange`. For a short history this switches to
 * weekly, changing the request key and triggering a single refetch at the finer
 * resolution. Coverage is only consulted for "todo"; other modes ignore it.
 */
export default function Dashboard() {
  const searchParams = useSearchParams();
  const mode = resolveMode(searchParams.get("mode"));
  const custom = readCustom(searchParams);
  const rawScope = searchParams.get("scope");
  const scope: Scope = isScope(rawScope) ? rawScope : "all";

  const { register } = useReportRefetch();
  const [coverage, setCoverage] = useState<Coverage | null>(null);
  const [filterOpen, setFilterOpen] = useState(mode === "custom");
  const [profileLabel, setProfileLabel] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/me/profile", { credentials: "include" })
      .then((r) => r.ok ? r.json() as Promise<{ label: string; group: string }> : null)
      .then((d) => { if (d?.label) setProfileLabel(d.group ? `${d.label} — ${d.group}` : d.label); })
      .catch(() => null);
  }, []);

  const customRes = custom?.res;
  const customStart = custom?.start;
  const customEnd = custom?.end;

  const range = useMemo(
    () => {
      const c =
        customRes && customStart && customEnd
          ? { res: customRes, start: customStart, end: customEnd }
          : undefined;
      return resolveRange(mode, c, new Date(), mode === "todo" ? coverage : null);
    },
    [mode, customRes, customStart, customEnd, coverage],
  );

  const { status, report, error, refetch } = useReport(range.resolution, {
    start: range.start,
    end: range.end,
    scope,
  });

  useEffect(() => {
    register(refetch);
  }, [register, refetch]);

  // Capture coverage so the "todo" mode can adapt its resolution. Derived during
  // render (not in an effect): the guarded comparison converges in one extra
  // render, then stays stable. Only "todo" consumes it.
  if (
    mode === "todo" &&
    report &&
    (coverage?.first !== report.meta.coverage.first ||
      coverage?.last !== report.meta.coverage.last)
  ) {
    setCoverage(report.meta.coverage);
  }

  const modeBar = (
    <>
      <div className="flex items-center justify-between gap-3">
        <SyncButton />
        <div className="flex items-center gap-3">
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
        </div>
      </div>
      {filterOpen && (
        <div id="custom-range-filter">
          <CustomRangeFilter value={custom} />
        </div>
      )}
    </>
  );

  if (status === "loading") {
    return (
      <>
        {modeBar}
        <section
          aria-busy="true"
          className="rounded-lg border border-surface bg-surface/40 p-6"
        >
          <p className="font-mono text-sm text-muted">Carregando telemetria…</p>
        </section>
      </>
    );
  }

  if (status === "error" || !report) {
    return (
      <>
        {modeBar}
        <section className="rounded-lg border border-level-abaixo/40 bg-surface/40 p-6">
          <p className="font-mono text-sm text-level-abaixo">
            {error ??
              "Não foi possível carregar os dados da telemetria. Verifique se a API está no ar e tente novamente."}
          </p>
        </section>
      </>
    );
  }

  const items = fillPeriods(
    report.periods,
    range.resolution,
    range.start,
    range.end,
  );
  const hasData = report.periods.length > 0;

  return (
    <>
      {modeBar}
      <DashboardView
        resolution={range.resolution}
        report={report}
        items={items}
        hasData={hasData}
        profileLabel={profileLabel}
      />
    </>
  );
}
