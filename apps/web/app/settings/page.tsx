"use client";

import { ArrowLeft, Check, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { signOut, useSession } from "@/lib/auth-client";

const QUOTA_BYTES = 3 * 1024 * 1024 * 1024;
const LLM_PROVIDERS = ["gemini", "openai", "anthropic"] as const;
type LlmProvider = (typeof LLM_PROVIDERS)[number];

const DEFAULT_MODELS: Record<LlmProvider, string> = {
  gemini: "gemini-2.0-flash",
  openai: "gpt-4o-mini",
  anthropic: "claude-haiku-4-5-20251001",
};

const PROFILE_METADATA = [
  { key: "data_engineer_jr", group: "Eng. de Dados", label: "Júnior" },
  { key: "data_engineer_pleno", group: "Eng. de Dados", label: "Pleno" },
  { key: "data_engineer_sr", group: "Eng. de Dados", label: "Sênior" },
  { key: "software_engineer_estagio", group: "Eng. de Software", label: "Estágio" },
  { key: "software_engineer_jr", group: "Eng. de Software", label: "Júnior" },
  { key: "software_engineer_pleno", group: "Eng. de Software", label: "Pleno" },
  { key: "software_engineer_sr", group: "Eng. de Software", label: "Sênior" },
  { key: "student_dados", group: "Estudante", label: "Foco em Dados" },
  { key: "student_software", group: "Estudante", label: "Foco em Software" },
] as const;

const BUILT_IN_KEYS: readonly string[] = PROFILE_METADATA.map((p) => p.key);
const PROFILE_GROUPS = ["Eng. de Dados", "Eng. de Software", "Estudante"] as const;
const MAX_PROFILE_LENGTH = 32768;

interface ProfileResponse {
  profileKey: string;
  label: string;
  group: string;
  contentPreview: string;
  customContent: string | null;
}

interface SecretsStatus {
  hasPat: boolean;
  hasLlmKey: boolean;
  llmProvider: string | null;
  llmModel: string | null;
  bytesUsed: number;
  profileKey: string | null;
  profileLabel: string | null;
}

interface SyncJob {
  id: string;
  mode: string;
  status: string;
  phase: string | null;
  reposTotal: number;
  reposDone: number;
  commits: number;
  prs: number;
  error: string | null;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

function terminalBar(value: number, total: number, width = 20): string {
  const filled = total > 0 ? Math.round(Math.min(value / total, 1) * width) : 0;
  return "█".repeat(filled) + "░".repeat(width - filled);
}

export default function SettingsPage() {
  const { data: session, isPending: sessionPending } = useSession();
  const router = useRouter();

  const [config, setConfig] = useState<SecretsStatus | null>(null);
  const [syncJob, setSyncJob] = useState<SyncJob | null>(null);

  // PAT form
  const [pat, setPat] = useState("");
  const [patSaving, setPatSaving] = useState(false);
  const [patSaved, setPatSaved] = useState(false);
  const [patError, setPatError] = useState<string | null>(null);

  // LLM form
  const [provider, setProvider] = useState<LlmProvider>("gemini");
  const [model, setModel] = useState(DEFAULT_MODELS.gemini);
  const [apiKey, setApiKey] = useState("");
  const [llmSaving, setLlmSaving] = useState(false);
  const [llmSaved, setLlmSaved] = useState(false);
  const [llmError, setLlmError] = useState<string | null>(null);

  // Profile form
  const [selectedKey, setSelectedKey] = useState<string>("data_engineer_pleno");
  const [customProfileContent, setCustomProfileContent] = useState("");
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);

  // Sync state
  const [syncing, setSyncing] = useState(false);
  const [syncJobId, setSyncJobId] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!sessionPending && !session) {
      router.replace("/login");
    }
  }, [sessionPending, session, router]);

  useEffect(() => {
    if (!session) return;

    // Fetch secrets/status and profile independently so a failure in one
    // does not suppress the other.
    Promise.allSettled([
      fetch("/api/me/secrets/status", { credentials: "include" }).then(
        (r) => r.json() as Promise<SecretsStatus>,
      ),
      fetch("/api/me/profile", { credentials: "include" }).then(
        (r) => r.json() as Promise<ProfileResponse>,
      ),
    ]).then(([statusResult, profileResult]) => {
      if (statusResult.status === "fulfilled") {
        const data = statusResult.value;
        setConfig((prev) => ({
          ...(prev ?? { hasPat: false, hasLlmKey: false, llmProvider: null, llmModel: null, bytesUsed: 0, profileKey: null, profileLabel: null }),
          ...data,
        }));
        if (data.llmProvider && LLM_PROVIDERS.includes(data.llmProvider as LlmProvider)) {
          const p = data.llmProvider as LlmProvider;
          setProvider(p);
          setModel(data.llmModel ?? DEFAULT_MODELS[p]);
        }
      }
      if (profileResult.status === "fulfilled") {
        const profile = profileResult.value;
        setConfig((prev) => prev ? { ...prev, profileKey: profile.profileKey, profileLabel: profile.label } : prev);
        if (BUILT_IN_KEYS.includes(profile.profileKey)) {
          setSelectedKey(profile.profileKey);
        } else {
          setSelectedKey("custom");
          // Use full customContent so the textarea is pre-filled correctly.
          setCustomProfileContent(profile.customContent ?? "");
        }
      }
    });

    fetch("/api/sync/current", { credentials: "include" })
      .then((r) => (r.ok ? (r.json() as Promise<SyncJob | null>) : null))
      .then((job) => { if (job) setSyncJob(job); })
      .catch(() => null);
  }, [session]);

  // Auto-fill model default when provider changes
  useEffect(() => {
    setModel(DEFAULT_MODELS[provider]);
  }, [provider]);

  // Poll sync progress while running
  useEffect(() => {
    if (!syncing || !syncJobId) return;

    async function runBatch() {
      const res = await fetch(`/api/sync/batch/${syncJobId}`, {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) { setSyncing(false); return; }
      const { done } = (await res.json()) as { done: boolean };

      const jobRes = await fetch("/api/sync/current", { credentials: "include" });
      if (jobRes.ok) {
        const job = (await jobRes.json()) as SyncJob | null;
        if (job) setSyncJob(job);
      }

      if (done) {
        setSyncing(false);
        setSyncJobId(null);
      } else {
        pollRef.current = setTimeout(runBatch, 1200);
      }
    }

    pollRef.current = setTimeout(runBatch, 1200);
    return () => {
      if (pollRef.current) clearTimeout(pollRef.current);
    };
  }, [syncing, syncJobId]);

  async function savePat() {
    if (!pat.trim()) return;
    setPatSaving(true);
    setPatError(null);
    try {
      const res = await fetch("/api/me/secrets", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pat: pat.trim() }),
        credentials: "include",
      });
      if (!res.ok) {
        setPatError("Falha ao salvar — tente novamente.");
        return;
      }
      setPat("");
      setPatSaved(true);
      setConfig((prev) => prev ? { ...prev, hasPat: true } : prev);
      setTimeout(() => setPatSaved(false), 3000);
    } finally {
      setPatSaving(false);
    }
  }

  async function saveLlm() {
    if (!apiKey.trim()) return;
    setLlmSaving(true);
    setLlmError(null);
    try {
      const res = await fetch("/api/me/secrets", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ llmProvider: provider, llmApiKey: apiKey.trim(), llmModel: model }),
        credentials: "include",
      });
      if (!res.ok) {
        setLlmError("Falha ao salvar — tente novamente.");
        return;
      }
      setApiKey("");
      setLlmSaved(true);
      setConfig((prev) => prev ? { ...prev, hasLlmKey: true, llmProvider: provider, llmModel: model } : prev);
      setTimeout(() => setLlmSaved(false), 3000);
    } finally {
      setLlmSaving(false);
    }
  }

  async function saveProfile() {
    const isCustom = selectedKey === "custom";
    if (isCustom && !customProfileContent.trim()) return;
    setProfileSaving(true);
    setProfileError(null);
    try {
      const body = isCustom
        ? { customContent: customProfileContent }
        : { profileKey: selectedKey };
      const res = await fetch("/api/me/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        credentials: "include",
      });
      if (!res.ok) {
        setProfileError("Falha ao salvar — tente novamente.");
        return;
      }
      // Derive label from local metadata — PUT returns { ok: true }, not a ProfileResponse.
      const savedKey = isCustom ? "custom" : selectedKey;
      const savedMeta = PROFILE_METADATA.find((p) => p.key === savedKey);
      const savedLabel = savedMeta ? `${savedMeta.label} — ${savedMeta.group}` : null;
      setConfig((prev) =>
        prev ? { ...prev, profileKey: savedKey, profileLabel: savedLabel } : prev,
      );
      setProfileSaved(true);
      setTimeout(() => setProfileSaved(false), 3000);
    } finally {
      setProfileSaving(false);
    }
  }

  async function startSync(mode: "full" | "incremental") {
    if (syncing) return;
    setSyncing(true);
    try {
      const res = await fetch("/api/sync/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode }),
        credentials: "include",
      });
      if (!res.ok) { setSyncing(false); return; }
      const { jobId, done } = (await res.json()) as { jobId: string; done: boolean };

      const jobRes = await fetch("/api/sync/current", { credentials: "include" });
      if (jobRes.ok) {
        const job = (await jobRes.json()) as SyncJob | null;
        if (job) setSyncJob(job);
      }

      if (done) {
        setSyncing(false);
      } else {
        setSyncJobId(jobId);
      }
    } catch {
      setSyncing(false);
    }
  }

  async function handleSignOut() {
    await signOut();
    router.replace("/login");
  }

  if (sessionPending || !session) return null;

  const bytesUsed = config?.bytesUsed ?? 0;
  const usedPct = Math.min((bytesUsed / QUOTA_BYTES) * 100, 100).toFixed(1);

  const activeProfileMeta = PROFILE_METADATA.find((p) => p.key === config?.profileKey);
  const activeProfileLabel = activeProfileMeta
    ? `${activeProfileMeta.label} — ${activeProfileMeta.group}`
    : config?.profileLabel ?? null;

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-8 px-4 py-8 sm:px-6">
      {/* breadcrumb */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => router.push("/dashboard")}
          className="flex items-center gap-2 font-mono text-xs text-muted hover:text-accent transition-colors"
        >
          <ArrowLeft size={12} aria-hidden="true" />
          <span className="text-accent">~/</span>dev-telemetry
        </button>
        <button
          type="button"
          onClick={handleSignOut}
          className="font-mono text-xs text-muted hover:text-level-abaixo transition-colors"
        >
          sair
        </button>
      </div>

      {/* heading */}
      <div className="border-b border-surface pb-4">
        <h1 className="font-display text-xl font-semibold tracking-tight">
          <span className="text-accent">$</span> configure dev-telemetry
        </h1>
        <p className="mt-1 font-mono text-xs text-muted">
          {session.user.name} · {session.user.email}
        </p>
      </div>

      {/* PAT section */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-mono text-xs uppercase tracking-wider text-muted">GitHub PAT</h2>
          {config?.hasPat && (
            <span className="flex items-center gap-1 font-mono text-[10px] text-level-acima">
              <Check size={10} /> configurado
            </span>
          )}
        </div>
        <p className="font-mono text-xs text-muted/70">
          Token de acesso pessoal com escopos{" "}
          <code className="text-foreground">read:user</code>,{" "}
          <code className="text-foreground">public_repo</code> (ou{" "}
          <code className="text-foreground">repo</code> para privados) e{" "}
          <code className="text-foreground">read:org</code>.
        </p>
        <div className="flex gap-2">
          <input
            type="password"
            value={pat}
            onChange={(e) => setPat(e.target.value)}
            placeholder={config?.hasPat ? "substituir token atual…" : "ghp_…"}
            className="flex-1 rounded border border-surface bg-surface/40 px-3 py-2 font-mono text-sm text-foreground placeholder:text-muted/50 outline-none focus-visible:border-accent focus-visible:ring-1 focus-visible:ring-accent"
          />
          <button
            type="button"
            onClick={savePat}
            disabled={patSaving || !pat.trim()}
            className="inline-flex items-center gap-1.5 rounded border border-accent bg-accent/10 px-3 py-2 font-mono text-xs text-accent transition-colors hover:bg-accent/20 disabled:opacity-50"
          >
            {patSaving ? <Loader2 size={12} className="animate-spin" /> : patSaved ? <Check size={12} /> : null}
            {patSaved ? "salvo" : "salvar"}
          </button>
        </div>
        {patError && (
          <p className="font-mono text-xs text-level-abaixo">{patError}</p>
        )}
      </section>

      {/* LLM section */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-mono text-xs uppercase tracking-wider text-muted">Provedor LLM</h2>
          {config?.hasLlmKey && (
            <span className="flex items-center gap-1 font-mono text-[10px] text-level-acima">
              <Check size={10} /> configurado · {config.llmProvider} / {config.llmModel}
            </span>
          )}
        </div>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          <select
            value={provider}
            onChange={(e) => setProvider(e.target.value as LlmProvider)}
            className="rounded border border-surface bg-surface/40 px-3 py-2 font-mono text-sm text-foreground outline-none focus-visible:border-accent"
          >
            {LLM_PROVIDERS.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
          <input
            type="text"
            value={model}
            onChange={(e) => setModel(e.target.value)}
            placeholder="modelo"
            className="rounded border border-surface bg-surface/40 px-3 py-2 font-mono text-sm text-foreground placeholder:text-muted/50 outline-none focus-visible:border-accent"
          />
          <input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder={config?.hasLlmKey ? "substituir chave…" : "API key…"}
            className="rounded border border-surface bg-surface/40 px-3 py-2 font-mono text-sm text-foreground placeholder:text-muted/50 outline-none focus-visible:border-accent"
          />
        </div>
        <button
          type="button"
          onClick={saveLlm}
          disabled={llmSaving || !apiKey.trim()}
          className="inline-flex items-center gap-1.5 rounded border border-accent bg-accent/10 px-3 py-2 font-mono text-xs text-accent transition-colors hover:bg-accent/20 disabled:opacity-50"
        >
          {llmSaving ? <Loader2 size={12} className="animate-spin" /> : llmSaved ? <Check size={12} /> : null}
          {llmSaved ? "salvo" : "salvar configuração LLM"}
        </button>
        {llmError && (
          <p className="font-mono text-xs text-level-abaixo">{llmError}</p>
        )}
      </section>

      {/* Profile section */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-mono text-xs uppercase tracking-wider text-muted">Perfil de mercado</h2>
          {activeProfileLabel && (
            <span className="font-mono text-[10px] text-muted">{activeProfileLabel}</span>
          )}
        </div>
        <select
          value={selectedKey}
          onChange={(e) => setSelectedKey(e.target.value)}
          className="w-full rounded border border-surface bg-surface/40 px-3 py-2 font-mono text-sm text-foreground outline-none focus-visible:border-accent"
        >
          {PROFILE_GROUPS.map((group) => (
            <optgroup key={group} label={group}>
              {PROFILE_METADATA.filter((p) => p.group === group).map((p) => (
                <option key={p.key} value={p.key}>{p.label}</option>
              ))}
            </optgroup>
          ))}
          <option value="custom">Perfil personalizado</option>
        </select>

        {selectedKey === "custom" && (
          <div className="space-y-1">
            <textarea
              rows={10}
              value={customProfileContent}
              onChange={(e) => setCustomProfileContent(e.target.value)}
              maxLength={MAX_PROFILE_LENGTH}
              placeholder="Cole aqui o markdown do perfil de mercado…"
              className="w-full rounded border border-surface bg-surface/40 px-3 py-2 font-mono text-sm text-foreground placeholder:text-muted/50 outline-none focus-visible:border-accent"
            />
            <p className="text-right font-mono text-[10px] text-muted/60">
              {customProfileContent.length} / {MAX_PROFILE_LENGTH}
            </p>
          </div>
        )}

        <button
          type="button"
          onClick={saveProfile}
          disabled={profileSaving || (selectedKey === "custom" && !customProfileContent.trim())}
          className="inline-flex items-center gap-1.5 rounded border border-accent bg-accent/10 px-3 py-2 font-mono text-xs text-accent transition-colors hover:bg-accent/20 disabled:opacity-50"
        >
          {profileSaving ? <Loader2 size={12} className="animate-spin" /> : profileSaved ? <Check size={12} /> : null}
          {profileSaved ? "salvo" : "salvar perfil"}
        </button>
        {profileError && (
          <p className="font-mono text-xs text-level-abaixo">{profileError}</p>
        )}
      </section>

      {/* Storage meter */}
      <section className="space-y-2">
        <h2 className="font-mono text-xs uppercase tracking-wider text-muted">Armazenamento</h2>
        <div className="rounded border border-surface bg-surface/40 p-4 font-mono text-xs space-y-1">
          <p className="text-muted">
            [{terminalBar(bytesUsed, QUOTA_BYTES)}]{" "}
            <span className="text-foreground">{usedPct}%</span>
          </p>
          <p className="text-muted">
            {formatBytes(bytesUsed)}{" "}
            <span className="text-muted/50">/ {formatBytes(QUOTA_BYTES)}</span>
          </p>
        </div>
      </section>

      {/* Sync section */}
      <section className="space-y-3">
        <h2 className="font-mono text-xs uppercase tracking-wider text-muted">Sincronização</h2>

        {syncJob && (
          <div className="rounded border border-surface bg-surface/40 p-4 font-mono text-xs space-y-1">
            {syncJob.status === "running" || syncing ? (
              <>
                <p className="text-muted">
                  [{terminalBar(syncJob.reposDone, syncJob.reposTotal)}]{" "}
                  <span className="text-foreground">
                    {syncJob.reposTotal > 0
                      ? `${syncJob.reposDone}/${syncJob.reposTotal} repos`
                      : syncJob.phase ?? "iniciando…"}
                  </span>
                </p>
                <p className="text-muted">
                  {syncJob.commits.toLocaleString("pt-BR")} commits ·{" "}
                  {syncJob.prs.toLocaleString("pt-BR")} PRs
                </p>
              </>
            ) : (
              <p className={syncJob.status === "error" ? "text-level-abaixo" : "text-muted"}>
                {syncJob.status === "done" && (
                  <>
                    <span className="text-level-acima">✓</span>{" "}
                    carga concluída · {syncJob.commits.toLocaleString("pt-BR")} commits ·{" "}
                    {syncJob.prs.toLocaleString("pt-BR")} PRs
                  </>
                )}
                {syncJob.status === "limit_reached" && "⚠ quota atingida — considere limpar dados antigos"}
                {syncJob.status === "error" && `✗ erro: ${syncJob.error ?? "desconhecido"}`}
              </p>
            )}
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => startSync("incremental")}
            disabled={syncing || !config?.hasPat}
            className="inline-flex items-center gap-2 rounded border border-surface bg-surface/40 px-3 py-2 font-mono text-xs text-foreground transition-colors hover:border-accent disabled:opacity-50"
          >
            {syncing ? <Loader2 size={12} className="animate-spin" /> : null}
            sync incremental
          </button>
          <button
            type="button"
            onClick={() => startSync("full")}
            disabled={syncing || !config?.hasPat}
            className="inline-flex items-center gap-2 rounded border border-accent/40 bg-accent/5 px-3 py-2 font-mono text-xs text-accent/80 transition-colors hover:border-accent hover:text-accent disabled:opacity-50"
          >
            {syncing ? <Loader2 size={12} className="animate-spin" /> : null}
            carga completa (all-time)
          </button>
        </div>
        {!config?.hasPat && (
          <p className="font-mono text-xs text-muted/60">Configure um PAT para sincronizar.</p>
        )}
      </section>
    </main>
  );
}
