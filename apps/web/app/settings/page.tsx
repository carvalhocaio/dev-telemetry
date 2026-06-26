"use client";

import { ArrowRight, Check, Clipboard, ClipboardCheck, Eye, Loader2, X } from "lucide-react";
import CustomSelect from "@/components/CustomSelect";
import type { SelectOption } from "@/components/CustomSelect";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useSession } from "@/lib/auth-client";

const QUOTA_BYTES = 3 * 1024 * 1024 * 1024;
const LLM_PROVIDERS = ["gemini", "openai", "anthropic"] as const;
type LlmProvider = (typeof LLM_PROVIDERS)[number];

const DEFAULT_MODELS: Record<LlmProvider, string> = {
  gemini: "gemini-2.0-flash",
  openai: "gpt-4o-mini",
  anthropic: "claude-haiku-4-5-20251001",
};

const PROFILE_METADATA = [
  { key: "data_engineer_jr",          group: "Eng. de Dados",    fullLabel: "Engenheiro de Dados — Júnior" },
  { key: "data_engineer_pleno",       group: "Eng. de Dados",    fullLabel: "Engenheiro de Dados — Pleno" },
  { key: "data_engineer_sr",          group: "Eng. de Dados",    fullLabel: "Engenheiro de Dados — Sênior" },
  { key: "software_engineer_estagio", group: "Eng. de Software", fullLabel: "Engenheiro de Software — Estágio" },
  { key: "software_engineer_jr",      group: "Eng. de Software", fullLabel: "Engenheiro de Software — Júnior" },
  { key: "software_engineer_pleno",   group: "Eng. de Software", fullLabel: "Engenheiro de Software — Pleno" },
  { key: "software_engineer_sr",      group: "Eng. de Software", fullLabel: "Engenheiro de Software — Sênior" },
  { key: "student_dados",             group: "Estudante",        fullLabel: "Estudante — Foco em Dados" },
  { key: "student_software",          group: "Estudante",        fullLabel: "Estudante — Foco em Software" },
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

  // Profile preview modal
  const [previewContent, setPreviewContent] = useState<string | null>(null);
  const [previewLabel, setPreviewLabel] = useState<string>("");
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  // Sync scopes form
  const [availableOrgs, setAvailableOrgs] = useState<{ login: string }[]>([]);
  const [selectedScopes, setSelectedScopes] = useState<string[] | null>(null);
  const [scopesLoaded, setScopesLoaded] = useState(false);
  const [scopesSaving, setScopesSaving] = useState(false);
  const [scopesSaved, setScopesSaved] = useState(false);
  const [scopesError, setScopesError] = useState<string | null>(null);
  const [fetchingOrgs, setFetchingOrgs] = useState(false);

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
        const meta = PROFILE_METADATA.find((p) => p.key === profile.profileKey);
        setConfig((prev) => prev ? { ...prev, profileKey: profile.profileKey, profileLabel: meta?.fullLabel ?? profile.label } : prev);
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

    fetch("/api/me/sync-scopes", { credentials: "include" })
      .then((r) => r.ok ? r.json() as Promise<{ selectedScopes: string[] | null; availableOrgs: { login: string }[] }> : null)
      .then((data) => {
        if (data) {
          setAvailableOrgs(data.availableOrgs);
          setSelectedScopes(data.selectedScopes);
        }
        setScopesLoaded(true);
      })
      .catch(() => setScopesLoaded(true));
  }, [session]);


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
        // Refresh storage counter after sync completes.
        fetch("/api/me/secrets/status", { credentials: "include" })
          .then((r) => r.ok ? r.json() as Promise<SecretsStatus> : null)
          .then((data) => { if (data) setConfig((prev) => prev ? { ...prev, ...data } : prev); })
          .catch(() => null);
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

  async function saveScopes(scopes: string[]) {
    setScopesSaving(true);
    setScopesError(null);
    try {
      const res = await fetch("/api/me/sync-scopes", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scopes }),
        credentials: "include",
      });
      if (!res.ok) {
        setScopesError("Falha ao salvar — tente novamente.");
        return;
      }
      setSelectedScopes(scopes);
      setScopesSaved(true);
      setTimeout(() => setScopesSaved(false), 3000);
    } finally {
      setScopesSaving(false);
    }
  }

  function toggleScope(token: string) {
    const current = selectedScopes ?? ["personal", ...availableOrgs.map((o) => o.login)];
    setSelectedScopes(
      current.includes(token) ? current.filter((s) => s !== token) : [...current, token],
    );
  }

  async function fetchOrgs() {
    setFetchingOrgs(true);
    setScopesError(null);
    try {
      const r = await fetch("/api/me/sync-scopes", { credentials: "include" });
      if (!r.ok) throw new Error();
      const data = await r.json() as { selectedScopes: string[] | null; availableOrgs: { login: string }[] };
      setAvailableOrgs(data.availableOrgs);
      setSelectedScopes(data.selectedScopes);
    } catch {
      setScopesError("não foi possível buscar as orgs — verifique se o PAT tem escopo read:org");
    } finally {
      setFetchingOrgs(false);
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

  async function previewProfile() {
    if (selectedKey === "custom") return;
    setPreviewLoading(true);
    try {
      const res = await fetch(`/api/profiles/${selectedKey}`, { credentials: "include" });
      if (!res.ok) return;
      const data = (await res.json()) as { content: string; label: string; group: string };
      const meta = PROFILE_METADATA.find((p) => p.key === selectedKey);
      setPreviewLabel(meta?.fullLabel ?? `${data.group} — ${data.label}`);
      setPreviewContent(data.content);
      setPreviewOpen(true);
    } finally {
      setPreviewLoading(false);
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
      const savedLabel = savedMeta?.fullLabel ?? null;
      setConfig((prev) =>
        prev ? { ...prev, profileKey: savedKey, profileLabel: savedLabel } : prev,
      );
      setProfileSaved(true);
      setTimeout(() => setProfileSaved(false), 3000);
    } finally {
      setProfileSaving(false);
    }
  }

  async function startSync(mode: "full" | "recent") {
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

  if (sessionPending || !session) return null;

  const bytesUsed = config?.bytesUsed ?? 0;
  const usedPct = Math.min((bytesUsed / QUOTA_BYTES) * 100, 100).toFixed(1);

  const activeProfileMeta = PROFILE_METADATA.find((p) => p.key === config?.profileKey);
  const activeProfileLabel = activeProfileMeta?.fullLabel ?? config?.profileLabel ?? null;

  return (
    <>
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-8 px-4 py-8 sm:px-6">
      {/* heading */}
      <div className="border-b border-border pb-4">
        <h1 className="font-display text-2xl font-bold tracking-tight text-foreground">
          <span className="text-accent">$</span> SETUP
        </h1>
        <p className="mt-1 font-mono text-xs text-muted">
          {session.user.name}
          {session.user.githubLogin && (
            <> · <span className="text-accent">@{session.user.githubLogin}</span></>
          )}
          {" "}· {session.user.email}
        </p>
      </div>

      {/* PAT section */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-mono text-xs uppercase tracking-wider text-muted">GitHub PAT</h2>
          {config?.hasPat && (
            <span className="flex items-center gap-1 font-mono text-[10px] text-accent-dim">
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
            className="flex-1 rounded border border-border bg-surface px-3 py-2 font-mono text-sm text-foreground placeholder:text-muted/50 outline-none focus-visible:border-accent focus-visible:ring-1 focus-visible:ring-accent/30"
          />
          <button
            type="button"
            onClick={savePat}
            disabled={patSaving || !pat.trim()}
            className="inline-flex cursor-pointer items-center gap-1.5 rounded border border-accent bg-accent/10 px-3 py-2 font-mono text-xs text-accent transition-colors hover:bg-accent/20 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {patSaving ? <Loader2 size={12} className="animate-spin" /> : patSaved ? <Check size={12} /> : null}
            {patSaved ? "salvo" : "salvar"}
          </button>
        </div>
        {patError && (
          <p className="font-mono text-xs text-alert">{patError}</p>
        )}
      </section>

      {/* Sync scopes section — only shown when PAT is configured and data loaded */}
      {config?.hasPat && scopesLoaded && (
        <section className="space-y-3 border-t border-border pt-6">
          <div className="flex items-center justify-between">
            <h2 className="font-mono text-xs uppercase tracking-wider text-muted">Escopos de Sync</h2>
            <button
              type="button"
              onClick={fetchOrgs}
              disabled={fetchingOrgs}
              className="inline-flex cursor-pointer items-center gap-1.5 font-mono text-xs text-muted hover:text-accent transition-colors disabled:cursor-not-allowed disabled:opacity-50"
            >
              {fetchingOrgs && <Loader2 size={10} className="animate-spin" />}
              buscar orgs
            </button>
          </div>
          <p className="font-mono text-xs text-muted/70">
            Selecione quais escopos serão ingeridos nos próximos syncs.
            Dados já sincronizados não são removidos.
          </p>
          <div className="space-y-1">
            {(["personal", ...availableOrgs.map((o) => o.login)] as string[]).map((token) => {
              const active = selectedScopes === null || selectedScopes.includes(token);
              return (
                <label
                  key={token}
                  className="flex cursor-pointer items-center gap-3 rounded border border-border bg-surface px-3 py-2 font-mono text-sm transition-colors hover:border-accent"
                >
                  <input
                    type="checkbox"
                    checked={active}
                    onChange={() => toggleScope(token)}
                    className="accent-accent"
                  />
                  <span className={active ? "text-foreground" : "text-muted"}>
                    {token === "personal" ? "pessoal" : token}
                  </span>
                </label>
              );
            })}
          </div>
          <button
            type="button"
            onClick={() => saveScopes(selectedScopes ?? ["personal", ...availableOrgs.map((o) => o.login)])}
            disabled={scopesSaving}
            className="inline-flex cursor-pointer items-center gap-1.5 rounded border border-accent bg-accent/10 px-3 py-2 font-mono text-xs text-accent transition-colors hover:bg-accent/20 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {scopesSaving ? <Loader2 size={12} className="animate-spin" /> : scopesSaved ? <Check size={12} /> : null}
            {scopesSaved ? "salvo" : "salvar escopos"}
          </button>
          {scopesError && (
            <p className="font-mono text-xs text-alert">{scopesError}</p>
          )}
        </section>
      )}

      {/* LLM section */}
      <section className="space-y-3 border-t border-border pt-6">
        <div className="flex items-center justify-between">
          <h2 className="font-mono text-xs uppercase tracking-wider text-muted">Provedor LLM</h2>
          {config?.hasLlmKey && (
            <span className="flex items-center gap-1 font-mono text-[10px] text-accent-dim">
              <Check size={10} /> configurado · {config.llmProvider} / {config.llmModel}
            </span>
          )}
        </div>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          <CustomSelect
            value={provider}
            onChange={(v) => { const p = v as LlmProvider; setProvider(p); setModel(DEFAULT_MODELS[p]); }}
            options={LLM_PROVIDERS.map((p) => ({ value: p, label: p }))}
          />
          <input
            type="text"
            value={model}
            onChange={(e) => setModel(e.target.value)}
            placeholder="modelo"
            className="rounded border border-border bg-surface px-3 py-2 font-mono text-sm text-foreground placeholder:text-muted/50 outline-none focus-visible:border-accent focus-visible:ring-1 focus-visible:ring-accent/30"
          />
          <input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder={config?.hasLlmKey ? "substituir chave…" : "API key…"}
            className="rounded border border-border bg-surface px-3 py-2 font-mono text-sm text-foreground placeholder:text-muted/50 outline-none focus-visible:border-accent focus-visible:ring-1 focus-visible:ring-accent/30"
          />
        </div>
        <button
          type="button"
          onClick={saveLlm}
          disabled={llmSaving || !apiKey.trim()}
          className="inline-flex cursor-pointer items-center gap-1.5 rounded border border-accent bg-accent/10 px-3 py-2 font-mono text-xs text-accent transition-colors hover:bg-accent/20 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {llmSaving ? <Loader2 size={12} className="animate-spin" /> : llmSaved ? <Check size={12} /> : null}
          {llmSaved ? "salvo" : "salvar configuração LLM"}
        </button>
        {llmError && (
          <p className="font-mono text-xs text-alert">{llmError}</p>
        )}
      </section>

      {/* Profile section */}
      <section className="space-y-3 border-t border-border pt-6">
        <div className="flex items-center justify-between">
          <h2 className="font-mono text-xs uppercase tracking-wider text-muted">Perfil de mercado</h2>
          {activeProfileLabel && (
            <span className="font-mono text-[10px] text-muted">{activeProfileLabel}</span>
          )}
        </div>
        <CustomSelect
          value={selectedKey}
          onChange={setSelectedKey}
          className="w-full"
          options={[
            ...PROFILE_METADATA.map((p) => ({ value: p.key, label: p.fullLabel })),
            { value: "custom", label: "Perfil personalizado" },
          ]}
        />

        {selectedKey === "custom" && (
          <div className="space-y-1">
            <textarea
              rows={10}
              value={customProfileContent}
              onChange={(e) => setCustomProfileContent(e.target.value)}
              maxLength={MAX_PROFILE_LENGTH}
              placeholder="Cole aqui o markdown do perfil de mercado…"
              className="w-full rounded border border-border bg-surface px-3 py-2 font-mono text-sm text-foreground placeholder:text-muted/50 outline-none focus-visible:border-accent focus-visible:ring-1 focus-visible:ring-accent/30"
            />
            <p className="text-right font-mono text-[10px] text-muted/60">
              {customProfileContent.length} / {MAX_PROFILE_LENGTH}
            </p>
          </div>
        )}

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={saveProfile}
            disabled={profileSaving || (selectedKey === "custom" && !customProfileContent.trim())}
            className="inline-flex cursor-pointer items-center gap-1.5 rounded border border-accent bg-accent/10 px-3 py-2 font-mono text-xs text-accent transition-colors hover:bg-accent/20 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {profileSaving ? <Loader2 size={12} className="animate-spin" /> : profileSaved ? <Check size={12} /> : null}
            {profileSaved ? "salvo" : "salvar perfil"}
          </button>
          {selectedKey !== "custom" && (
            <button
              type="button"
              onClick={previewProfile}
              disabled={previewLoading}
              title="Visualizar instruções do perfil"
              className="inline-flex cursor-pointer items-center gap-1.5 rounded border border-border bg-surface/40 px-3 py-2 font-mono text-xs text-muted transition-colors hover:border-accent hover:text-accent disabled:opacity-50"
            >
              {previewLoading ? <Loader2 size={12} className="animate-spin" /> : <Eye size={12} />}
              visualizar
            </button>
          )}
        </div>
        {profileError && (
          <p className="font-mono text-xs text-alert">{profileError}</p>
        )}
      </section>

      {/* Storage meter */}
      <section className="space-y-2 border-t border-border pt-6">
        <h2 className="font-mono text-xs uppercase tracking-wider text-muted">Armazenamento</h2>
        <div className="rounded border border-border bg-surface p-4 font-mono text-xs space-y-1">
          <div className="flex w-full items-center gap-1 text-muted">
            <span>[</span>
            <div className="relative flex-1 overflow-hidden leading-none">
              <span className="block text-muted/30">{"░".repeat(80)}</span>
              <div
                className="absolute inset-0 overflow-hidden text-accent"
                style={{ width: `${usedPct}%` }}
              >
                {"█".repeat(80)}
              </div>
            </div>
            <span>]</span>
            <span className="ml-1 text-foreground">{usedPct}%</span>
          </div>
          <p className="text-muted">
            {formatBytes(bytesUsed)}{" "}
            <span className="text-muted/50">/ {formatBytes(QUOTA_BYTES)}</span>
          </p>
        </div>
      </section>

      {/* Sync section */}
      <section className="space-y-3 border-t border-border pt-6">
        <h2 className="font-mono text-xs uppercase tracking-wider text-muted">Sincronização</h2>

        {syncJob && (
          <div className="rounded border border-border bg-surface p-4 font-mono text-xs space-y-1">
            {syncJob.status === "running" || syncing ? (
              <>
                <div className="flex w-full items-center gap-1 text-muted">
                  <span>[</span>
                  <div className="relative flex-1 overflow-hidden leading-none">
                    <span className="block text-muted/30">{"░".repeat(80)}</span>
                    <div
                      className="absolute inset-0 overflow-hidden text-accent"
                      style={{
                        width: `${syncJob.reposTotal > 0 ? Math.min((syncJob.reposDone / syncJob.reposTotal) * 100, 100).toFixed(1) : 0}%`,
                      }}
                    >
                      {"█".repeat(80)}
                    </div>
                  </div>
                  <span>]</span>
                  <span className="ml-1 text-foreground">
                    {syncJob.reposTotal > 0
                      ? `${syncJob.reposDone}/${syncJob.reposTotal} repos`
                      : syncJob.phase ?? "iniciando…"}
                  </span>
                </div>
                <p className="text-muted">
                  {syncJob.commits.toLocaleString("pt-BR")} commits ·{" "}
                  {syncJob.prs.toLocaleString("pt-BR")} PRs
                </p>
              </>
            ) : (
              <p className={syncJob.status === "error" ? "text-alert" : "text-muted"}>
                {syncJob.status === "done" && (
                  <span className="flex items-center justify-between gap-4">
                    <span>
                      <span className="text-accent-dim">✓</span>{" "}
                      carga concluída · {syncJob.commits.toLocaleString("pt-BR")} commits ·{" "}
                      {syncJob.prs.toLocaleString("pt-BR")} PRs
                    </span>
                    <Link
                      href="/dashboard"
                      className="inline-flex items-center gap-1 text-accent hover:underline transition-colors"
                    >
                      ir para o dashboard <ArrowRight size={10} />
                    </Link>
                  </span>
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
            onClick={() => startSync("recent")}
            disabled={syncing || !config?.hasPat}
            className="inline-flex cursor-pointer items-center gap-2 rounded border border-border bg-surface px-3 py-2 font-mono text-xs text-foreground transition-colors hover:border-accent disabled:cursor-not-allowed disabled:opacity-50"
          >
            {syncing ? <Loader2 size={12} className="animate-spin" /> : null}
            sync 30 dias
          </button>
          <button
            type="button"
            onClick={() => startSync("full")}
            disabled={syncing || !config?.hasPat}
            className="inline-flex cursor-pointer items-center gap-2 rounded border border-accent/40 bg-accent/5 px-3 py-2 font-mono text-xs text-accent/80 transition-colors hover:border-accent hover:text-accent disabled:cursor-not-allowed disabled:opacity-50"
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

      {previewOpen && previewContent && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          onClick={() => setPreviewOpen(false)}
        >
          <div
            className="relative max-h-[80vh] w-full max-w-2xl overflow-y-auto rounded-md border border-border bg-background p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <span className="font-mono text-xs uppercase tracking-widest text-accent">
                {previewLabel}
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(previewContent ?? "");
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  }}
                  title="Copiar markdown"
                  aria-label="Copiar markdown"
                  className="flex items-center gap-1 font-mono text-[10px] text-muted transition-colors hover:text-accent"
                >
                  {copied ? <ClipboardCheck size={13} className="text-accent" /> : <Clipboard size={13} />}
                  {copied ? "copiado" : "copiar markdown"}
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewOpen(false)}
                  aria-label="Fechar"
                  className="text-muted transition-colors hover:text-foreground"
                >
                  <X size={16} />
                </button>
              </div>
            </div>
            <div className="font-mono text-xs leading-relaxed text-muted [&_h1]:mb-3 [&_h1]:font-bold [&_h1]:uppercase [&_h1]:tracking-widest [&_h1]:text-foreground [&_h2]:mb-2 [&_h2]:mt-4 [&_h2]:font-bold [&_h2]:uppercase [&_h2]:tracking-wider [&_h2]:text-foreground [&_h3]:mb-1 [&_h3]:mt-3 [&_h3]:font-semibold [&_h3]:text-foreground [&_li]:ml-4 [&_li]:list-disc [&_p]:mb-2 [&_strong]:text-foreground [&_table]:mb-3 [&_table]:w-full [&_table]:border-collapse [&_td]:border [&_td]:border-border [&_td]:px-2 [&_td]:py-1 [&_th]:border [&_th]:border-border [&_th]:px-2 [&_th]:py-1 [&_th]:text-left [&_th]:text-foreground [&_ul]:mb-2">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{previewContent}</ReactMarkdown>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
