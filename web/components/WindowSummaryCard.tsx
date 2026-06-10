import { LEVEL_META, type WindowSummary } from "@/types/report";

interface WindowSummaryCardProps {
  window: WindowSummary;
  smallSample: boolean;
}

const MAX_BLOCKS = 24;
const BLOCK = "█";

interface StatProps {
  label: string;
  value: string;
}

function Stat({ label, value }: StatProps) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="font-mono text-[10px] uppercase tracking-wider text-muted">
        {label}
      </span>
      <span className="font-mono text-sm tabular-nums text-foreground">{value}</span>
    </div>
  );
}

function formatRange(start: string | null, end: string | null): string {
  if (start && end) {
    return start === end ? start : `${start} → ${end}`;
  }
  return "Todo o período";
}

/**
 * Aggregated summary card for the active filter window: representative level +
 * composite (big mono) and the window totals. Shows a "período em andamento"
 * badge when the window includes the in-progress current period.
 */
export default function WindowSummaryCard({
  window,
  smallSample,
}: WindowSummaryCardProps) {
  const filled = Math.max(
    1,
    Math.round(Math.max(0, Math.min(1, window.composite)) * MAX_BLOCKS),
  );
  const meta = LEVEL_META[window.level];
  const churn = window.additions + window.deletions;

  return (
    <section
      aria-label="Resumo da janela selecionada"
      className="rounded-lg border border-surface bg-surface/40 p-5"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div className="flex flex-wrap items-baseline gap-3">
          <span className="font-mono text-xs text-muted">
            {formatRange(window.start, window.end)}
          </span>
          <span
            className="font-display text-sm font-medium"
            style={{ color: meta.colorVar }}
          >
            {meta.label}
          </span>
          {window.partialCurrent && (
            <span className="rounded border border-accent px-1.5 py-0.5 font-mono text-[10px] text-accent">
              período em andamento
            </span>
          )}
          {smallSample && (
            <span className="rounded border border-muted px-1.5 py-0.5 font-mono text-[10px] text-muted">
              amostra pequena
            </span>
          )}
        </div>
        <span className="font-mono text-3xl tabular-nums text-foreground">
          {window.composite.toFixed(2)}
        </span>
      </div>

      <div
        aria-hidden="true"
        className="mt-3 overflow-hidden font-mono text-sm leading-none"
        style={{ color: meta.colorVar }}
      >
        {BLOCK.repeat(filled)}
        <span className="text-muted opacity-30">
          {BLOCK.repeat(MAX_BLOCKS - filled)}
        </span>
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Commits" value={window.commitCount.toLocaleString("pt-BR")} />
        <Stat
          label="PRs"
          value={`${window.prMerged}/${window.prCount}`}
        />
        <Stat label="Churn" value={churn.toLocaleString("pt-BR")} />
        <Stat label="Dias ativos" value={String(window.activeDays)} />
      </dl>
    </section>
  );
}
