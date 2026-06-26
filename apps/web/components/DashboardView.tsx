"use client";

import { useState } from "react";

import InsightPanel from "@/components/dashboard/InsightPanel";
import MetricHero from "@/components/dashboard/MetricHero";
import MetricsRow from "@/components/dashboard/MetricsRow";
import PitWallChart from "@/components/dashboard/PitWallChart";
import type { ChartItem, Report, Resolution } from "@/types/report";

interface DashboardViewProps {
  resolution: Resolution;
  report: Report;
  items: ChartItem[];
  hasData: boolean;
  profileLabel?: string | null;
}

/**
 * Client wrapper that owns the selected-period UI state and connects the
 * chart to the insight panel. The hero and metrics row reflect the active
 * filter window; the insight panel waits for an explicit point selection.
 *
 * When the window has no in-range data the chart still renders and a hint
 * nudges the user to Sync, rather than hiding the chart behind a placeholder.
 */
export default function DashboardView({
  resolution,
  report,
  items,
  hasData,
  profileLabel,
}: DashboardViewProps) {
  const [selectedPeriod, setSelectedPeriod] = useState<string | null>(null);

  return (
    <div className="flex flex-col gap-8">
      <MetricHero window={report.window} profileLabel={profileLabel} />
      <MetricsRow window={report.window} />
      <PitWallChart
        items={items}
        selectedPeriod={selectedPeriod}
        onSelect={setSelectedPeriod}
        resolution={resolution}
      />
      {!hasData && (
        <p className="font-mono text-sm text-muted">
          Sem dados nesta janela. Use o botão Sync para importar atividade
          recente.
        </p>
      )}
      <InsightPanel resolution={resolution} period={selectedPeriod} />
    </div>
  );
}
