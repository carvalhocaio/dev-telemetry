import type { WindowSummary } from "@/types/report";

interface MetricsRowProps {
  window: WindowSummary;
}

interface StatProps {
  label: string;
  value: string;
}

function Stat({ label, value }: StatProps) {
  return (
    <div className="flex flex-col gap-1">
      <span className="font-mono text-[10px] uppercase tracking-widest text-muted">
        {label}
      </span>
      <span className="font-mono text-sm tabular-nums text-foreground">
        {value}
      </span>
      <span aria-hidden="true" className="h-px bg-border" />
    </div>
  );
}

/**
 * Secondary window stats laid out in a four-column row beneath the hero metric.
 */
export default function MetricsRow({ window }: MetricsRowProps) {
  const churn = window.additions + window.deletions;

  return (
    <dl className="grid grid-cols-4 gap-4 border-t border-border pt-4">
      <Stat label="Commits" value={window.commitCount.toLocaleString("pt-BR")} />
      <Stat label="PRs" value={`${window.prMerged}/${window.prCount}`} />
      <Stat label="Churn" value={churn.toLocaleString("pt-BR")} />
      <Stat label="Dias ativos" value={String(window.activeDays)} />
    </dl>
  );
}
