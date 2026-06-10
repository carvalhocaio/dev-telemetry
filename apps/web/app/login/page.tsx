"use client";

import Link from "next/link";
import { useState } from "react";
import { signIn } from "@/lib/auth-client";

export default function LoginPage() {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSignIn() {
    setPending(true);
    setError(null);
    try {
      await signIn.social({ provider: "github", callbackURL: "/dashboard" });
    } catch {
      setError("falha ao iniciar autenticação — tente novamente.");
      setPending(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4 bg-background">
      <div className="w-full max-w-sm space-y-8">
        {/* Terminal breadcrumb */}
        <p className="font-mono text-xs text-muted">
          <span className="text-accent">~</span>
          {" "}/ dev-telemetry
        </p>

        {/* Header */}
        <div className="space-y-1">
          <h1 className="font-display text-3xl font-bold tracking-tight text-foreground">
            dev-telemetry
          </h1>
          <p className="font-mono text-sm text-muted">
            telemetria de dev para devs
          </p>
        </div>

        {/* Decorative terminal block */}
        <div className="border border-surface bg-surface/40 p-4 font-mono text-xs space-y-1">
          <p className="text-muted">
            <span className="text-accent">$</span>{" "}
            <span className="text-foreground">whoami</span>
          </p>
          <p className="text-muted">→ autentique com GitHub para continuar</p>
        </div>

        {/* GitHub sign-in button */}
        <button
          onClick={handleSignIn}
          disabled={pending}
          className="
            w-full flex items-center justify-center gap-3
            border border-muted bg-transparent
            font-mono text-sm text-foreground
            px-4 py-3
            transition-colors
            hover:border-accent hover:text-accent
            disabled:opacity-40 disabled:cursor-not-allowed
          "
        >
          <span
            aria-hidden="true"
            className={pending ? "text-muted" : "text-accent"}
          >
            █
          </span>
          {pending ? "autenticando..." : "Entrar com GitHub"}
        </button>

        {error && (
          <p className="font-mono text-xs text-red-400" role="alert">
            <span className="text-red-500">✗</span> {error}
          </p>
        )}

        {/* Footnote */}
        <p className="font-mono text-xs text-muted/50 leading-relaxed">
          acesso via GitHub OAuth · read:user
          <br />
          seus dados ficam no seu perfil
          <br />
          <Link href="/" className="transition-colors hover:text-accent">
            saiba mais
          </Link>
        </p>
      </div>
    </main>
  );
}
