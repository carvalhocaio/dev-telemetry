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
    <main className="flex min-h-screen items-center justify-center px-6 bg-background">
      <div className="w-full max-w-md space-y-10">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="font-display text-6xl font-bold tracking-tight text-foreground">
            <span className="text-accent">$</span> dev-telemetry
          </h1>
          <p className="font-mono text-sm text-muted">
            telemetria para devs
          </p>
        </div>

        {/* Decorative terminal block */}
        <div className="border border-border bg-surface p-4 font-mono text-xs space-y-1">
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
          className="w-full flex items-center justify-center gap-3 border border-accent bg-transparent px-6 py-4 font-mono text-sm text-accent transition-colors hover:bg-accent hover:text-background cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <span aria-hidden="true" className={pending ? "text-muted" : "text-accent"}>
            █
          </span>
          {pending ? "AUTENTICANDO..." : "ENTRAR COM GITHUB"}
        </button>

        {error && (
          <p className="font-mono text-xs text-alert" role="alert">
            <span>✗</span> {error}
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
