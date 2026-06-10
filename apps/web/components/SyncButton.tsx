"use client";

import { RefreshCw } from "lucide-react";
import { useState } from "react";

import { useReportRefetch } from "@/hooks/useReportRefetch";

type Status = "idle" | "loading" | "success" | "error";

/**
 * Triggers an incremental sync via the Elysia sync API, chains batches
 * until done, then refetches the dashboard report.
 */
export default function SyncButton() {
  const { trigger } = useReportRefetch();
  const [status, setStatus] = useState<Status>("idle");

  async function handleSync(): Promise<void> {
    if (status === "loading") return;
    setStatus("loading");

    try {
      const startRes = await fetch("/api/sync/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "incremental" }),
        credentials: "include",
      });

      if (!startRes.ok) {
        throw new Error(`sync/start returned ${startRes.status}`);
      }

      const { jobId, done: startDone } = (await startRes.json()) as {
        jobId: string;
        done: boolean;
      };

      let done = startDone;
      while (!done) {
        const batchRes = await fetch(`/api/sync/batch/${jobId}`, {
          method: "POST",
          credentials: "include",
        });
        if (!batchRes.ok) break;
        ({ done } = (await batchRes.json()) as { done: boolean });
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
        className={`font-mono text-xs ${status === "error" ? "text-level-abaixo" : "text-muted"}`}
      >
        {message}
      </span>
    </div>
  );
}
