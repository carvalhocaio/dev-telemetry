"use client";

import { useNarrative } from "@/hooks/useNarrative";
import { useTypewriter } from "@/hooks/useTypewriter";
import type { Resolution } from "@/types/report";

interface NarrativePanelProps {
  resolution: Resolution;
  period: string | null;
}

interface NarrativeListProps {
  title: string;
  items: string[];
}

function NarrativeList({ title, items }: NarrativeListProps) {
  if (items.length === 0) {
    return null;
  }
  return (
    <div>
      <h4 className="font-mono text-xs uppercase tracking-wider text-muted">
        {title}
      </h4>
      <ul className="mt-1 space-y-1 font-mono text-sm">
        {items.map((item) => (
          <li key={item} className="flex gap-2">
            <span className="text-accent" aria-hidden="true">
              ›
            </span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * Sliding panel below the chart. On bar selection it fetches the period's
 * narrative through the server-side proxy and reveals the summary with a subtle
 * typewriter effect (disabled under prefers-reduced-motion).
 */
export default function NarrativePanel({
  resolution,
  period,
}: NarrativePanelProps) {
  const { status, data, error } = useNarrative(resolution, period);
  const summary = data?.narrative.summary ?? "";
  const typed = useTypewriter(summary);

  return (
    <section
      aria-label="Narrativa do período"
      aria-live="polite"
      className="rounded-lg border border-surface bg-surface/40 p-5"
    >
      {status === "idle" && (
        <p className="font-mono text-sm text-muted">
          Selecione uma barra para ver a análise do período.
        </p>
      )}

      {status === "loading" && (
        <p className="font-mono text-sm text-muted">Carregando narrativa…</p>
      )}

      {status === "error" && (
        <p className="font-mono text-sm text-level-abaixo">{error}</p>
      )}

      {status === "success" && data && (
        <article className="space-y-4">
          <header className="flex items-baseline justify-between gap-2">
            <span className="font-mono text-xs text-muted">{data.period}</span>
            <span className="font-mono text-[10px] text-muted">
              {data.model}
            </span>
          </header>
          <p className="font-mono text-sm leading-relaxed text-foreground">
            {typed}
          </p>
          <NarrativeList title="Temas" items={data.narrative.themes} />
          <NarrativeList title="Pontos fortes" items={data.narrative.strengths} />
          <NarrativeList title="Atenção" items={data.narrative.watchouts} />
        </article>
      )}
    </section>
  );
}
