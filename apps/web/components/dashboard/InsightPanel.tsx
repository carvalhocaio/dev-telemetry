"use client";

import { useNarrative } from "@/hooks/useNarrative";
import { useTypewriter } from "@/hooks/useTypewriter";
import type { Resolution } from "@/types/report";

interface InsightPanelProps {
  resolution: Resolution;
  period: string | null;
}

interface InsightListProps {
  title: string;
  items: string[];
  markerClassName: string;
}

function InsightList({ title, items, markerClassName }: InsightListProps) {
  return (
    <div>
      <span className="font-mono text-[10px] uppercase tracking-widest text-muted">
        {title}
      </span>
      <ul className="mt-2 space-y-1.5">
        {items.map((item) => (
          <li key={item} className="flex gap-2 font-mono text-xs text-foreground">
            <span className={markerClassName} aria-hidden="true">
              ›
            </span>
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * AI narrative for the selected period, shown in a three-column layout below the
 * chart: the summary (typewriter-revealed), strengths, and watchouts. Idle until
 * a chart point is selected; surfaces loading and error states explicitly.
 */
export default function InsightPanel({ resolution, period }: InsightPanelProps) {
  const { status, data, error } = useNarrative(resolution, period);
  const summary = data?.narrative.summary ?? "";
  const typedSummary = useTypewriter(summary);

  return (
    <section
      aria-label="Análise do período"
      aria-live="polite"
      className="border-t border-border pt-6"
    >
      {status === "idle" && (
        <p className="text-center font-mono text-xs text-muted">
          — selecione um ponto no gráfico para ver a análise
        </p>
      )}

      {status === "loading" && (
        <p className="font-mono text-xs text-muted">
          <span className="animate-pulse">CARREGANDO ANÁLISE…</span>
        </p>
      )}

      {status === "error" && (
        <p className="font-mono text-xs text-alert">{error}</p>
      )}

      {status === "success" && data && (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <div>
            <span className="font-mono text-[10px] uppercase tracking-widest text-muted">
              ANÁLISE
            </span>
            <p className="mt-2 font-mono text-sm leading-relaxed text-foreground">
              {typedSummary}
            </p>
            <div className="mt-3 flex justify-between">
              <span className="font-mono text-[10px] text-muted">
                {data.period}
              </span>
              <span className="font-mono text-[10px] text-muted">
                {data.model}
              </span>
            </div>
          </div>

          <InsightList
            title="PONTOS FORTES"
            items={data.narrative.strengths}
            markerClassName="text-accent"
          />
          <InsightList
            title="SITUAÇÃO"
            items={data.narrative.watchouts}
            markerClassName="text-alert"
          />
        </div>
      )}
    </section>
  );
}
