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
  label: string;
  group: string;
  content: string;
}

/**
 * Contextual control bar for the dashboard (global navigation lives in NavBar):
 * shows the active profile on the left and the report controls + sign-out on the
 * right.
 */
export default function DashboardHeader() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const mode = resolveMode(searchParams.get("mode"));
  const rawScope = searchParams.get("scope");
  const scope: Scope = isScope(rawScope) ? rawScope : "all";
  const [orgs, setOrgs] = useState<string[]>([]);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  // Restore persisted scope on first load (when URL has no scope param)
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

  // Persist scope whenever it changes
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
      .then((r) => r.ok ? r.json() as Promise<ProfileData> : null)
      .then((d) => { if (d?.label) setProfile(d); })
      .catch(() => null);
  }, []);

  async function handleSignOut() {
    await signOut();
    window.location.href = "/login";
  }

  const profileLabel = profile
    ? profile.group
      ? `${profile.label} — ${profile.group}`
      : profile.label
    : null;

  return (
    <>
      <header className="flex items-center justify-between gap-4 border-b border-border pb-4">
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs uppercase tracking-widest text-muted">
            {profileLabel ?? <span className="animate-pulse">···</span>}
          </span>
          {profile && (
            <button
              type="button"
              onClick={() => setModalOpen(true)}
              aria-label="Ver descrição do cargo"
              title="Ver descrição do cargo"
              className="text-muted/40 transition-colors hover:text-muted"
            >
              <Eye size={12} aria-hidden="true" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-3">
          <SyncButton />
          <ScopeSelector currentScope={scope} currentMode={mode} orgs={orgs} />
          <button
            type="button"
            onClick={handleSignOut}
            aria-label="Sair"
            title="Sair"
            className="inline-flex items-center justify-center rounded-md border border-surface bg-surface/40 p-1.5 text-muted transition-colors hover:border-red-600 hover:text-red-600"
          >
            <LogOut size={14} aria-hidden="true" />
          </button>
        </div>
      </header>

      {modalOpen && profile && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          onClick={() => setModalOpen(false)}
        >
          <div
            className="relative max-h-[80vh] w-full max-w-2xl overflow-y-auto rounded-md border border-border bg-background p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <span className="font-mono text-xs uppercase tracking-widest text-accent">
                {profileLabel}
              </span>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                aria-label="Fechar"
                className="text-muted transition-colors hover:text-foreground"
              >
                <X size={16} />
              </button>
            </div>
            <div className="font-mono text-xs leading-relaxed text-muted [&_h1]:mb-3 [&_h1]:font-bold [&_h1]:uppercase [&_h1]:tracking-widest [&_h1]:text-foreground [&_h2]:mb-2 [&_h2]:mt-4 [&_h2]:font-bold [&_h2]:uppercase [&_h2]:tracking-wider [&_h2]:text-foreground [&_h3]:mb-1 [&_h3]:mt-3 [&_h3]:font-semibold [&_h3]:text-foreground [&_li]:ml-4 [&_li]:list-disc [&_p]:mb-2 [&_strong]:text-foreground [&_table]:mb-3 [&_table]:w-full [&_table]:border-collapse [&_td]:border [&_td]:border-border [&_td]:px-2 [&_td]:py-1 [&_th]:border [&_th]:border-border [&_th]:px-2 [&_th]:py-1 [&_th]:text-left [&_th]:text-foreground [&_ul]:mb-2">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{profile.content}</ReactMarkdown>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
