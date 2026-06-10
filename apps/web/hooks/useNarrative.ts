"use client";

import { useEffect, useState } from "react";

import { useAuth } from "@/hooks/useAuth";
import type { Granularity, NarrativeResponse } from "@/types/report";

type Status = "idle" | "loading" | "success" | "error";

interface UseNarrativeState {
  status: Status;
  data: NarrativeResponse | null;
  error: string | null;
}

/** Outcome of a single fetch, keyed by the period it belongs to. */
interface FetchResult {
  period: string;
  data: NarrativeResponse | null;
  error: string | null;
}

/**
 * Encapsulates fetching a period's narrative from the server-side proxy
 * (`/api/narrative/...`), keeping fetch logic out of the JSX. Returns explicit
 * idle / loading / success / error states.
 */
export function useNarrative(
  granularity: Granularity,
  period: string | null,
): UseNarrativeState {
  const { token, logout } = useAuth();
  const [result, setResult] = useState<FetchResult | null>(null);

  useEffect(() => {
    if (!period || !token) {
      return;
    }

    const controller = new AbortController();

    fetch(`/api/narrative/${granularity}/${period}`, {
      headers: { Authorization: `Bearer ${token}` },
      signal: controller.signal,
    })
      .then(async (response) => {
        if (response.status === 401) {
          logout("Sessão expirada");
          throw new Error("Sessão expirada.");
        }
        if (!response.ok) {
          const message =
            response.status === 404
              ? "Sem narrativa para este período."
              : "Não foi possível carregar a narrativa.";
          throw new Error(message);
        }
        return (await response.json()) as NarrativeResponse;
      })
      .then((data) => setResult({ period, data, error: null }))
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }
        const message =
          error instanceof Error
            ? error.message
            : "Não foi possível carregar a narrativa.";
        setResult({ period, data: null, error: message });
      });

    return () => controller.abort();
  }, [granularity, period, token, logout]);

  if (!period) {
    return { status: "idle", data: null, error: null };
  }

  // A result from a previous period is stale until the new fetch resolves.
  if (!result || result.period !== period) {
    return { status: "loading", data: null, error: null };
  }

  if (result.error) {
    return { status: "error", data: null, error: result.error };
  }

  return { status: "success", data: result.data, error: null };
}
