"use client";

import { useState } from "react";

import NarrativePanel from "@/components/NarrativePanel";
import TerminalChart from "@/components/TerminalChart";
import WindowSummaryCard from "@/components/WindowSummaryCard";
import type { ChartItem, Resolution, Report } from "@/types/report";

interface DashboardViewProps {
  resolution: Resolution;
  report: Report;
  /** Gap-filled chart slots, oldest → newest. */
  items: ChartItem[];
  /** Whether the window contains any real period data. */
  hasData: boolean;
}

/**
 * Client wrapper that owns the selected-period UI state and connects the
 * TerminalChart to the NarrativePanel. The window summary card reflects the
 * active filter; the narrative panel waits for an explicit bar click.
 *
 * When the window has no in-range data the chart still renders (as gap-filled
 * "sem dados" bars) and a hint nudges the user to Sync, rather than hiding the
 * chart behind an empty placeholder.
 */
export default function DashboardView({
  resolution,
  report,
  items,
  hasData,
}: DashboardViewProps) {
  const [selectedPeriod, setSelectedPeriod] = useState<string | null>(null);

  return (
    <div className="flex flex-col gap-6">
      <WindowSummaryCard
        window={report.window}
        smallSample={report.meta.smallSample}
      />
      <TerminalChart
        items={items}
        selectedPeriod={selectedPeriod}
        onSelect={setSelectedPeriod}
      />
      {!hasData && (
        <p className="font-mono text-sm text-muted">
          Sem dados nesta janela. Use o botão Sync para importar atividade
          recente.
        </p>
      )}
      <NarrativePanel resolution={resolution} period={selectedPeriod} />
    </div>
  );
}
