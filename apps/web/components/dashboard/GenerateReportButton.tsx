"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown, Sparkles } from "lucide-react";
import DailyReportModal from "./DailyReportModal";

export interface GenerateReportButtonProps {
  scope?: string;
  filterStart?: string;
  filterEnd?: string;
}

interface RangeOption {
  id: string;
  label: string;
  subtitle: string;
  startDate: string;
  endDate: string;
}

function toLocalISODate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function parseLocalISODate(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function shiftDays(iso: string, days: number): string {
  const date = parseLocalISODate(iso);
  date.setDate(date.getDate() + days);
  return toLocalISODate(date);
}

function formatPtBr(iso: string): string {
  const parts = iso.split("-");
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return iso;
}

export default function GenerateReportButton({
  scope,
  filterStart,
  filterEnd,
}: GenerateReportButtonProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [selectedRange, setSelectedRange] = useState<{
    startDate: string;
    endDate: string;
  } | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setDropdownOpen(false);
      }
    }

    if (dropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [dropdownOpen]);

  // Close dropdown on escape
  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setDropdownOpen(false);
      }
    }

    if (dropdownOpen) {
      document.addEventListener("keydown", handleEscape);
    }
    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [dropdownOpen]);

  const todayIso = toLocalISODate(new Date());
  const yesterdayIso = shiftDays(todayIso, -1);
  const last7Iso = shiftDays(todayIso, -6);
  const last30Iso = shiftDays(todayIso, -29);

  const options: RangeOption[] = [];

  if (filterStart && filterEnd) {
    options.push({
      id: "filter",
      label: "Período do filtro (ativo)",
      subtitle: `${formatPtBr(filterStart)} a ${formatPtBr(filterEnd)}`,
      startDate: filterStart,
      endDate: filterEnd,
    });
  }

  options.push(
    {
      id: "today",
      label: "Hoje",
      subtitle: formatPtBr(todayIso),
      startDate: todayIso,
      endDate: todayIso,
    },
    {
      id: "yesterday",
      label: "Ontem",
      subtitle: formatPtBr(yesterdayIso),
      startDate: yesterdayIso,
      endDate: yesterdayIso,
    },
    {
      id: "last7",
      label: "Últimos 7 dias",
      subtitle: `${formatPtBr(last7Iso)} a ${formatPtBr(todayIso)}`,
      startDate: last7Iso,
      endDate: todayIso,
    },
    {
      id: "last30",
      label: "Últimos 30 dias",
      subtitle: `${formatPtBr(last30Iso)} a ${formatPtBr(todayIso)}`,
      startDate: last30Iso,
      endDate: todayIso,
    },
  );

  function handleSelectOption(option: RangeOption) {
    setSelectedRange({
      startDate: option.startDate,
      endDate: option.endDate,
    });
    setDropdownOpen(false);
  }

  return (
    <div ref={containerRef} className="relative inline-block text-left">
      <button
        type="button"
        onClick={() => setDropdownOpen((prev) => !prev)}
        aria-haspopup="true"
        aria-expanded={dropdownOpen}
        className="inline-flex cursor-pointer items-center gap-1.5 rounded-none border border-zinc-700 bg-surface/60 px-3 py-1 font-mono text-xs text-foreground transition-colors hover:border-accent hover:text-accent select-none"
      >
        <Sparkles size={13} className="text-accent" aria-hidden="true" />
        <span>Gerar Report</span>
        <ChevronDown
          size={13}
          className={`text-muted transition-transform duration-150 ${dropdownOpen ? "rotate-180" : ""}`}
          aria-hidden="true"
        />
      </button>

      {dropdownOpen && (
        <div
          role="menu"
          aria-orientation="vertical"
          className="absolute right-0 top-full mt-1.5 z-40 w-64 rounded-none border border-zinc-800 bg-background shadow-2xl py-1 divide-y divide-zinc-800/40"
        >
          <div className="px-3 py-1.5">
            <span className="font-mono text-[10px] uppercase tracking-wider text-muted">
              Selecione o período
            </span>
          </div>

          <div className="py-1">
            {options.map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => handleSelectOption(option)}
                className={`w-full cursor-pointer px-3 py-2 text-left transition-colors flex flex-col gap-0.5 group ${
                  option.id === "filter"
                    ? "bg-accent/10 border-l-2 border-accent hover:bg-accent/20"
                    : "hover:bg-surface/80 hover:text-accent"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`font-mono text-xs font-medium ${
                      option.id === "filter"
                        ? "text-accent"
                        : "text-foreground group-hover:text-accent"
                    }`}
                  >
                    {option.label}
                  </span>
                  {option.id === "filter" && (
                    <span className="font-mono text-[9px] uppercase px-1 border border-accent/40 text-accent bg-accent/10">
                      ativo
                    </span>
                  )}
                </div>
                <span className="font-mono text-[10px] text-muted-foreground">
                  {option.subtitle}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {selectedRange && (
        <DailyReportModal
          isOpen={Boolean(selectedRange)}
          onClose={() => setSelectedRange(null)}
          startDate={selectedRange.startDate}
          endDate={selectedRange.endDate}
          scope={scope}
        />
      )}
    </div>
  );
}
