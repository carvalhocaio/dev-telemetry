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
  const [syncError, setSyncError] = useState<string | null>(null);

  async function handleSync(): Promise<void> {
    if (status === "loading") return;
    setStatus("loading");
    setSyncError(null);

    try {
      const startRes = await fetch("/api/sync/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "recent" }),
        credentials: "include",
      });

      let jobId: string;
      let done: boolean;

      if (startRes.status === 409) {
        // A job is already running — resume it instead of failing.
        const currentRes = await fetch("/api/sync/current", { credentials: "include" });
        if (!currentRes.ok) throw new Error("Não foi possível recuperar o sync em andamento.");
        const current = await currentRes.json() as { id: string; status: string } | null;
        if (!current?.id) throw new Error("Sync em andamento não encontrado.");
        jobId = current.id;
        done = current.status !== "running";
      } else if (!startRes.ok) {
        const body = await startRes.json().catch(() => ({})) as { error?: string; message?: string };
        throw new Error(body.error ?? body.message ?? `sync/start returned ${startRes.status}`);
      } else {
        ({ jobId, done } = (await startRes.json()) as { jobId: string; done: boolean });
      }
      let batches = 0;
      const MAX_BATCHES = 500;
      while (!done && batches < MAX_BATCHES) {
        await new Promise((r) => setTimeout(r, 300));
        const batchRes = await fetch(`/api/sync/batch/${jobId}`, {
          method: "POST",
          credentials: "include",
        });
        if (!batchRes.ok) {
          const body = await batchRes.json().catch(() => ({})) as { error?: string; message?: string };
          throw new Error(body.error ?? body.message ?? `sync/batch returned ${batchRes.status}`);
        }
        ({ done } = (await batchRes.json()) as { done: boolean });
        batches++;
      }

      setStatus("success");
      trigger();
      setTimeout(() => setStatus("idle"), 3000);
    } catch (err) {
      console.error("[SyncButton]", err);
      setStatus("error");
      if (err instanceof Error) setSyncError(err.message);
      setTimeout(() => {
        setStatus("idle");
        setSyncError(null);
      }, 5000);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={handleSync}
        disabled={status === "loading"}
        aria-busy={status === "loading"}
        className="inline-flex cursor-pointer items-center gap-2 rounded-none border border-zinc-800 bg-surface/40 px-3 py-1 font-mono text-xs text-foreground transition-colors hover:border-accent hover:text-accent disabled:opacity-60"
      >
        <RefreshCw
          size={13}
          className={status === "loading" ? "animate-spin text-accent" : ""}
          aria-hidden="true"
        />
        <span>Sync</span>
      </button>
      {status === "error" && (
        <span
          aria-live="polite"
          className="font-mono text-xs text-alert truncate max-w-[200px]"
          title={syncError ?? "Falha ao sincronizar."}
        >
          {syncError ?? "Falha ao sincronizar."}
        </span>
      )}
    </div>
  );
}
