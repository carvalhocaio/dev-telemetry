"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import type { CustomRange } from "@/lib/range";
import type { Granularity } from "@/types/report";

interface CustomRangeFilterProps {
  /** Current custom params (when the active mode is "custom"), to prefill. */
  value?: CustomRange;
}

const RESOLUTIONS: readonly { value: Granularity; label: string }[] = [
  { value: "daily", label: "Dia" },
  { value: "weekly", label: "Semana" },
  { value: "monthly", label: "Mês" },
];

const FIELD_CLASS =
  "rounded-md border border-surface bg-background px-2 py-1 font-mono text-xs text-foreground outline-none focus-visible:ring-2 focus-visible:ring-accent";

/**
 * Date filter: a start/end pair plus a resolution select. On apply it navigates
 * to `?mode=custom&res=..&start=..&end=..`. Apply is disabled until both dates
 * are set and start ≤ end, with an inline message explaining why.
 */
export default function CustomRangeFilter({ value }: CustomRangeFilterProps) {
  const router = useRouter();
  const [start, setStart] = useState(value?.start ?? "");
  const [end, setEnd] = useState(value?.end ?? "");
  const [res, setRes] = useState<Granularity>(value?.res ?? "daily");

  const bothSet = start !== "" && end !== "";
  const ordered = !bothSet || start <= end;
  const canApply = bothSet && ordered;

  function handleSubmit(event: React.SyntheticEvent<HTMLFormElement>): void {
    event.preventDefault();
    if (!canApply) {
      return;
    }
    const params = new URLSearchParams({ mode: "custom", res, start, end });
    router.push(`/dashboard?${params.toString()}`);
  }

  return (
    <form
      onSubmit={handleSubmit}
      aria-label="Filtro de data personalizado"
      className="flex flex-wrap items-end gap-3 rounded-md border border-surface bg-surface/40 p-3"
    >
      <div className="flex flex-col gap-1">
        <label htmlFor="range-start" className="font-mono text-[10px] text-muted">
          Início
        </label>
        <input
          id="range-start"
          type="date"
          value={start}
          max={end || undefined}
          onChange={(event) => setStart(event.target.value)}
          className={FIELD_CLASS}
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="range-end" className="font-mono text-[10px] text-muted">
          Fim
        </label>
        <input
          id="range-end"
          type="date"
          value={end}
          min={start || undefined}
          onChange={(event) => setEnd(event.target.value)}
          className={FIELD_CLASS}
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="range-res" className="font-mono text-[10px] text-muted">
          Resolução
        </label>
        <select
          id="range-res"
          value={res}
          onChange={(event) => setRes(event.target.value as Granularity)}
          className={FIELD_CLASS}
        >
          {RESOLUTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <button
        type="submit"
        disabled={!canApply}
        className="rounded-md border border-surface bg-surface/40 px-3 py-1 font-mono text-xs text-foreground transition-colors hover:border-accent disabled:opacity-50"
      >
        Aplicar
      </button>

      {!ordered && (
        <p role="alert" className="w-full font-mono text-[10px] text-level-abaixo">
          A data de início deve ser anterior ou igual à de fim.
        </p>
      )}
    </form>
  );
}
