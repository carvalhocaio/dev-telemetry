"use client";

import { useCallback, useEffect, useState } from "react";

import type { Granularity, Report } from "@/types/report";

type Status = "loading" | "error" | "success";

interface UseReportRange {
  start?: string;
  end?: string;
}

interface UseReportState {
  status: Status;
  report: Report | null;
  error: string | null;
  refetch: () => void;
}

interface FetchResult {
  key: string;
  report: Report | null;
  error: string | null;
}

function buildUrl(resolution: Granularity, range: UseReportRange): string {
  const params = new URLSearchParams();
  if (range.start) params.set("start", range.start);
  if (range.end) params.set("end", range.end);
  const query = params.toString();
  return query ? `/api/reports/${resolution}?${query}` : `/api/reports/${resolution}`;
}

export function useReport(
  resolution: Granularity,
  range: UseReportRange = {},
): UseReportState {
  const [nonce, setNonce] = useState(0);
  const [result, setResult] = useState<FetchResult | null>(null);

  const refetch = useCallback(() => setNonce((v) => v + 1), []);

  const { start, end } = range;
  const key = `${resolution}:${start ?? ""}:${end ?? ""}:${nonce}`;

  useEffect(() => {
    const controller = new AbortController();

    fetch(buildUrl(resolution, { start, end }), {
      credentials: "include",
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error("Não foi possível carregar os dados da telemetria.");
        }
        return (await response.json()) as Report;
      })
      .then((report) => setResult({ key, report, error: null }))
      .catch((cause: unknown) => {
        if (cause instanceof DOMException && cause.name === "AbortError") return;
        const message =
          cause instanceof Error ? cause.message : "Não foi possível carregar os dados.";
        setResult({ key, report: null, error: message });
      });

    return () => controller.abort();
  }, [resolution, start, end, key]);

  if (!result || result.key !== key) {
    return { status: "loading", report: null, error: null, refetch };
  }
  if (result.error) {
    return { status: "error", report: null, error: result.error, refetch };
  }
  return { status: "success", report: result.report, error: null, refetch };
}
