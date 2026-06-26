import { Info } from "lucide-react";

import type { WindowSummary } from "@/types/report";

interface MetricsRowProps {
  window: WindowSummary;
}

interface StatProps {
  label: string;
  value: string;
  hint: string;
}

function Stat({ label, value, hint }: StatProps) {
  return (
    <div className="flex flex-col gap-1">
      <div className="group/hint relative flex items-center gap-1">
        <span className="font-mono text-[10px] uppercase tracking-widest text-muted">
          {label}
        </span>
        <Info
          size={10}
          aria-label={hint}
          className="shrink-0 cursor-help text-muted/40"
        />
        <div className="pointer-events-none absolute bottom-full left-0 z-10 mb-1.5 w-52 rounded border border-border bg-surface px-2 py-1.5 font-mono text-[10px] leading-relaxed text-muted opacity-0 shadow-lg transition-opacity duration-150 group-hover/hint:opacity-100">
          {hint}
        </div>
      </div>
      <span className="font-mono text-sm tabular-nums text-foreground">
        {value}
      </span>
      <span aria-hidden="true" className="h-px bg-border" />
    </div>
  );
}

const METRICS = {
  commits: "Total de commits no período selecionado.",
  prs: "PRs mesclados em relação ao total de PRs abertos no período.",
  churn: "Linhas adicionadas + removidas. Indica o volume de mudanças no código.",
  diasAtivos: "Dias com pelo menos um commit registrado no período.",
} as const;

/**
 * Secondary window stats laid out in a four-column row beneath the hero metric.
 */
export default function MetricsRow({ window }: MetricsRowProps) {
  const churn = window.additions + window.deletions;

  return (
    <dl className="grid grid-cols-4 gap-4 border-t border-border pt-4">
      <Stat label="Commits" value={window.commitCount.toLocaleString("pt-BR")} hint={METRICS.commits} />
      <Stat label="PRs" value={`${window.prMerged}/${window.prCount}`} hint={METRICS.prs} />
      <Stat label="Churn" value={churn.toLocaleString("pt-BR")} hint={METRICS.churn} />
      <Stat label="Dias ativos" value={String(window.activeDays)} hint={METRICS.diasAtivos} />
    </dl>
  );
}
