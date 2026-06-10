"use client";

import { useCallback, useEffect, useState } from "react";

import { useAuth } from "@/hooks/useAuth";
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

/** Outcome of a single fetch, keyed by the request that produced it. */
interface FetchResult {
  key: string;
  report: Report | null;
  error: string | null;
}

function buildUrl(resolution: Granularity, range: UseReportRange): string {
  const params = new URLSearchParams();
  if (range.start) {
    params.set("start", range.start);
  }
  if (range.end) {
    params.set("end", range.end);
  }
  const query = params.toString();
  return query ? `/api/reports/${resolution}?${query}` : `/api/reports/${resolution}`;
}

/**
 * Fetches the report for a resolution + optional date window from the Next
 * proxy, forwarding the API password as a Bearer token. Returns explicit
 * loading / error / success states and a `refetch` callback (used by the sync
 * button). A 401 locks the session.
 *
 * Note: a windowed request may legitimately return zero in-window periods (the
 * latest data predates the window). That is *not* an error: the report still
 * carries a `window` summary, and the chart renders gap-filled "sem dados"
 * bars. There is therefore no "empty" status — the view always renders.
 */
export function useReport(
  resolution: Granularity,
  range: UseReportRange = {},
): UseReportState {
  const { token, logout } = useAuth();
  const [nonce, setNonce] = useState(0);
  const [result, setResult] = useState<FetchResult | null>(null);

  const refetch = useCallback(() => setNonce((value) => value + 1), []);

  const { start, end } = range;
  // A stable key identifying the request currently being awaited.
  const key = `${resolution}:${start ?? ""}:${end ?? ""}:${token ?? ""}:${nonce}`;

  useEffect(() => {
    if (!token) {
      return;
    }

    const controller = new AbortController();

    fetch(buildUrl(resolution, { start, end }), {
      headers: { Authorization: `Bearer ${token}` },
      signal: controller.signal,
    })
      .then(async (response) => {
        if (response.status === 401) {
          logout("Sessão expirada");
          return null;
        }
        if (!response.ok) {
          throw new Error("Não foi possível carregar os dados da telemetria.");
        }
        return (await response.json()) as Report;
      })
      .then((report) => {
        if (report === null) {
          return;
        }
        setResult({ key, report, error: null });
      })
      .catch((cause: unknown) => {
        if (cause instanceof DOMException && cause.name === "AbortError") {
          return;
        }
        const message =
          cause instanceof Error
            ? cause.message
            : "Não foi possível carregar os dados da telemetria.";
        setResult({ key, report: null, error: message });
      });

    return () => controller.abort();
  }, [resolution, start, end, token, logout, key]);

  // A result from a previous request is stale until the new fetch resolves.
  if (!result || result.key !== key) {
    return { status: "loading", report: null, error: null, refetch };
  }

  if (result.error) {
    return { status: "error", report: null, error: result.error, refetch };
  }

  return { status: "success", report: result.report, error: null, refetch };
}
