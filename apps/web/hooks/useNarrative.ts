"use client";

import { useEffect, useState } from "react";

import type { Granularity, NarrativeResponse } from "@/types/report";

type Status = "idle" | "loading" | "success" | "error";

interface UseNarrativeState {
  status: Status;
  data: NarrativeResponse | null;
  error: string | null;
}

interface FetchResult {
  period: string;
  data: NarrativeResponse | null;
  error: string | null;
}

export function useNarrative(
  granularity: Granularity,
  period: string | null,
): UseNarrativeState {
  const [result, setResult] = useState<FetchResult | null>(null);

  useEffect(() => {
    if (!period) return;

    const controller = new AbortController();

    fetch("/api/narrative", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ granularity, period, level: "atendendo" }),
      credentials: "include",
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) {
          const message =
            response.status === 409
              ? "Configure um provedor LLM em Configurações para ver a narrativa."
              : "Não foi possível carregar a narrativa.";
          throw new Error(message);
        }
        return (await response.json()) as NarrativeResponse;
      })
      .then((data) => setResult({ period, data, error: null }))
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        const message =
          error instanceof Error ? error.message : "Não foi possível carregar a narrativa.";
        setResult({ period, data: null, error: message });
      });

    return () => controller.abort();
  }, [granularity, period]);

  if (!period) return { status: "idle", data: null, error: null };
  if (!result || result.period !== period) return { status: "loading", data: null, error: null };
  if (result.error) return { status: "error", data: null, error: result.error };
  return { status: "success", data: result.data, error: null };
}
