import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacidade",
  description: "Política de privacidade do dev-telemetry.",
};

export default function PrivacyPage() {
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
          <span className="text-accent">#</span> Privacidade
        </h1>
        <p className="font-mono text-xs text-muted">Última atualização: junho de 2025</p>
      </div>

      <section className="flex flex-col gap-4">
        <h2 className="font-mono text-sm font-medium uppercase tracking-wider text-muted">
          Quais dados coletamos
        </h2>
        <div className="flex flex-col gap-2 font-mono text-sm text-foreground leading-relaxed">
          <p>
            O dev-telemetry coleta apenas os dados estritamente necessários para funcionar:
          </p>
          <ul className="flex flex-col gap-1 pl-4 list-disc list-inside text-muted">
            <li>E-mail e nome fornecidos pelo GitHub OAuth no momento do login</li>
            <li>Commits e pull requests dos repositórios que você autorizar sincronizar</li>
            <li>Chave de API do GitHub (PAT) e chaves de LLM fornecidas por você nas configurações</li>
          </ul>
          <p className="text-muted">
            Não coletamos código-fonte, conteúdo de arquivos, histórico de navegação nem qualquer
            dado além do necessário para gerar suas métricas de performance.
          </p>
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="font-mono text-sm font-medium uppercase tracking-wider text-muted">
          Como armazenamos seus dados
        </h2>
        <div className="flex flex-col gap-2 font-mono text-sm text-foreground leading-relaxed">
          <p>
            Todos os dados são armazenados em banco de dados PostgreSQL hospedado na{" "}
            <span className="text-accent">Neon</span>.
          </p>
          <p>
            Suas credenciais sensíveis (PAT do GitHub e chaves de LLM) são cifradas com{" "}
            <span className="text-accent">AES-256-GCM</span> antes de serem persistidas.
            O texto plano nunca é armazenado nem retornado pela API.
          </p>
          <p className="text-muted">
            A chave de criptografia é mantida apenas no ambiente do servidor e nunca exposta
            ao cliente.
          </p>
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="font-mono text-sm font-medium uppercase tracking-wider text-muted">
          O que não fazemos
        </h2>
        <ul className="flex flex-col gap-1 pl-4 list-disc list-inside font-mono text-sm text-muted">
          <li>Não vendemos seus dados para terceiros</li>
          <li>Não compartilhamos suas métricas ou credenciais com outros usuários</li>
          <li>Não utilizamos seus dados para treinar modelos de IA</li>
          <li>Não armazenamos respostas geradas pelos provedores de LLM além da sessão atual</li>
        </ul>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="font-mono text-sm font-medium uppercase tracking-wider text-muted">
          Retenção e exclusão
        </h2>
        <p className="font-mono text-sm text-foreground leading-relaxed">
          Seus dados são mantidos enquanto sua conta estiver ativa. Ao remover sua conta,
          todos os dados associados — commits, PRs, credenciais cifradas e perfis — são
          permanentemente deletados do banco de dados.
        </p>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="font-mono text-sm font-medium uppercase tracking-wider text-muted">
          Contato
        </h2>
        <p className="font-mono text-sm text-muted">
          Dúvidas sobre privacidade:{" "}
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
