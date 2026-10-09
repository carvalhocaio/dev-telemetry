"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar as CalendarIcon } from "lucide-react";
import type { DateRange } from "react-day-picker";

import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import type { CustomRange } from "@/lib/range";
import type { Mode } from "@/types/report";

interface ModeSelectorProps {
  current: Mode;
  customValue?: CustomRange;
}

const MODES: readonly { mode: Mode; label: string }[] = [
  { mode: "semanal", label: "Semanal" },
  { mode: "mensal", label: "Mensal" },
  { mode: "todo", label: "Todo o período" },
];

function formatDate(date: Date): string {
  return format(date, "dd/MM/yyyy");
}

function toIso(date: Date): string {
  return format(date, "yyyy-MM-dd");
}

export default function ModeSelector({ current, customValue }: ModeSelectorProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const scope = searchParams.get("scope");

  const [calendarOpen, setCalendarOpen] = useState(false);

  const initialStart = customValue?.start ? new Date(customValue.start) : undefined;
  const initialEnd = customValue?.end ? new Date(customValue.end) : undefined;

  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: initialStart,
    to: initialEnd,
  });

  const [displayMonth, setDisplayMonth] = useState<Date>(
    initialEnd ?? initialStart ?? new Date(),
  );

  const isCustom = current === "custom";

  function modeHref(mode: Mode) {
    const params = new URLSearchParams();
    params.set("mode", mode);
    if (scope) params.set("scope", scope);
    return `/dashboard?${params.toString()}`;
  }

  const startDate = dateRange?.from;
  const endDate = dateRange?.to;
  const canApply = Boolean(startDate && endDate && startDate <= endDate);

  const customLabel =
    isCustom && initialStart && initialEnd
      ? `${formatDate(initialStart)} – ${formatDate(initialEnd)}`
      : "Selecione o período";

  const rangePreview =
    startDate && endDate
      ? `${formatDate(startDate)} – ${formatDate(endDate)}`
      : startDate
        ? `${formatDate(startDate)} – …`
        : "Selecione o período";

  function handleApplyCustom() {
    if (!startDate || !endDate) return;
    const params = new URLSearchParams({
      mode: "custom",
      res: "daily",
      start: toIso(startDate),
      end: toIso(endDate),
    });
    if (scope) params.set("scope", scope);
    router.push(`/dashboard?${params.toString()}`);
    setCalendarOpen(false);
  }

  return (
    <div
      role="group"
      aria-label="Filtro de período"
      className="inline-flex items-center rounded-none border border-zinc-800 bg-surface/40 p-0.5 font-mono text-xs"
    >
      {/* Popover trigger: selecione o período */}
      <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
        <PopoverTrigger
          className={`inline-flex cursor-pointer items-center gap-1.5 rounded-none px-3 py-1 font-mono text-xs transition-colors outline-none ${
            isCustom
              ? "bg-accent text-background font-medium"
              : "text-muted hover:text-foreground"
          }`}
        >
          <span>{customLabel}</span>
          <CalendarIcon
            size={12}
            className={isCustom ? "text-background" : "text-muted"}
            aria-hidden="true"
          />
        </PopoverTrigger>

        <PopoverContent className="p-3 bg-surface/95 border-zinc-800 w-[270px]" align="start">
          <Calendar
            mode="range"
            selected={dateRange}
            onSelect={setDateRange}
            locale={ptBR}
            numberOfMonths={1}
            month={displayMonth}
            onMonthChange={setDisplayMonth}
            showOutsideDays={false}
          />
          <div className="mt-2.5 flex items-center justify-between gap-2 border-t border-zinc-800/80 pt-2">
            <span className="font-mono text-[11px] text-muted truncate max-w-[120px]">
              {rangePreview}
            </span>
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => setCalendarOpen(false)}
                className="cursor-pointer rounded-none border border-zinc-800 bg-surface px-2 py-0.5 font-mono text-xs text-muted hover:text-foreground transition-colors"
              >
                Fechar
              </button>
              <button
                type="button"
                onClick={handleApplyCustom}
                disabled={!canApply}
                className="cursor-pointer rounded-none border border-accent bg-accent/20 px-2.5 py-0.5 font-mono text-xs text-accent font-medium hover:bg-accent/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Aplicar
              </button>
            </div>
          </div>
        </PopoverContent>
      </Popover>

      <div className="h-3.5 w-px bg-zinc-800 mx-0.5" />

      {/* Preset tabs */}
      {MODES.map(({ mode, label }) => {
        const active = mode === current;
        return (
          <Link
            key={mode}
            href={modeHref(mode)}
            aria-current={active ? "true" : undefined}
            className={`rounded-none px-3 py-1 transition-colors outline-none focus-visible:ring-1 focus-visible:ring-accent ${
              active
                ? "bg-accent text-background font-medium"
                : "text-muted hover:text-foreground"
            }`}
          >
            {label}
          </Link>
        );
      })}
    </div>
  );
}
