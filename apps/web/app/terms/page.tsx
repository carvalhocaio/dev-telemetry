import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Termos de Uso",
  description: "Termos de uso do dev-telemetry.",
};

export default function TermsPage() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-12 flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <Link
          href="/"
          className="font-mono text-xs text-muted hover:text-accent transition-colors"
        >
          ← dev-telemetry
        </Link>
        <h1 className="font-display text-2xl font-medium tracking-tight">
          <span className="text-accent">#</span> Termos de Uso
        </h1>
        <p className="font-mono text-xs text-muted">Última atualização: junho de 2025</p>
      </div>

      <section className="flex flex-col gap-4">
        <h2 className="font-mono text-sm font-medium uppercase tracking-wider text-muted">
          Uso permitido
        </h2>
        <p className="font-mono text-sm text-foreground leading-relaxed">
          O dev-telemetry é uma ferramenta de uso pessoal para monitoramento de sua própria
          atividade no GitHub. Você pode utilizá-lo para fins pessoais e profissionais legítimos,
          como acompanhar sua evolução técnica, preparar avaliações de performance ou identificar
          padrões no seu trabalho.
        </p>
        <p className="font-mono text-sm text-muted leading-relaxed">
          É proibido usar o serviço para monitorar outros usuários sem o consentimento deles,
          para fins de vigilância, ou de qualquer forma que viole os Termos de Serviço do GitHub.
        </p>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="font-mono text-sm font-medium uppercase tracking-wider text-muted">
          Credenciais do GitHub
        </h2>
        <p className="font-mono text-sm text-foreground leading-relaxed">
          Você é responsável pelo Personal Access Token (PAT) do GitHub que fornece ao
          dev-telemetry. Recomendamos usar um token com escopos mínimos necessários (
          <span className="text-accent">read:user</span>,{" "}
          <span className="text-accent">read:org</span>,{" "}
          <span className="text-accent">repo</span> somente se necessário).
        </p>
        <p className="font-mono text-sm text-muted leading-relaxed">
          Revogue o token imediatamente se suspeitar de comprometimento. O dev-telemetry armazena
          o token cifrado e nunca o exibe em texto plano após o salvamento.
        </p>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="font-mono text-sm font-medium uppercase tracking-wider text-muted">
          Sem garantia
        </h2>
        <p className="font-mono text-sm text-muted leading-relaxed">
          O dev-telemetry é disponibilizado como software de código aberto sob a{" "}
          <span className="text-accent">Licença MIT</span>, sem garantias de qualquer tipo —
          expressas ou implícitas. Não há SLA, garantia de disponibilidade ou compromisso de
          suporte formal.
        </p>
        <p className="font-mono text-sm text-muted leading-relaxed">
          As análises e narrativas geradas por IA são baseadas em heurísticas e modelos de
          linguagem. Não devem ser usadas como único critério em decisões de contratação,
          demissão ou promoção.
        </p>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="font-mono text-sm font-medium uppercase tracking-wider text-muted">
          Limite de responsabilidade
        </h2>
        <p className="font-mono text-sm text-muted leading-relaxed">
          Em nenhuma circunstância o autor será responsável por danos diretos, indiretos,
          incidentais ou consequentes decorrentes do uso ou da impossibilidade de uso do serviço,
          inclusive perda de dados ou lucros cessantes.
        </p>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="font-mono text-sm font-medium uppercase tracking-wider text-muted">
          Licença
        </h2>
        <p className="font-mono text-sm text-foreground leading-relaxed">
          O código-fonte do dev-telemetry está disponível sob a{" "}
          <a
            href="https://github.com/dev-telemetry/dev-telemetry/blob/main/LICENSE"
            target="_blank"
            rel="noopener noreferrer"
            className="text-accent hover:underline"
          >
            Licença MIT
          </a>
          . Você pode copiar, modificar e distribuir o código, desde que mantenha o aviso de
          copyright original.
        </p>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="font-mono text-sm font-medium uppercase tracking-wider text-muted">
          Contato
        </h2>
        <p className="font-mono text-sm text-muted">
          Dúvidas sobre estes termos:{" "}
          <a
            href="mailto:caiocarvalho.py@gmail.com"
            className="text-accent hover:underline"
          >
            caiocarvalho.py@gmail.com
          </a>
        </p>
      </section>
    </main>
  );
}
