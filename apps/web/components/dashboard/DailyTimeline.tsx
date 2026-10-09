"use client";

import { useEffect, useState } from "react";
import { ChevronDown, ExternalLink, GitCommit, GitPullRequest, Sparkles } from "lucide-react";
import { useDailyActivity } from "@/hooks/useDailyActivity";
import { useReportRefetch } from "@/hooks/useReportRefetch";
import DailyReportModal from "./DailyReportModal";

export interface DailyTimelineProps {
  start?: string;
  end?: string;
  scope?: string;
}

function formatPtBr(iso: string): string {
  if (!iso) return "";
  const parts = iso.split("-");
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return iso;
}

function formatWeekday(iso: string): string {
  if (!iso) return "";
  const parts = iso.split("-").map(Number);
  if (parts.length !== 3) return "";
  const date = new Date(parts[0], parts[1] - 1, parts[2]);
  return date.toLocaleDateString("pt-BR", { weekday: "short" }).replace(".", "");
}

export default function DailyTimeline({ start, end, scope }: DailyTimelineProps) {
  const { status, data, error, refetch } = useDailyActivity({ start, end, scope });
  const { register } = useReportRefetch();

  const [expandedDays, setExpandedDays] = useState<Set<string>>(new Set());
  const [modalDate, setModalDate] = useState<string | null>(null);

  useEffect(() => {
    register(refetch);
  }, [register, refetch]);

  function toggleExpand(date: string) {
    setExpandedDays((prev) => {
      const next = new Set(prev);
      if (next.has(date)) {
        next.delete(date);
      } else {
        next.add(date);
      }
      return next;
    });
  }

  function handleOpenDaily(date: string) {
    setModalDate(date);
  }

  if (status === "loading") {
    return (
      <section
        aria-busy="true"
        className="rounded-none border border-zinc-800 bg-surface/30 p-8 space-y-4"
      >
        <div className="flex items-center gap-3">
          <div className="h-4 w-4 rounded-none bg-accent animate-pulse" />
          <p className="font-mono text-xs uppercase tracking-wider text-muted">
            Carregando timeline de atividades…
          </p>
        </div>
        <div className="space-y-3">
          <div className="h-16 w-full rounded-none border border-zinc-800 bg-zinc-800/40 animate-pulse" />
          <div className="h-16 w-full rounded-none border border-zinc-800 bg-zinc-800/40 animate-pulse" />
          <div className="h-16 w-full rounded-none border border-zinc-800 bg-zinc-800/40 animate-pulse" />
        </div>
      </section>
    );
  }

  if (status === "error" || error) {
    return (
      <section className="rounded-none border border-alert/40 bg-surface/30 p-6 space-y-2">
        <p className="font-mono text-xs uppercase tracking-wider text-alert">
          Erro ao carregar telemetria
        </p>
        <p className="font-mono text-sm text-foreground/90">
          {error ?? "Não foi possível carregar os dados de atividade."}
        </p>
      </section>
    );
  }

  const days = data?.days ?? [];

  if (days.length === 0) {
    return (
      <section className="rounded-none border border-dashed border-zinc-800 bg-surface/20 p-12 text-center">
        <div className="mx-auto max-w-lg space-y-3">
          <h3 className="font-melodrama text-lg font-bold text-foreground">
            Nenhuma atividade registrada
          </h3>
          <p className="font-mono text-xs leading-relaxed text-muted">
            Nenhuma atividade registrada neste período. Use o botão Sincronizar para importar commits e PRs do GitHub.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-4" aria-label="Linha do tempo diária">
      {/* High-density totals banner */}
      {data?.totals && (
        <div className="flex flex-wrap items-center justify-between gap-3 border border-zinc-800 bg-surface/40 px-4 py-3 font-mono text-xs text-muted">
          <div>
            <span className="text-foreground font-semibold">{data.totals.daysCount}</span>{" "}
            {data.totals.daysCount === 1 ? "dia com atividade" : "dias com atividade"}
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <span>
              <strong className="text-foreground">{data.totals.commitsCount}</strong> commits
            </span>
            <span>
              <strong className="text-foreground">{data.totals.prsCreated + data.totals.prsMerged}</strong> PRs
              <span className="ml-1 text-[11px] text-muted/70">
                ({data.totals.prsCreated} criados, {data.totals.prsMerged} mergeados)
              </span>
            </span>
            <span>
              <strong className="text-foreground">{data.totals.churn.toLocaleString()}</strong> churn
            </span>
            <span>
              <strong className="text-foreground">{data.totals.repositories.length}</strong> repos
            </span>
          </div>
        </div>
      )}

      {/* Days list */}
      <div className="space-y-2.5">
        {days.map((day) => {
          const isExpanded = expandedDays.has(day.date);
          const additions = day.commits.reduce((sum, c) => sum + c.additions, 0);
          const deletions = day.commits.reduce((sum, c) => sum + c.deletions, 0);
          const totalPrs = day.prs.length;

          return (
            <div
              key={day.date}
              className="rounded-none border border-zinc-800 bg-surface/30 transition-colors hover:border-zinc-700"
            >
              {/* Row header / summary */}
              <div
                onClick={() => toggleExpand(day.date)}
                className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 p-4 cursor-pointer select-none"
              >
                {/* Left: Date + Weekday */}
                <div className="flex items-center gap-3 shrink-0">
                  <div className="flex flex-col">
                    <span className="font-mono text-sm font-bold tracking-wide text-foreground">
                      {formatPtBr(day.date)}
                    </span>
                    <span className="font-mono text-[10px] uppercase text-muted">
                      {formatWeekday(day.date)}
                    </span>
                  </div>
                </div>

                {/* Center: Activity Badges & Repositories */}
                <div className="flex flex-wrap items-center gap-2 flex-1 lg:px-4">
                  {/* Commits Badge */}
                  <span className="inline-flex items-center gap-1.5 rounded-none border border-zinc-700 bg-zinc-800/40 px-2 py-0.5 font-mono text-xs text-foreground/90">
                    <GitCommit size={11} className="text-muted-foreground" />
                    <span>
                      {day.commitsCount} {day.commitsCount === 1 ? "commit" : "commits"}
                    </span>
                  </span>

                  {/* PRs Badge */}
                  <span className="inline-flex items-center gap-1.5 rounded-none border border-zinc-700 bg-zinc-800/40 px-2 py-0.5 font-mono text-xs text-foreground/90">
                    <GitPullRequest size={11} className="text-muted-foreground" />
                    <span>{totalPrs} PRs</span>
                    <span className="text-muted text-[11px]">
                      ({day.prsCreated} {day.prsCreated === 1 ? "criado" : "criados"}, {day.prsMerged}{" "}
                      {day.prsMerged === 1 ? "mergeado" : "mergeados"})
                    </span>
                  </span>

                  {/* Churn Badge */}
                  <span className="inline-flex items-center gap-1 rounded-none border border-zinc-700 bg-zinc-800/40 px-2 py-0.5 font-mono text-xs text-foreground/90">
                    <span>{day.churn.toLocaleString()} churn</span>
                    <span className="text-[11px] font-medium ml-1">
                      <span className="text-emerald-500">+{additions}</span>
                      <span className="text-muted mx-0.5">/</span>
                      <span className="text-rose-500">-{deletions}</span>
                    </span>
                  </span>

                  {/* Repository Badges */}
                  <div className="flex flex-wrap items-center gap-1 ml-1">
                    {day.repositories.map((repo) => (
                      <span
                        key={repo}
                        className="rounded-none border border-zinc-800 bg-surface/80 px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground"
                      >
                        {repo}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-2 shrink-0 self-end lg:self-auto">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenDaily(day.date);
                    }}
                    title="Gerar Daily para este dia"
                    className="inline-flex cursor-pointer items-center gap-1.5 rounded-none border border-zinc-700 bg-surface px-2.5 py-1 font-mono text-xs text-accent transition-colors hover:border-accent hover:bg-accent/10"
                  >
                    <Sparkles size={12} className="text-accent" />
                    <span>Gerar Daily</span>
                  </button>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleExpand(day.date);
                    }}
                    aria-expanded={isExpanded}
                    className="inline-flex cursor-pointer items-center gap-1 rounded-none border border-zinc-800/80 bg-surface/40 px-2 py-1 font-mono text-xs text-muted transition-colors hover:text-foreground"
                  >
                    <span>{isExpanded ? "Ocultar" : "Ver detalhes"}</span>
                    <ChevronDown
                      size={13}
                      className={`transition-transform duration-150 ${isExpanded ? "rotate-180" : ""}`}
                    />
                  </button>
                </div>
              </div>

              {/* Expandable details area */}
              {isExpanded && (
                <div className="border-t border-zinc-800/80 bg-surface/20 p-5 space-y-5">
                  {/* Commits details */}
                  <div className="space-y-2">
                    <h4 className="flex items-center gap-2 font-mono text-xs font-semibold uppercase tracking-wider text-muted">
                      <GitCommit size={13} />
                      <span>Commits ({day.commits.length})</span>
                    </h4>

                    {day.commits.length === 0 ? (
                      <p className="font-mono text-xs text-muted/70 italic">
                        Nenhum commit registrado neste dia.
                      </p>
                    ) : (
                      <ul className="divide-y divide-zinc-800/40 rounded-none border border-zinc-800/80 bg-background/50 font-mono text-xs">
                        {day.commits.map((c) => (
                          <li
                            key={c.sha}
                            className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 hover:bg-surface/30 transition-colors"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <a
                                href={c.htmlUrl || `https://github.com/search?q=${c.sha}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 shrink-0 font-mono text-xs text-accent hover:underline"
                                title="Abrir commit no GitHub"
                              >
                                <span>{c.sha.slice(0, 7)}</span>
                                <ExternalLink size={10} />
                              </a>
                              <span className="truncate text-foreground/90 font-sans text-xs">
                                {c.message.split("\n")[0]}
                              </span>
                              <span className="shrink-0 rounded-none border border-zinc-800 bg-surface/60 px-1.5 py-0.2 font-mono text-[10px] text-muted-foreground">
                                {c.repoName}
                              </span>
                            </div>

                            <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto font-mono text-xs">
                              <span className="text-emerald-500">+{c.additions}</span>
                              <span className="text-muted">/</span>
                              <span className="text-rose-500">-{c.deletions}</span>
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  {/* PRs details */}
                  <div className="space-y-2">
                    <h4 className="flex items-center gap-2 font-mono text-xs font-semibold uppercase tracking-wider text-muted">
                      <GitPullRequest size={13} />
                      <span>Pull Requests ({day.prs.length})</span>
                    </h4>

                    {day.prs.length === 0 ? (
                      <p className="font-mono text-xs text-muted/70 italic">
                        Nenhum pull request registrado neste dia.
                      </p>
                    ) : (
                      <ul className="divide-y divide-zinc-800/40 rounded-none border border-zinc-800/80 bg-background/50 font-mono text-xs">
                        {day.prs.map((p) => {
                          const isMerged = Boolean(p.ghMergedAt);
                          const isClosed = !isMerged && p.state === "closed";
                          const statusLabel = isMerged ? "merged" : isClosed ? "closed" : "open";
                          const statusClasses = isMerged
                            ? "border-purple-800/60 bg-purple-950/40 text-purple-300"
                            : isClosed
                              ? "border-rose-800/60 bg-rose-950/40 text-rose-300"
                              : "border-emerald-800/60 bg-emerald-950/40 text-emerald-300";

                          return (
                            <li
                              key={`${p.repoName}#${p.number}`}
                              className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 hover:bg-surface/30 transition-colors"
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <span className="shrink-0 text-muted font-mono text-xs">
                                  #{p.number}
                                </span>
                                <a
                                  href={p.htmlUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="truncate font-sans text-xs text-foreground hover:text-accent hover:underline font-medium"
                                >
                                  {p.title}
                                </a>
                                <span className="shrink-0 rounded-none border border-zinc-800 bg-surface/60 px-1.5 py-0.2 font-mono text-[10px] text-muted-foreground">
                                  {p.repoName}
                                </span>
                              </div>

                              <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                                <span
                                  className={`rounded-none border px-1.5 py-0.5 font-mono text-[10px] uppercase ${statusClasses}`}
                                >
                                  {statusLabel}
                                </span>
                                <a
                                  href={p.htmlUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  aria-label="Ver no GitHub"
                                  className="text-muted hover:text-foreground p-0.5"
                                >
                                  <ExternalLink size={12} />
                                </a>
                              </div>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Inline Daily Report Modal for row click */}
      {modalDate && (
        <DailyReportModal
          isOpen={Boolean(modalDate)}
          onClose={() => setModalDate(null)}
          startDate={modalDate}
          endDate={modalDate}
          availableRepos={data?.days.find((d) => d.date === modalDate)?.repositories ?? []}
          scope={scope}
        />
      )}
    </section>
  );
}
