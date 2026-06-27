"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";

export interface SelectOption {
  value: string;
  label: string;
  group?: string;
}

interface CustomSelectProps {
  value: string;
  onChange: (v: string) => void;
  options: SelectOption[];
  className?: string;
  /** When true, styles the trigger as an inline tab (no full-width border box). */
  inline?: boolean;
  /** When true (combined with inline), button stretches to fill its container. */
  stretch?: boolean;
}

export default function CustomSelect({
  value,
  onChange,
  options,
  className = "",
  inline = false,
  stretch = false,
}: CustomSelectProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [open]);

  const selected = options.find((o) => o.value === value);

  const groups = options.reduce<{ group: string | null; opts: SelectOption[] }[]>(
    (acc, opt) => {
      const g = opt.group ?? null;
      const existing = acc.find((a) => a.group === g);
      if (existing) existing.opts.push(opt);
      else acc.push({ group: g, opts: [opt] });
      return acc;
    },
    [],
  );

  const triggerClass = inline
    ? `flex cursor-pointer items-center gap-1 rounded px-3 py-1 font-mono text-xs transition-colors outline-none ${stretch ? "w-full justify-between" : ""} ${
        value ? "bg-accent text-background" : "text-muted hover:text-foreground"
      }`
    : "flex w-full cursor-pointer items-center justify-between rounded border border-surface bg-surface/40 px-3 py-2 font-mono text-sm text-foreground outline-none transition-colors hover:border-accent focus-visible:border-accent";

  const labelClass = inline ? (stretch ? "min-w-0 truncate" : "max-w-[8rem] truncate") : "";

  return (
    <div ref={ref} className={`relative ${stretch ? "flex-1 min-w-0" : ""} ${className}`}>
      <button type="button" onClick={() => setOpen((v) => !v)} className={triggerClass}>
        <span className={labelClass}>{selected?.label ?? value}</span>
        <ChevronDown
          size={12}
          className={`transition-transform duration-150 ${inline ? "text-current" : "text-muted"} ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && (
        <div className="absolute right-0 top-[calc(100%+4px)] z-20 w-max min-w-full overflow-hidden rounded border border-surface bg-background shadow-lg">
          {groups.map(({ group, opts }) => (
            <div key={group ?? "__ungrouped"}>
              {group && (
                <p className="px-3 py-1.5 font-mono text-[10px] uppercase tracking-wider text-muted/60">
                  {group}
                </p>
              )}
              {opts.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => { onChange(opt.value); setOpen(false); }}
                  className={`block w-full cursor-pointer whitespace-nowrap px-3 py-2 text-left font-mono text-sm transition-colors hover:bg-surface/60 hover:text-accent ${
                    opt.value === value ? "text-accent" : "text-foreground"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
