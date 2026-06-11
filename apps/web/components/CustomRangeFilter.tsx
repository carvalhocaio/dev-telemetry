"use client";

import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { Calendar } from "@/components/ui/calendar";
import type { CustomRange } from "@/lib/range";
import type { Granularity } from "@/types/report";

interface CustomRangeFilterProps {
  value?: CustomRange;
}

const MAX_BARS = 45;
const MS_PER_DAY = 86_400_000;

const RESOLUTIONS: readonly { value: Granularity; label: string; divisor: number }[] = [
  { value: "daily",   label: "Dia",    divisor: 1   },
  { value: "weekly",  label: "Semana", divisor: 7   },
  { value: "monthly", label: "Mês",    divisor: 30  },
];

function allowedResolutions(start: Date | undefined, end: Date | undefined) {
  if (!start || !end || start > end) return new Set<Granularity>(["daily", "weekly", "monthly"]);
  const days = Math.round((end.getTime() - start.getTime()) / MS_PER_DAY);
  return new Set<Granularity>(
    RESOLUTIONS.filter((r) => days / r.divisor <= MAX_BARS).map((r) => r.value),
  );
}

const START_MONTH = new Date(2020, 0);
const END_MONTH = new Date(new Date().getFullYear() + 1, 11);

export default function CustomRangeFilter({ value }: CustomRangeFilterProps) {
  const router = useRouter();

  const [startDate, setStartDate] = useState<Date | undefined>(
    value?.start ? new Date(value.start) : undefined,
  );
  const [endDate, setEndDate] = useState<Date | undefined>(
    value?.end ? new Date(value.end) : undefined,
  );
  const [startMonth, setStartMonth] = useState<Date>(startDate ?? new Date());
  const [endMonth, setEndMonth] = useState<Date>(endDate ?? new Date());
  const [res, setRes] = useState<Granularity>(value?.res ?? "daily");

  const ordered = !startDate || !endDate || startDate <= endDate;
  const canApply = !!startDate && !!endDate && ordered;

  const allowed = allowedResolutions(startDate, endDate);

  // Auto-switch to coarsest allowed resolution when current becomes unavailable
  useEffect(() => {
    if (!allowed.has(res)) {
      const fallback = RESOLUTIONS.slice().reverse().find((r) => allowed.has(r.value));
      if (fallback) setRes(fallback.value);
    }
  }, [allowed, res]);

  function handleApply(): void {
    if (!canApply || !startDate || !endDate) return;
    const params = new URLSearchParams({
      mode: "custom",
      res,
      start: format(startDate, "yyyy-MM-dd"),
      end: format(endDate, "yyyy-MM-dd"),
    });
    router.push(`/dashboard?${params.toString()}`);
  }

  const calendarProps = {
    mode: "single" as const,
    captionLayout: "dropdown" as const,
    locale: ptBR,
    showOutsideDays: false,
    startMonth: START_MONTH,
    endMonth: END_MONTH,
  };

  return (
    <div
      id="custom-range-filter"
      className="flex flex-col gap-4 rounded-md border border-surface bg-surface/40 p-4"
    >
      <div className="flex flex-col gap-6 sm:flex-row">
        {/* Início */}
        <div className="flex flex-col gap-2">
          <span className="font-mono text-[10px] uppercase tracking-wider text-muted">
            Início
          </span>
          <Calendar
            {...calendarProps}
            selected={startDate}
            onSelect={setStartDate}
            month={startMonth}
            onMonthChange={setStartMonth}
          />
          <span className="font-mono text-[10px] text-muted">
            {startDate ? format(startDate, "dd/MM/yyyy") : "—"}
          </span>
        </div>

        <div className="hidden w-px self-stretch bg-surface sm:block" />

        {/* Fim */}
        <div className="flex flex-col gap-2">
          <span className="font-mono text-[10px] uppercase tracking-wider text-muted">
            Fim
          </span>
          <Calendar
            {...calendarProps}
            selected={endDate}
            onSelect={setEndDate}
            month={endMonth}
            onMonthChange={setEndMonth}
          />
          <span className="font-mono text-[10px] text-muted">
            {endDate ? format(endDate, "dd/MM/yyyy") : "—"}
          </span>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-surface pt-3">
        <div className="flex items-center gap-2">
          <span className="font-mono text-[10px] uppercase tracking-wider text-muted">
            Resolução
          </span>
          <div className="flex gap-1">
            {RESOLUTIONS.map((option) => {
              const isAllowed = allowed.has(option.value);
              const isActive = res === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => isAllowed && setRes(option.value)}
                  disabled={!isAllowed}
                  title={!isAllowed ? `Mais de ${MAX_BARS} barras para esta resolução` : undefined}
                  className={`rounded border px-2 py-0.5 font-mono text-[10px] transition-colors disabled:cursor-not-allowed disabled:opacity-30 ${
                    isActive
                      ? "border-accent text-accent"
                      : "border-surface text-muted hover:border-muted hover:text-foreground"
                  }`}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        </div>

        <button
          type="button"
          onClick={handleApply}
          disabled={!canApply}
          className="rounded border border-surface bg-surface/40 px-3 py-1 font-mono text-xs text-foreground transition-colors hover:border-accent disabled:opacity-50"
        >
          Aplicar
        </button>

        {!ordered && (
          <p role="alert" className="w-full font-mono text-[10px] text-level-abaixo">
            A data de início deve ser anterior ou igual à de fim.
          </p>
        )}
      </div>
    </div>
  );
}
