"use client";

import { useState } from "react";
import { Sparkles } from "lucide-react";
import DailyReportModal from "@/components/dashboard/DailyReportModal";

interface GenerateReportButtonProps {
  scope?: string;
  filterStart?: string;
  filterEnd?: string;
}

function toLocalISODate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export default function GenerateReportButton({
  scope,
  filterStart,
  filterEnd,
}: GenerateReportButtonProps) {
  const [modalOpen, setModalOpen] = useState(false);

  const todayIso = toLocalISODate(new Date());
  const effectiveStart = filterStart ?? todayIso;
  const effectiveEnd = filterEnd ?? todayIso;

  return (
    <>
      <button
        type="button"
        onClick={() => setModalOpen(true)}
        className="inline-flex cursor-pointer items-center gap-1.5 rounded-none border border-zinc-700 bg-surface/60 px-3 py-1 font-mono text-xs text-foreground transition-colors hover:border-accent hover:text-accent select-none"
      >
        <Sparkles size={13} className="text-accent" aria-hidden="true" />
        <span>Gerar Report</span>
      </button>

      {modalOpen && (
        <DailyReportModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          startDate={effectiveStart}
          endDate={effectiveEnd}
          scope={scope}
        />
      )}
    </>
  );
}
