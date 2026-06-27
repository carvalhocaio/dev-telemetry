"use client";

import { useEffect } from "react";

import { useReportRefetch } from "./useReportRefetch";

const SESSION_KEY = "dt:synced";
const MAX_BATCHES = 200;

/**
 * Fires a silent 7-day sync once per browser session (keyed by sessionStorage).
 * Runs in the background — the dashboard renders immediately with cached data
 * and refetches when the sync completes.
 */
export function useAutoSync() {
  const { trigger } = useReportRefetch();

  useEffect(() => {
    if (sessionStorage.getItem(SESSION_KEY)) return;
    sessionStorage.setItem(SESSION_KEY, "1");

    void runWeekSync().then(trigger).catch((err) => {
      console.warn("[useAutoSync] background sync failed:", err);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}

async function runWeekSync(): Promise<void> {
  // Skip if a sync completed very recently (full/recent sync already in progress
  // or just finished) — avoids overwriting the settings progress bar display.
  const cur = await fetch("/api/sync/current", { credentials: "include" });
  if (cur.ok) {
    const current = (await cur.json()) as { status: string; updatedAt: string; mode: string } | null;
    if (current) {
      const updatedMs = Date.now() - new Date(current.updatedAt).getTime();
      const isRecentDone = current.status === "done" && updatedMs < 30 * 60 * 1000;
      const isRunning = current.status === "running";
      if (isRecentDone || isRunning) return;
    }
  }

  const startRes = await fetch("/api/sync/start", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ mode: "week" }),
    credentials: "include",
  });

  let jobId: string;
  let done: boolean;

  if (startRes.status === 409) {
    const curRes = await fetch("/api/sync/current", { credentials: "include" });
    if (!curRes.ok) return;
    const current = (await curRes.json()) as { id: string; status: string } | null;
    if (!current?.id) return;
    jobId = current.id;
    done = current.status !== "running";
  } else if (!startRes.ok) {
    return;
  } else {
    ({ jobId, done } = (await startRes.json()) as { jobId: string; done: boolean });
  }

  let batches = 0;
  while (!done && batches < MAX_BATCHES) {
    const batchRes = await fetch(`/api/sync/batch/${jobId}`, {
      method: "POST",
      credentials: "include",
    });
    if (!batchRes.ok) return;
    ({ done } = (await batchRes.json()) as { done: boolean });
    batches++;
  }
}
