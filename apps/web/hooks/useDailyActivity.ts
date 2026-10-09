"use client";

import { useCallback, useEffect, useState } from "react";
import type { DailyActivityReport } from "@dev-telemetry/core";

export type ActivityStatus = "loading" | "error" | "success";

export interface UseDailyActivityParams {
  start?: string;
  end?: string;
  scope?: string;
}

export interface UseDailyActivityState {
  status: ActivityStatus;
  data: DailyActivityReport | null;
  error: string | null;
  refetch: () => void;
}

interface FetchResult {
  key: string;
  data: DailyActivityReport | null;
  error: string | null;
}

function buildDailyUrl(params: UseDailyActivityParams): string {
  const q = new URLSearchParams();
  if (params.start) q.set("start", params.start);
  if (params.end) q.set("end", params.end);
  if (params.scope && params.scope !== "all") q.set("scope", params.scope);
  const qs = q.toString();
  return qs ? `/api/activity/daily?${qs}` : "/api/activity/daily";
}

export function useDailyActivity(params: UseDailyActivityParams = {}): UseDailyActivityState {
  const [nonce, setNonce] = useState(0);
  const [result, setResult] = useState<FetchResult | null>(null);

  const refetch = useCallback(() => setNonce((v) => v + 1), []);

  const { start, end, scope } = params;
  const key = `${start ?? ""}:${end ?? ""}:${scope ?? ""}:${nonce}`;

  useEffect(() => {
    const controller = new AbortController();

    fetch(buildDailyUrl({ start, end, scope }), {
      credentials: "include",
      signal: controller.signal,
    })
      .then(async (res) => {
        if (!res.ok) {
          const errBody = (await res.json().catch(() => ({}))) as { error?: string };
          throw new Error(errBody.error || "Não foi possível carregar a atividade diária.");
        }
        return (await res.json()) as DailyActivityReport;
      })
      .then((data) => setResult({ key, data, error: null }))
      .catch((cause: unknown) => {
        if (cause instanceof DOMException && cause.name === "AbortError") return;
        const message =
          cause instanceof Error ? cause.message : "Não foi possível carregar os dados de atividade.";
        setResult({ key, data: null, error: message });
      });

    return () => controller.abort();
  }, [start, end, scope, key]);

  if (!result || result.key !== key) {
    return { status: "loading", data: null, error: null, refetch };
  }
  if (result.error) {
    return { status: "error", data: null, error: result.error, refetch };
  }
  return { status: "success", data: result.data, error: null, refetch };
}
