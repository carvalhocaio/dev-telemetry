"use client";

import Link from "next/link";

import type { Scope } from "@/types/report";

interface ScopeSelectorProps {
  currentScope: Scope;
  currentMode: string;
}

/** Repository scopes shown as a segmented toggle. */
const SCOPES: readonly { scope: Scope; label: string }[] = [
  { scope: "all", label: "Tudo" },
  { scope: "org", label: "Org" },
  { scope: "personal", label: "Pessoal" },
];

/**
 * Switches the repository scope via the `?scope=` query param, preserving the
 * current `?mode=` so the time window isn't reset.
 */
export default function ScopeSelector({ currentScope, currentMode }: ScopeSelectorProps) {
  return (
    <div
      role="group"
      aria-label="Escopo de repositórios"
      className="inline-flex rounded-md border border-surface bg-surface/40 p-0.5 font-mono text-xs"
    >
      {SCOPES.map(({ scope, label }) => {
        const active = scope === currentScope;
        return (
          <Link
            key={scope}
            href={`/?scope=${scope}&mode=${currentMode}`}
            aria-current={active ? "page" : undefined}
            className={`rounded px-3 py-1 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
              active
                ? "bg-accent text-background"
                : "text-muted hover:text-foreground"
            }`}
          >
            {label}
          </Link>
        );
      })}
    </div>
  );
}
