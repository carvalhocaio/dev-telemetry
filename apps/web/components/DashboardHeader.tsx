"use client";

import { Eye, LogOut, X } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import ScopeSelector from "@/components/ScopeSelector";
import SyncButton from "@/components/SyncButton";
import { signOut } from "@/lib/auth-client";
import { resolveMode } from "@/lib/range";
import { isScope, type Scope } from "@/types/report";

const SCOPE_STORAGE_KEY = "dt:scope";

interface ProfileData {
  key: string;
  label: string;
  group: string;
  content: string;
}

export default function DashboardHeader() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const mode = resolveMode(searchParams.get("mode"));
  const rawScope = searchParams.get("scope");
  const scope: Scope = isScope(rawScope) ? rawScope : "all";
  const [orgs, setOrgs] = useState<string[]>([]);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    if (!searchParams.get("scope")) {
      const saved = localStorage.getItem(SCOPE_STORAGE_KEY);
      if (saved && saved !== "all") {
        const params = new URLSearchParams(searchParams.toString());
        params.set("scope", saved);
        router.replace(`/dashboard?${params.toString()}`);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    localStorage.setItem(SCOPE_STORAGE_KEY, scope);
  }, [scope]);

  useEffect(() => {
    fetch("/api/me/orgs", { credentials: "include" })
      .then((r) => r.ok ? r.json() as Promise<{ orgs: string[] }> : null)
      .then((data) => { if (data) setOrgs(data.orgs); })
      .catch(() => null);
  }, []);

  useEffect(() => {
    fetch("/api/me/profile", { credentials: "include" })
      .then((r) => r.ok ? r.json() as Promise<{ profileKey: string; label: string; group: string; content: string }> : null)
      .then((d) => { if (d?.label) setProfile({ key: d.profileKey, label: d.label, group: d.group, content: d.content }); })
      .catch(() => null);
  }, []);

  async function handleSignOut() {
    await signOut();
    window.location.href = "/login";
  }

  function handleViewProfile() {
    if (!profile) return;
    if (window.innerWidth < 640 && profile.key !== "custom") {
      window.open(`/profile/${profile.key}`, "_blank");
    } else {
      setModalOpen(true);
    }
  }

  const profileLabel = profile
    ? profile.group
      ? `${profile.label} — ${profile.group}`
      : profile.label
    : null;

  return (
    <>
      <header className="border-b border-border pb-4">
        {/* ── Desktop: single row ── */}
        <div className="hidden sm:flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs uppercase tracking-widest text-muted">
              {profileLabel ?? <span className="animate-pulse">···</span>}
            </span>
            {profile && (
              <button type="button" onClick={handleViewProfile}
                aria-label="Ver descrição do cargo"
                className="text-muted/40 transition-colors hover:text-muted">
                <Eye size={12} />
              </button>
            )}
          </div>
          <div className="flex items-center gap-3">
            <SyncButton />
            <ScopeSelector currentScope={scope} currentMode={mode} orgs={orgs} />
            <button type="button" onClick={handleSignOut} aria-label="Sair"
              className="inline-flex items-center justify-center rounded-md border border-surface bg-surface/40 p-1.5 text-muted transition-colors hover:border-red-600 hover:text-red-600">
              <LogOut size={14} />
            </button>
          </div>
        </div>

        {/* ── Mobile: stacked rows ── */}
        <div className="flex flex-col gap-3 sm:hidden">
          {/* Row 1: profile + eye */}
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs uppercase tracking-widest text-muted">
              {profileLabel ?? <span className="animate-pulse">···</span>}
            </span>
            {profile && (
              <button type="button" onClick={handleViewProfile}
                aria-label="Ver descrição do cargo"
                className="text-muted/40 transition-colors hover:text-muted">
                <Eye size={12} />
              </button>
            )}
          </div>
          {/* Row 2: sync */}
          <SyncButton />
          {/* Row 3: scope selector — full width */}
          <ScopeSelector currentScope={scope} currentMode={mode} orgs={orgs} fullWidth />
        </div>
      </header>

      {modalOpen && profile && (
        <>
          <div className="fixed inset-0 z-50 bg-black/70" onClick={() => setModalOpen(false)} />
          <div className="fixed inset-0 z-[51] overflow-y-auto p-8" onClick={() => setModalOpen(false)}>
            <div className="relative mx-auto w-full max-w-2xl rounded-md border border-border bg-background" onClick={(e) => e.stopPropagation()}>
              <div className="p-6">
                <div className="mb-4 flex items-center justify-between gap-2">
                  <span className="min-w-0 truncate font-mono text-xs uppercase tracking-wide text-accent">{profileLabel}</span>
                  <button type="button" onClick={() => setModalOpen(false)} aria-label="Fechar"
                    className="shrink-0 text-muted transition-colors hover:text-foreground">
                    <X size={16} />
                  </button>
                </div>
                <div className="prose-modal" style={{ overflowWrap: "anywhere" }}>
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{profile.content}</ReactMarkdown>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
