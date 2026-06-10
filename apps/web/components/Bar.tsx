import { LEVEL_META, type Level } from "@/types/report";

interface DataBarProps {
  noData?: false;
  /** Composite score, 0..1, mapped to bar height in block characters. */
  value: number;
  level: Level;
  active: boolean;
  /** Short date label rendered under the bar. */
  label: string;
  /** Accessible description of the bar for screen readers. */
  ariaLabel: string;
  /** Wider bars + larger label when the chart shows only a few columns. */
  emphasis?: boolean;
  onSelect: () => void;
}

interface NoDataBarProps {
  noData: true;
  label: string;
  ariaLabel: string;
  emphasis?: boolean;
}

type BarProps = DataBarProps | NoDataBarProps;

/** Total number of block rows when the score is 1.0. */
const MAX_BLOCKS = 12;
const BLOCK = "█";

function blockColumn(filled: number, emphasis: boolean): React.ReactNode {
  const blocks = Array.from({ length: MAX_BLOCKS }, (_, index) => index);
  return (
    <span
      aria-hidden="true"
      className={`flex flex-col-reverse font-mono leading-[0.9] ${
        emphasis ? "text-base" : "text-sm"
      }`}
    >
      {blocks.map((index) => (
        <span key={index} className={index < filled ? "opacity-100" : "opacity-15"}>
          {BLOCK}
        </span>
      ))}
    </span>
  );
}

function barLabel(label: string, emphasis: boolean, active: boolean): React.ReactNode {
  return (
    <span
      aria-hidden="true"
      className={`font-mono tabular-nums ${emphasis ? "text-xs" : "text-[10px]"} ${
        active ? "text-foreground" : "text-muted"
      }`}
    >
      {label}
    </span>
  );
}

/**
 * A single chart column of monospace block characters. Data bars are real
 * `<button>`s (focusable, keyboard-operable) colored by performance level.
 * No-data slots render a muted, minimal, non-interactive column — they exist
 * only to keep weekends and empty days visible in the calendar.
 */
export default function Bar(props: BarProps) {
  const emphasis = props.emphasis ?? false;
  const padX = emphasis ? "px-2" : "px-1";

  if (props.noData) {
    return (
      <div
        role="img"
        aria-label={props.ariaLabel}
        className={`flex flex-col items-center gap-2 rounded-sm ${padX} py-1`}
      >
        <span className="flex flex-col-reverse font-mono text-sm leading-[0.9] text-muted opacity-15">
          {BLOCK}
        </span>
        {barLabel(props.label, emphasis, false)}
      </div>
    );
  }

  const clamped = Math.max(0, Math.min(1, props.value));
  const filled = Math.max(1, Math.round(clamped * MAX_BLOCKS));

  return (
    <button
      type="button"
      onClick={props.onSelect}
      aria-pressed={props.active}
      aria-label={props.ariaLabel}
      className={`group flex flex-col items-center gap-2 rounded-sm ${padX} py-1 outline-none transition-colors focus-visible:ring-2 focus-visible:ring-accent ${
        props.active ? "bg-surface" : "hover:bg-surface/60"
      }`}
      style={{ color: LEVEL_META[props.level].colorVar }}
    >
      <span
        className={props.active ? "ring-1 ring-accent rounded-sm" : ""}
      >
        {blockColumn(filled, emphasis)}
      </span>
      {barLabel(props.label, emphasis, props.active)}
    </button>
  );
}
