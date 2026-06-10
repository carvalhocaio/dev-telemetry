"use client";

import { RefreshCw } from "lucide-react";
import { useState } from "react";

import { useAuth } from "@/hooks/useAuth";
import { useReportRefetch } from "@/hooks/useReportRefetch";

type Status = "idle" | "loading" | "success" | "error";

/**
 * Triggers an incremental sync via the server-side proxy (`POST /api/refresh`),
 * forwarding the API password as a Bearer token, then refetches the client-side
 * report. A 401 locks the session. Exposes loading / success / error states.
 */
export default function SyncButton() {
  const { token, logout } = useAuth();
  const { trigger } = useReportRefetch();
  const [status, setStatus] = useState<Status>("idle");

  async function handleSync(): Promise<void> {
    if (!token) {
      return;
    }
    setStatus("loading");
    try {
      const response = await fetch("/api/refresh", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.status === 401) {
        logout("Sessão expirada");
        return;
      }
      if (!response.ok) {
        throw new Error("refresh failed");
      }
      setStatus("success");
      trigger();
    } catch {
      setStatus("error");
    }
  }

  const message =
    status === "loading"
      ? "Sincronizando…"
      : status === "success"
        ? "Atualizado."
        : status === "error"
          ? "Falha ao sincronizar."
          : "";

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={handleSync}
        disabled={status === "loading"}
        aria-busy={status === "loading"}
        className="inline-flex items-center gap-2 rounded-md border border-surface bg-surface/40 px-3 py-1 font-mono text-xs text-foreground transition-colors hover:border-accent disabled:opacity-60"
      >
        <RefreshCw
          size={14}
          className={status === "loading" ? "animate-spin" : ""}
          aria-hidden="true"
        />
        Sync
      </button>
      <span
        aria-live="polite"
        className={`font-mono text-xs ${
          status === "error" ? "text-level-abaixo" : "text-muted"
        }`}
      >
        {message}
      </span>
    </div>
  );
}
