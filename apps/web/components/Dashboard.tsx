"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import DashboardView from "@/components/DashboardView";
import { fillPeriods } from "@/lib/calendar";
import {
  resolveMode,
  resolveRange,
  type CustomRange,
} from "@/lib/range";
import { useReport } from "@/hooks/useReport";
import { useReportRefetch } from "@/hooks/useReportRefetch";
import { isGranularity, type Coverage } from "@/types/report";

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

  const { register } = useReportRefetch();
  const [coverage, setCoverage] = useState<Coverage | null>(null);

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

  if (status === "loading") {
    return (
      <section
        aria-busy="true"
        className="rounded-lg border border-surface bg-surface/40 p-6"
      >
        <p className="font-mono text-sm text-muted">Carregando telemetria…</p>
      </section>
    );
  }

  if (status === "error" || !report) {
    return (
      <section className="rounded-lg border border-level-abaixo/40 bg-surface/40 p-6">
        <p className="font-mono text-sm text-level-abaixo">
          {error ??
            "Não foi possível carregar os dados da telemetria. Verifique se a API está no ar e tente novamente."}
        </p>
      </section>
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
    <DashboardView
      resolution={range.resolution}
      report={report}
      items={items}
      hasData={hasData}
    />
  );
}
