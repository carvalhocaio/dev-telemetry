"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AlertCircle, Check, Clipboard, Loader2, RefreshCw, Sparkles, X } from "lucide-react";
import type { ExecutiveReport } from "@dev-telemetry/ai";

export interface DailyReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  startDate: string;
  endDate: string;
  availableRepos?: string[];
  scope?: string;
}

function formatDatePtBr(iso: string): string {
  if (!iso) return "";
  const parts = iso.split("-");
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return iso;
}

export default function DailyReportModal({
  isOpen,
  onClose,
  startDate,
  endDate,
  availableRepos,
  scope,
}: DailyReportModalProps) {
  const [report, setReport] = useState<ExecutiveReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState(false);

  const [reposList, setReposList] = useState<string[]>(availableRepos ?? []);
  const [selectedRepos, setSelectedRepos] = useState<string[]>(availableRepos ?? []);
  const [lastGeneratedRepos, setLastGeneratedRepos] = useState<string[] | null>(null);

  const selectedReposRef = useRef(selectedRepos);
  selectedReposRef.current = selectedRepos;

  // Sync availableRepos prop when it changes
  useEffect(() => {
    if (availableRepos && availableRepos.length > 0) {
      setReposList(availableRepos);
      setSelectedRepos(availableRepos);
    }
  }, [availableRepos]);

  // Discover repos if not provided
  useEffect(() => {
    if (!isOpen || (availableRepos && availableRepos.length > 0) || !startDate || !endDate) return;

    fetch(`/api/activity/daily?start=${startDate}&end=${endDate}`, { credentials: "include" })
      .then((r) => (r.ok ? r.json() : null))
      .then((data: { totals?: { repositories?: string[] } } | null) => {
        if (data?.totals?.repositories && data.totals.repositories.length > 0) {
          setReposList(data.totals.repositories);
          setSelectedRepos(data.totals.repositories);
        }
      })
      .catch(() => null);
  }, [isOpen, availableRepos, startDate, endDate]);

  const fetchReport = useCallback(
    async (signal?: AbortSignal, reposOverride?: string[]) => {
      if (!startDate || !endDate) return;
      const activeRepos = reposOverride ?? selectedReposRef.current;
      if (reposList.length > 0 && activeRepos.length === 0) {
        setError("Nenhum projeto selecionado. Marque ao menos um projeto acima para incluir no relatório.");
        return;
      }

      setLoading(true);
      setError(null);
      setReport(null);

      try {
        const res = await fetch("/api/reports/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            startDate,
            endDate,
            scope: scope ?? "all",
            repos: activeRepos.length > 0 ? activeRepos : undefined,
          }),
          credentials: "include",
          signal,
        });

        if (!res.ok) {
          let errorMsg = "Falha ao gerar o report de atividades. Tente novamente mais tarde.";
          try {
            const body = (await res.json()) as { error?: string };
            if (body?.error) errorMsg = body.error;
          } catch {
            const text = await res.text().catch(() => "");
            if (text) errorMsg = text;
          }
          throw new Error(errorMsg);
        }

        const data = (await res.json()) as ExecutiveReport;
        setReport(data);
        setLastGeneratedRepos([...activeRepos]);
      } catch (err: unknown) {
        if (err instanceof Error && err.name === "AbortError") return;
        console.error("[DailyReportModal] error:", err);
        setError(err instanceof Error ? err.message : String(err));
      } finally {
        setLoading(false);
      }
    },
    [startDate, endDate, scope],
  );

  useEffect(() => {
    if (isOpen) {
      const controller = new AbortController();
      void fetchReport(controller.signal);
      return () => controller.abort();
    } else {
      setReport(null);
      setError(null);
      setCopied(false);
      setCopyError(false);
      setLastGeneratedRepos(null);
    }
  }, [isOpen, fetchReport]);

  useEffect(() => {
    if (!isOpen) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onClose();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  async function handleCopy() {
    if (!report?.markdownText) return;
    try {
      await navigator.clipboard.writeText(report.markdownText);
      setCopied(true);
      setCopyError(false);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("[DailyReportModal] copy failed:", err);
      setCopyError(true);
      setTimeout(() => setCopyError(false), 3000);
    }
  }

  function handleToggleRepo(repo: string) {
    setSelectedRepos((prev) =>
      prev.includes(repo) ? prev.filter((r) => r !== repo) : [...prev, repo],
    );
  }

  function handleSelectAllRepos() {
    setSelectedRepos(reposList);
  }

  function handleSelectNoneRepos() {
    setSelectedRepos([]);
  }

  const isRepoSelectionEmpty = reposList.length > 0 && selectedRepos.length === 0;

  const isDirty =
    report !== null &&
    lastGeneratedRepos !== null &&
    (selectedRepos.length !== lastGeneratedRepos.length ||
      selectedRepos.some((r) => !lastGeneratedRepos.includes(r)));

  const isSingleDay = startDate === endDate;
  const headingDateText = isSingleDay
    ? formatDatePtBr(startDate)
    : `${formatDatePtBr(startDate)} a ${formatDatePtBr(endDate)}`;
  const title = `Report de Atividades — ${headingDateText}`;

  const isConfigError =
    Boolean(error) &&
    (error?.toLowerCase().includes("llm") ||
      error?.toLowerCase().includes("chave") ||
      error?.toLowerCase().includes("configurações") ||
      error?.toLowerCase().includes("api"));

  return (
    <>
      <div
        className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="report-modal-title"
        className="fixed inset-0 z-[51] flex items-center justify-center p-3 sm:p-6"
        onClick={onClose}
      >
        <div
          onClick={(e) => e.stopPropagation()}
          className="relative flex flex-col w-full max-w-3xl max-h-[90vh] rounded-none border border-zinc-800 bg-background shadow-2xl overflow-hidden shadow-[0_0_24px_rgba(245,158,11,0.08)]"
        >
          {/* Subtle accent border on top */}
          <div className="h-0.5 w-full bg-gradient-to-r from-amber-500/70 via-accent/80 to-amber-500/40" />

          {/* Modal Header */}
          <header className="flex items-center justify-between border-b border-zinc-800/80 px-6 py-4">
            <h2
              id="report-modal-title"
              className="font-melodrama text-lg sm:text-xl font-bold tracking-tight text-foreground truncate mr-4"
            >
              {title}
            </h2>
            <button
              type="button"
              onClick={onClose}
              aria-label="Fechar"
              className="rounded-none p-1 text-muted transition-colors hover:text-foreground hover:bg-surface/60"
            >
              <X size={18} aria-hidden="true" />
            </button>
          </header>

          {/* Projects filter toolbar */}
          {reposList.length > 1 && (
            <div className="flex flex-wrap items-center gap-2 border-b border-zinc-800 bg-surface/30 px-6 py-2.5">
              <span className="font-mono text-xs text-muted shrink-0">Projetos:</span>
              <div className="flex flex-wrap items-center gap-1.5 flex-1">
                {reposList.map((repo) => {
                  const isSelected = selectedRepos.includes(repo);
                  return (
                    <button
                      key={repo}
                      type="button"
                      onClick={() => handleToggleRepo(repo)}
                      className={`cursor-pointer inline-flex items-center gap-1 rounded-none px-2 py-0.5 font-mono text-xs border transition-colors ${
                        isSelected
                          ? "border-accent bg-accent/15 text-accent font-medium"
                          : "border-zinc-800 bg-surface/60 text-muted/70 hover:border-zinc-700 hover:text-foreground"
                      }`}
                    >
                      {isSelected && <Check size={10} />}
                      <span>{repo}</span>
                    </button>
                  );
                })}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={handleSelectAllRepos}
                  className="font-mono text-[10px] text-muted hover:text-foreground underline cursor-pointer"
                >
                  todos
                </button>
                <span className="text-muted/40">·</span>
                <button
                  type="button"
                  onClick={handleSelectNoneRepos}
                  className="font-mono text-[10px] text-muted hover:text-foreground underline cursor-pointer"
                >
                  limpar
                </button>
              </div>
            </div>
          )}

          {reposList.length > 1 && isRepoSelectionEmpty && (
            <div className="flex items-center gap-2 border-b border-amber-500/30 bg-amber-500/10 px-6 py-2 font-mono text-xs text-amber-400">
              <AlertCircle size={13} className="shrink-0" />
              <span>Nenhum projeto selecionado. Clique em ao menos um projeto acima para incluir no relatório.</span>
            </div>
          )}

          {reposList.length > 1 && isDirty && !isRepoSelectionEmpty && (
            <div className="flex items-center justify-between gap-3 border-b border-accent/30 bg-accent/10 px-6 py-2 font-mono text-xs text-accent">
              <span className="truncate">
                {selectedRepos.length} projeto{selectedRepos.length === 1 ? "" : "s"} selecionado{selectedRepos.length === 1 ? "" : "s"} (seleção alterada).
              </span>
              <button
                type="button"
                onClick={() => void fetchReport(undefined, selectedRepos)}
                disabled={loading}
                className="inline-flex cursor-pointer items-center gap-1.5 rounded-none border border-accent bg-accent/20 px-2.5 py-0.5 font-mono text-xs text-accent font-medium hover:bg-accent/30 transition-colors disabled:opacity-50 shrink-0"
              >
                {loading ? <Loader2 size={11} className="animate-spin" /> : <Sparkles size={11} />}
                <span>{loading ? "Compilando…" : "Atualizar agora →"}</span>
              </button>
            </div>
          )}

          {/* Modal Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Loading skeleton / spinner */}
            {loading && (
              <div className="space-y-6 py-4" aria-busy="true" aria-live="polite">
                <div className="flex items-center gap-3 text-muted">
                  <Loader2 size={18} className="animate-spin text-accent" />
                  <p className="font-mono text-xs">
                    Gerando report executivo com IA… Analisando commits e pull requests.
                  </p>
                </div>

                <div className="space-y-3 animate-pulse">
                  <div className="h-4 w-32 bg-zinc-800/80 rounded-none" />
                  <div className="h-20 w-full bg-zinc-800/40 rounded-none border border-zinc-800" />
                </div>

                <div className="space-y-3 animate-pulse">
                  <div className="h-4 w-44 bg-zinc-800/80 rounded-none" />
                  <div className="h-32 w-full bg-zinc-800/40 rounded-none border border-zinc-800" />
                  <div className="h-28 w-full bg-zinc-800/40 rounded-none border border-zinc-800" />
                </div>
              </div>
            )}

            {/* Error display */}
            {!loading && error && (
              <div className="rounded-none border border-alert/40 bg-alert/10 p-5 space-y-3">
                <p className="font-mono text-xs text-alert leading-relaxed">{error}</p>
                {isConfigError && (
                  <div>
                    <Link
                      href="/settings"
                      onClick={onClose}
                      className="inline-flex items-center gap-1 font-mono text-xs text-accent underline underline-offset-4 hover:text-accent-dim"
                    >
                      Acessar Configurações para configurar provedor LLM →
                    </Link>
                  </div>
                )}
              </div>
            )}

            {/* Report display */}
            {!loading && report && (
              <div className="space-y-6">
                {/* Executive Summary */}
                <section className="space-y-2">
                  <h3 className="font-mono text-xs uppercase tracking-wider text-muted">
                    Resumo Executivo
                  </h3>
                  <div className="rounded-none border border-zinc-800 bg-surface/40 p-4">
                    <p className="text-sm font-sans text-foreground leading-relaxed">
                      {report.summary}
                    </p>
                  </div>
                </section>

                {/* Projects Highlights */}
                {report.projects.length > 0 && (
                  <section className="space-y-3">
                    <h3 className="font-mono text-xs uppercase tracking-wider text-muted">
                      Projetos & Destaques ({report.projects.length})
                    </h3>
                    <div className="space-y-3">
                      {report.projects.map((proj, idx) => (
                        <div
                          key={idx}
                          className="rounded-none border border-zinc-800 bg-surface/30 p-4 space-y-3"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-800/60 pb-2">
                            <span className="font-medium text-sm text-foreground">
                              {proj.name}
                            </span>
                            <span className="rounded-none border border-zinc-700 bg-zinc-800/60 px-2 py-0.5 font-mono text-xs text-muted-foreground">
                              {proj.repo}
                            </span>
                          </div>
                          <ul className="space-y-1.5 list-disc list-inside text-xs sm:text-sm text-muted">
                            {proj.highlights.map((highlight, hIdx) => (
                              <li key={hIdx} className="leading-relaxed">
                                <span className="text-foreground/90">{highlight}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {/* Full Markdown Preview */}
                <section className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="font-mono text-xs uppercase tracking-wider text-muted">
                      Preview em Markdown
                    </h3>
                    <span className="font-mono text-[10px] text-muted/60">
                      Pronto para envio (Slack / Gestor)
                    </span>
                  </div>
                  <div className="rounded-none border border-zinc-800 bg-surface/50 p-4 font-mono text-xs text-foreground/90 whitespace-pre-wrap leading-relaxed select-all">
                    {report.markdownText}
                  </div>
                </section>
              </div>
            )}
            {/* Empty state: ready to generate */}
            {!loading && !report && !error && (
              <div className="flex flex-col items-center justify-center py-10 px-4 text-center space-y-3">
                <div className="p-3 border border-zinc-800 bg-surface/40 text-accent">
                  <Sparkles size={22} />
                </div>
                <h3 className="font-melodrama text-lg font-bold text-foreground">
                  Pronto para compilar o relatório
                </h3>
                <p className="font-mono text-xs text-muted max-w-sm leading-relaxed">
                  {selectedRepos.length === 0
                    ? "Selecione ao menos um projeto acima para incluir no relatório."
                    : "Revise os projetos selecionados acima e clique no botão abaixo para gerar o relatório executivo com IA."}
                </p>
                <button
                  type="button"
                  onClick={() => void fetchReport()}
                  disabled={loading || isRepoSelectionEmpty}
                  className="mt-2 inline-flex cursor-pointer items-center gap-1.5 border border-accent bg-accent/20 px-4 py-2 font-mono text-xs text-accent hover:bg-accent/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Sparkles size={13} />
                  Gerar Report
                </button>
              </div>
            )}
          </div>

          {/* Modal Footer */}
          <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-zinc-800 bg-surface/30 px-6 py-4">
            <div>
              <button
                type="button"
                onClick={() => void fetchReport()}
                disabled={loading || isRepoSelectionEmpty}
                className={`inline-flex cursor-pointer items-center gap-1.5 rounded-none border px-3 py-1.5 font-mono text-xs transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                  report && !isDirty
                    ? "border-zinc-800 bg-surface text-foreground hover:border-accent hover:text-accent"
                    : "border-accent bg-accent/20 text-accent font-medium hover:bg-accent/30"
                }`}
              >
                {loading ? (
                  <RefreshCw size={13} className="animate-spin" />
                ) : report && !isDirty ? (
                  <RefreshCw size={13} />
                ) : (
                  <Sparkles size={13} />
                )}
                {isRepoSelectionEmpty
                  ? "Selecione um projeto"
                  : report && isDirty
                    ? "Atualizar Report"
                    : report
                      ? "Regenerar"
                      : "Gerar Report"}
              </button>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleCopy}
                disabled={!report || loading}
                className="inline-flex cursor-pointer items-center gap-1.5 rounded-none border border-accent bg-accent/15 px-3 py-1.5 font-mono text-xs text-accent transition-colors hover:bg-accent/25 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {copied ? <Check size={13} /> : <Clipboard size={13} />}
                {copyError ? "Falha ao copiar" : copied ? "Copiado!" : "Copiar Report"}
              </button>

              <button
                type="button"
                onClick={onClose}
                className="cursor-pointer rounded-none border border-zinc-800 bg-surface px-3 py-1.5 font-mono text-xs text-muted transition-colors hover:text-foreground"
              >
                Fechar
              </button>
            </div>
          </footer>
        </div>
      </div>
    </>
  );
}
