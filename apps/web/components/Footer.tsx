import Link from "next/link";

export default function Footer() {
  return (
    <footer className="mt-auto border-t border-surface">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4 px-6 py-4">
        <span className="font-mono text-xs font-medium text-foreground">
          <span className="text-accent">$</span> dev-telemetry
        </span>

        <nav className="flex items-center gap-5" aria-label="Rodapé">
          <Link
            href="/privacy"
            className="font-mono text-xs text-muted transition-colors hover:text-foreground"
          >
            Privacidade
          </Link>
          <Link
            href="/terms"
            className="font-mono text-xs text-muted transition-colors hover:text-foreground"
          >
            Termos
          </Link>
          <a
            href="mailto:caiocarvalho.py@gmail.com"
            className="font-mono text-xs text-muted transition-colors hover:text-foreground"
          >
            Contato
          </a>
        </nav>

        <span className="font-mono text-xs text-muted">Feito por devs, para devs</span>
      </div>
    </footer>
  );
}
