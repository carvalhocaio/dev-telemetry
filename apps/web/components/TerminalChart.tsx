"use client";

import { useRef } from "react";

import Bar from "@/components/Bar";
import { isNoData, LEVEL_META, type ChartItem } from "@/types/report";

interface TerminalChartProps {
  /** Oldest → newest, already gap-filled (see `lib/calendar.ts`). */
  items: ChartItem[];
  selectedPeriod: string | null;
  onSelect: (period: string) => void;
}

/** At or below this count the chart is centered and bars get more emphasis. */
const FEW_BARS = 10;

function formatLabel(period: string): string {
  // "2026-06-09" -> "06/09"
  const [, month, day] = period.split("-");
  return `${month}/${day}`;
}

/**
 * Maps each item to its keyboard-navigation index, assigning sequential indices
 * to data bars only (no-data slots get -1). Kept pure so the running counter
 * never mutates render-scope state.
 */
function buttonIndices(items: ChartItem[]): number[] {
  let next = -1;
  return items.map((item) => (isNoData(item) ? -1 : (next += 1)));
}

/**
 * Signature element: a bar chart drawn with monospace block characters, one
 * column per slot, colored by performance level. Items arrive oldest → newest
 * and may include no-data placeholders (muted, non-interactive). With only a
 * few columns the chart is centered and bars get extra width. Data bars are
 * keyboard-navigable with the arrow keys; no-data slots are skipped.
 */
export default function TerminalChart({
  items,
  selectedPeriod,
  onSelect,
}: TerminalChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const emphasis = items.length <= FEW_BARS;

  function focusBarAt(index: number): void {
    const buttons =
      containerRef.current?.querySelectorAll<HTMLButtonElement>("button");
    if (!buttons || buttons.length === 0) {
      return;
    }
    const clamped = Math.max(0, Math.min(index, buttons.length - 1));
    buttons[clamped]?.focus();
  }

  function handleKeyDown(
    event: React.KeyboardEvent<HTMLDivElement>,
    buttonIndex: number,
  ): void {
    const buttonCount =
      containerRef.current?.querySelectorAll("button").length ?? 0;
    switch (event.key) {
      case "ArrowRight":
        event.preventDefault();
        focusBarAt(buttonIndex + 1);
        break;
      case "ArrowLeft":
        event.preventDefault();
        focusBarAt(buttonIndex - 1);
        break;
      case "Home":
        event.preventDefault();
        focusBarAt(0);
        break;
      case "End":
        event.preventDefault();
        focusBarAt(buttonCount - 1);
        break;
      default:
        break;
    }
  }

  // Keyboard-nav index per item (no-data slots get -1 and stay non-interactive).
  const indices = buttonIndices(items);

  return (
    <section aria-label="Histórico de desempenho por período">
      <div
        ref={containerRef}
        role="group"
        className={`flex items-end gap-1 overflow-x-auto pb-2 ${
          emphasis ? "justify-center gap-2" : ""
        }`}
      >
        {items.map((item, i) => {
          if (isNoData(item)) {
            return (
              <div key={item.period}>
                <Bar
                  noData
                  label={formatLabel(item.period)}
                  ariaLabel={`Sem atividade em ${item.period}`}
                  emphasis={emphasis}
                />
              </div>
            );
          }

          const index = indices[i];
          return (
            <div key={item.period} onKeyDown={(event) => handleKeyDown(event, index)}>
              <Bar
                value={item.composite}
                level={item.level}
                active={item.period === selectedPeriod}
                label={formatLabel(item.period)}
                ariaLabel={`Período ${item.period}, nível ${LEVEL_META[item.level].label}, score ${item.composite.toFixed(2)}`}
                emphasis={emphasis}
                onSelect={() => onSelect(item.period)}
              />
            </div>
          );
        })}
      </div>
    </section>
  );
}
