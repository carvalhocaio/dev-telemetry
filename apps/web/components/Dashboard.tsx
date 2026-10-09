"use client";

import { useSearchParams } from "next/navigation";
import { useMemo } from "react";

import DailyTimeline from "@/components/dashboard/DailyTimeline";
import ModeSelector from "@/components/ModeSelector";
import {
  resolveMode,
  resolveRange,
  type CustomRange,
} from "@/lib/range";
import { isGranularity, isScope, type Scope } from "@/types/report";

/**
 * Reads the custom-mode params from the URL, returning them only when complete.
 */
function readCustom(searchParams: URLSearchParams): CustomRange | undefined {
  const res = searchParams.get("res");
  const start = searchParams.get("start");
  const end = searchParams.get("end");
  if (res && isGranularity(res) && start && end) {
    return { res, start, end };
  }
  return undefined;
}

export default function Dashboard() {
  const searchParams = useSearchParams();
  const mode = resolveMode(searchParams.get("mode"));
  const custom = readCustom(searchParams);
  const rawScope = searchParams.get("scope");
  const scope: Scope = isScope(rawScope) ? rawScope : "all";

  const customRes = custom?.res;
  const customStart = custom?.start;
  const customEnd = custom?.end;

  const range = useMemo(
    () => {
      const c =
        customRes && customStart && customEnd
          ? { res: customRes, start: customStart, end: customEnd }
          : undefined;
      return resolveRange(mode, c, new Date());
    },
    [mode, customRes, customStart, customEnd],
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-melodrama text-xl font-bold tracking-tight text-foreground">
          Atividades Diárias
        </h2>
        <ModeSelector current={mode} customValue={custom} />
      </div>

      <DailyTimeline start={range.start} end={range.end} scope={scope} />
    </div>
  );
}
