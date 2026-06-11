"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

import CustomSelect from "@/components/CustomSelect";
import type { Scope } from "@/types/report";

interface ScopeSelectorProps {
  currentScope: Scope;
  currentMode: string;
  orgs?: string[];
}

export default function ScopeSelector({ currentScope, currentMode, orgs = [] }: ScopeSelectorProps) {
  const router = useRouter();

  const activeOrg = currentScope.startsWith("org:") ? currentScope.slice(4) : "";

  const fixedTabs: { scope: Scope; label: string }[] = [
    { scope: "all", label: "tudo" },
    { scope: "personal", label: "pessoal" },
  ];

  return (
    <div
      role="group"
      aria-label="Escopo de repositórios"
      className="inline-flex items-center rounded-md border border-surface bg-surface/40 p-0.5 font-mono text-xs"
    >
      {fixedTabs.map(({ scope, label }) => {
        const active = scope === currentScope;
        return (
          <Link
            key={scope}
            href={`/dashboard?scope=${scope}&mode=${currentMode}`}
            aria-current={active ? "page" : undefined}
            className={`rounded px-3 py-1 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
              active ? "bg-accent text-background" : "text-muted hover:text-foreground"
            }`}
          >
            {label}
          </Link>
        );
      })}

      {orgs.length > 0 && (
        <CustomSelect
          inline
          value={activeOrg}
          onChange={(org) => router.push(`/dashboard?scope=org:${org}&mode=${currentMode}`)}
          options={[
            { value: "", label: "org" },
            ...orgs.map((o) => ({ value: o, label: o })),
          ]}
        />
      )}
    </div>
  );
}
