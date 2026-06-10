"use client";

import { useEffect, useId, useRef, useState } from "react";

import { useAuth } from "@/hooks/useAuth";

type Status = "idle" | "loading" | "error";

/**
 * Required login gate. Renders a native `<dialog>` (modal) asking for the API
 * password. On submit it probes `POST /api/auth/verify` with the password as a
 * Bearer token: 204 unlocks the app (via `login`), 401 shows an inline error.
 * Esc does not dismiss it — there is no app behind it until authenticated.
 */
export default function LoginDialog() {
  const { login, reason } = useAuth();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const inputId = useId();
  const errorId = useId();
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<Status>("idle");

  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) {
      dialog.showModal();
    }
    inputRef.current?.focus();
  }, []);

  function handleCancel(event: React.SyntheticEvent<HTMLDialogElement>): void {
    // Esc fires a `cancel` event on <dialog>; block it — this is a hard gate.
    event.preventDefault();
  }

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>,
  ): Promise<void> {
    event.preventDefault();
    if (status === "loading" || password.length === 0) {
      return;
    }

    setStatus("loading");
    try {
      const response = await fetch("/api/auth/verify", {
        method: "POST",
        headers: { Authorization: `Bearer ${password}` },
      });

      if (response.status === 204) {
        login(password);
        return;
      }

      setStatus("error");
    } catch {
      setStatus("error");
    }
  }

  const errorMessage =
    status === "error" ? "Senha inválida ou API indisponível." : null;

  return (
    <dialog
      ref={dialogRef}
      onCancel={handleCancel}
      aria-labelledby={`${inputId}-title`}
      className="m-auto w-full max-w-sm rounded-lg border border-surface bg-background p-6 text-foreground backdrop:bg-background/80"
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <h2
            id={`${inputId}-title`}
            className="font-display text-lg font-medium tracking-tight"
          >
            <span className="text-accent">$</span> dev-telemetry
          </h2>
          <p className="font-mono text-xs text-muted">
            Informe a senha para acessar o painel.
          </p>
        </div>

        {reason && (
          <p
            role="status"
            className="font-mono text-xs text-level-atendendo"
          >
            {reason}
          </p>
        )}

        <div className="flex flex-col gap-1">
          <label htmlFor={inputId} className="font-mono text-xs text-muted">
            Senha
          </label>
          <input
            ref={inputRef}
            id={inputId}
            type="password"
            name="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => {
              setPassword(event.target.value);
              if (status === "error") {
                setStatus("idle");
              }
            }}
            aria-invalid={status === "error"}
            aria-describedby={errorMessage ? errorId : undefined}
            className="rounded-md border border-surface bg-surface/40 px-3 py-2 font-mono text-sm text-foreground outline-none focus-visible:border-accent focus-visible:ring-1 focus-visible:ring-accent"
          />
        </div>

        {errorMessage && (
          <p
            id={errorId}
            role="alert"
            className="font-mono text-xs text-level-abaixo"
          >
            {errorMessage}
          </p>
        )}

        <button
          type="submit"
          disabled={status === "loading" || password.length === 0}
          aria-busy={status === "loading"}
          className="inline-flex items-center justify-center rounded-md border border-accent bg-accent px-3 py-2 font-mono text-sm text-background transition-colors hover:opacity-90 disabled:opacity-60"
        >
          {status === "loading" ? "Verificando…" : "Entrar"}
        </button>
      </form>
    </dialog>
  );
}
