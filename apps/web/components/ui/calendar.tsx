"use client";

import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import type * as React from "react";
import { DayPicker } from "react-day-picker";
import type { DropdownProps } from "react-day-picker";

import { cn } from "@/lib/utils";

const NAV_BTN =
  "size-8 flex items-center justify-center rounded border border-transparent text-muted transition-colors hover:border-surface hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent";

function TerminalDropdown({ value, onChange, options }: DropdownProps) {
  return (
    <select
      value={value}
      onChange={onChange as React.ChangeEventHandler<HTMLSelectElement>}
      className="rounded border border-surface bg-background px-1.5 py-0.5 font-mono text-[11px] text-foreground outline-none focus:ring-2 focus:ring-accent"
    >
      {options?.map((o) => (
        <option key={o.value} value={o.value} disabled={o.disabled}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  components: userComponents,
  ...props
}: React.ComponentProps<typeof DayPicker>) {
  const defaultClassNames = {
    button_next: NAV_BTN,
    button_previous: NAV_BTN,
    caption_label: "font-mono text-xs font-medium uppercase tracking-wider text-foreground",
    day: "group size-8 px-0 py-px text-sm",
    day_button:
      "relative flex size-8 items-center justify-center whitespace-nowrap rounded font-mono text-xs text-foreground group-[[data-selected]:not(.range-middle)]:[transition-property:color,background-color,border-radius] group-[[data-selected]:not(.range-middle)]:duration-150 group-data-disabled:pointer-events-none focus-visible:z-10 hover:not-in-data-selected:bg-surface hover:not-in-data-selected:text-foreground group-data-selected:bg-accent group-data-selected:text-foreground group-data-disabled:text-muted group-data-disabled:line-through group-data-outside:text-muted group-data-selected:group-data-outside:text-foreground outline-none focus-visible:ring-2 focus-visible:ring-accent group-[.range-start:not(.range-end)]:rounded-e-none group-[.range-end:not(.range-start)]:rounded-s-none group-[.range-middle]:rounded-none group-[.range-middle]:group-data-selected:bg-surface/60 group-[.range-middle]:group-data-selected:text-foreground",
    hidden: "invisible",
    month: "w-full",
    month_caption: "relative mx-10 mb-1 flex h-8 items-center justify-center z-20",
    months: "relative flex flex-col sm:flex-row gap-4",
    nav: "absolute top-0 flex w-full justify-between z-10",
    outside: "text-muted",
    range_end: "range-end",
    range_middle: "range-middle",
    range_start: "range-start",
    today:
      "*:after:pointer-events-none *:after:absolute *:after:bottom-1 *:after:start-1/2 *:after:z-10 *:after:size-[3px] *:after:-translate-x-1/2 *:after:rounded-full *:after:bg-accent [&[data-selected]:not(.range-middle)>*]:after:bg-foreground [&[data-disabled]>*]:after:bg-muted *:after:transition-colors",
    week_number: "size-8 p-0 font-mono text-[10px] text-muted",
    weekday: "size-8 p-0 font-mono text-[10px] uppercase text-muted",
    dropdowns: "flex items-center gap-2",
  };

  const mergedClassNames = Object.keys(defaultClassNames).reduce(
    (acc, key) => {
      const userClass = classNames?.[key as keyof typeof classNames];
      const baseClass = defaultClassNames[key as keyof typeof defaultClassNames];
      acc[key as keyof typeof defaultClassNames] = userClass
        ? cn(baseClass, userClass)
        : baseClass;
      return acc;
    },
    { ...defaultClassNames } as typeof defaultClassNames,
  );

  const defaultComponents = {
    Chevron: (p: {
      orientation?: "left" | "right" | "up" | "down";
      className?: string;
      size?: number;
    }) =>
      p.orientation === "left" ? (
        <ChevronLeftIcon size={14} aria-hidden="true" />
      ) : (
        <ChevronRightIcon size={14} aria-hidden="true" />
      ),
    Dropdown: TerminalDropdown,
  };

  return (
    <DayPicker
      className={cn("w-fit", className)}
      classNames={mergedClassNames}
      components={{ ...defaultComponents, ...userComponents }}
      showOutsideDays={showOutsideDays}
      {...props}
    />
  );
}

export { Calendar };
