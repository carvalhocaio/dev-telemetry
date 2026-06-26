import { Info } from "lucide-react";

import { LEVEL_META, type WindowSummary } from "@/types/report";

interface MetricHeroProps {
  window: WindowSummary;
  profileLabel?: string | null;
}

/**
 * Headline metric block: composite score and commit count in large mono type,
 * with the performance level badge and a thin progress bar tracking the
 * composite (0..1). Renders directly on the page background, without a card.
 */
export default function MetricHero({ window, profileLabel }: MetricHeroProps) {
  const composite = Math.max(0, Math.min(1, window.composite));
  const meta = LEVEL_META[window.level];

  return (
    <section
      aria-label="Métrica principal da janela"
      className="grid grid-cols-1 gap-6 sm:grid-cols-3 sm:items-end"
    >
      <div className="flex flex-col gap-0.5">
        <span className="font-mono text-5xl tabular-nums text-foreground">
          {window.composite.toFixed(2)}
        </span>
        <div className="group/hint relative flex items-center gap-1">
          <span className="font-mono text-[10px] uppercase tracking-widest text-muted">composite</span>
          <Info size={10} className="shrink-0 cursor-help text-muted/40" />
          <div className="pointer-events-none absolute bottom-full left-0 z-10 mb-1.5 w-56 rounded border border-border bg-surface px-2 py-1.5 font-mono text-[10px] leading-relaxed text-muted opacity-0 shadow-lg transition-opacity duration-150 group-hover/hint:opacity-100">
            Score de 0 a 1 calculado por ranking percentual: throughput (45%), dias ativos (35%) e churn (20%).
            <br />
            <span className="text-level-abaixo">0–0.5 abaixo</span> · <span className="text-muted">0.5–0.8 atendendo</span> · <span className="text-level-acima">0.8–0.9 acima</span> · <span className="text-level-muito-acima">0.9–1 muito acima</span>
          </div>
        </div>
        {profileLabel && (
          <span className="font-mono text-[10px] text-muted">{profileLabel}</span>
        )}
      </div>

      <div className="flex flex-col gap-0.5">
        <span className="font-mono text-4xl tabular-nums text-foreground">
          {window.commitCount.toLocaleString("pt-BR")}
        </span>
        <span className="font-mono text-[10px] uppercase tracking-widest text-muted">
          commits
        </span>
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-baseline justify-between gap-2">
          <span
            className="font-mono text-xs uppercase tracking-widest"
            style={{ color: meta.colorVar }}
          >
            {meta.label}
          </span>
          <span className="font-mono text-xs tabular-nums text-muted">
            {Math.round(composite * 100)}%
          </span>
        </div>
        <div
          className="h-0.5 w-full bg-border"
          role="progressbar"
          aria-valuenow={Math.round(composite * 100)}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Composite ${window.composite.toFixed(2)}`}
        >
          <div
            className="h-full transition-all"
            style={{ width: `${composite * 100}%`, backgroundColor: meta.colorVar }}
          />
        </div>
      </div>
    </section>
  );
}
