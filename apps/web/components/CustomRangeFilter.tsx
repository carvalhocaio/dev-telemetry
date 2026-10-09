"use client";

import { useState } from "react";
import { format, subDays, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar as CalendarIcon } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import type { DateRange } from "react-day-picker";

import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import type { CustomRange } from "@/lib/range";

interface CustomRangeFilterProps {
  value?: CustomRange;
  onApply?: () => void;
}

function formatDate(date: Date): string {
  return format(date, "dd/MM/yyyy");
}

function toIso(date: Date): string {
  return format(date, "yyyy-MM-dd");
}

export default function CustomRangeFilter({ value, onApply }: CustomRangeFilterProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const scope = searchParams.get("scope");

  const initialStart = value?.start ? new Date(value.start) : undefined;
  const initialEnd = value?.end ? new Date(value.end) : undefined;

  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: initialStart,
    to: initialEnd,
  });

  const [displayMonth, setDisplayMonth] = useState<Date>(
    initialEnd ?? initialStart ?? new Date(),
  );
  const [isOpen, setIsOpen] = useState(false);

  const startDate = dateRange?.from;
  const endDate = dateRange?.to;

  const canApply = Boolean(startDate && endDate && startDate <= endDate);

  const rangeLabel =
    startDate && endDate
      ? `${formatDate(startDate)} – ${formatDate(endDate)}`
      : startDate
        ? `${formatDate(startDate)} – …`
        : "Selecione o período";

  function applyRange(start: Date, end: Date) {
    const params = new URLSearchParams({
      mode: "custom",
      res: "daily",
      start: toIso(start),
      end: toIso(end),
    });
    if (scope) params.set("scope", scope);
    router.push(`/dashboard?${params.toString()}`);
    setIsOpen(false);
    onApply?.();
  }

  function handleApply() {
    if (!startDate || !endDate) return;
    applyRange(startDate, endDate);
  }

  function applyPreset(preset: "today" | "week" | "month") {
    const now = new Date();
    let from: Date;
    let to: Date = now;

    if (preset === "today") {
      from = now;
      to = now;
    } else if (preset === "week") {
      from = subDays(now, 7);
    } else {
      from = subMonths(now, 1);
    }

    setDateRange({ from, to });
    setDisplayMonth(to);
    applyRange(from, to);
  }

  function handleRangeSelect(range: DateRange | undefined) {
    setDateRange(range);
  }

  return (
    <div
      id="custom-range-filter"
      className="flex flex-col gap-2 rounded-none border border-zinc-800 bg-surface/40 p-4"
    >
      <span className="font-mono text-xs uppercase tracking-wider text-muted font-semibold">
        Período
      </span>

      <div className="flex flex-wrap items-center gap-2">
        {/* Single Calendar Popover */}
        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger className="inline-flex cursor-pointer items-center justify-between gap-3 rounded-none border border-zinc-800 bg-surface px-3 py-1.5 font-mono text-xs text-foreground transition-colors hover:border-accent hover:text-accent select-none">
            <span>{rangeLabel}</span>
            <CalendarIcon size={14} className="text-muted" aria-hidden="true" />
          </PopoverTrigger>

          <PopoverContent className="p-3 bg-surface/95 border-zinc-800" align="start">
            <Calendar
              mode="range"
              selected={dateRange}
              onSelect={handleRangeSelect}
              locale={ptBR}
              numberOfMonths={1}
              month={displayMonth}
              onMonthChange={setDisplayMonth}
              showOutsideDays={false}
            />

            <div className="mt-3 flex items-center justify-between gap-3 border-t border-zinc-800/80 pt-2.5">
              <span className="font-mono text-[11px] text-muted truncate max-w-[170px]">
                {rangeLabel}
              </span>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="cursor-pointer rounded-none border border-zinc-800 bg-surface px-2.5 py-1 font-mono text-xs text-muted hover:text-foreground transition-colors"
                >
                  Fechar
                </button>
                <button
                  type="button"
                  onClick={handleApply}
                  disabled={!canApply}
                  className="cursor-pointer rounded-none border border-accent bg-accent/20 px-3 py-1 font-mono text-xs text-accent font-medium hover:bg-accent/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Aplicar
                </button>
              </div>
            </div>
          </PopoverContent>
        </Popover>

        {/* Quick presets */}
        <button
          type="button"
          onClick={() => applyPreset("week")}
          className="cursor-pointer rounded-none border border-zinc-800 bg-surface/60 px-3 py-1.5 font-mono text-xs text-muted hover:border-zinc-700 hover:text-foreground transition-colors"
        >
          Última semana
        </button>

        <button
          type="button"
          onClick={() => applyPreset("month")}
          className="cursor-pointer rounded-none border border-zinc-800 bg-surface/60 px-3 py-1.5 font-mono text-xs text-muted hover:border-zinc-700 hover:text-foreground transition-colors"
        >
          Último mês
        </button>

        <button
          type="button"
          onClick={() => applyPreset("today")}
          className="cursor-pointer rounded-none border border-zinc-800 bg-surface/60 px-3 py-1.5 font-mono text-xs text-muted hover:border-zinc-700 hover:text-foreground transition-colors"
        >
          Hoje
        </button>
      </div>
    </div>
  );
}
