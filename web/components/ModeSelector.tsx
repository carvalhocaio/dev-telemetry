"use client";

import Link from "next/link";

import type { Mode } from "@/types/report";

interface ModeSelectorProps {
  current: Mode;
}

/** Built-in modes shown as a segmented toggle (custom is driven by the filter). */
const MODES: readonly { mode: Mode; label: string }[] = [
  { mode: "semanal", label: "Semanal" },
  { mode: "mensal", label: "Mensal" },
  { mode: "todo", label: "Todo o período" },
];

/** Switches the time-window mode via the `?mode=` query param. */
export default function ModeSelector({ current }: ModeSelectorProps) {
  return (
    <div
      role="group"
      aria-label="Janela de tempo"
      className="inline-flex rounded-md border border-surface bg-surface/40 p-0.5 font-mono text-xs"
    >
      {MODES.map(({ mode, label }) => {
        const active = mode === current;
        return (
          <Link
            key={mode}
            href={`/?mode=${mode}`}
            aria-current={active ? "true" : undefined}
            className={`rounded px-3 py-1 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
              active
                ? "bg-accent text-background"
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
