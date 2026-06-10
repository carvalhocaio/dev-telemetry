# Engenheiro de Software Pleno no Mercado Brasileiro
## Documento de Referência — dev-telemetry

> **Uso:** este documento serve duas finalidades:
> 1. **Auditoria humana** — base factual para justificar nível de desempenho em revisões e promoções.
> 2. **Contexto LLM** — injetado no modelo como rubrica de mercado ao gerar narrativas interpretativas.
>
> O classificador determinístico do sistema é dono do nível numérico. Este documento define o *significado* de cada nível em termos de mercado.

---

## 1. O que é um Engenheiro de Software Pleno no Brasil

Um pleno entrega funcionalidades de ponta a ponta com autonomia, toma decisões de design no escopo do seu trabalho e resolve problemas sem supervisão constante. A distinção em relação ao júnior é a capacidade de **levar uma feature da concepção à produção com qualidade**, lidando com ambiguidade e trade-offs.

No mercado brasileiro de 2025–2026, o perfil pleno típico carrega:

- **2 a 5 anos** de experiência profissional.
- Domínio sólido de uma stack e fluência em uma segunda área (back/front/infra).
- Boas práticas: testes, SOLID, design de APIs, tratamento de erros, observabilidade.
- Capacidade de revisar código de colegas e dar feedback técnico.
- Comunicação com produto/negócio para refinar requisitos.

---

## 2. Stack Esperada

### Core obrigatório
- **Linguagem + framework** com profundidade (ex.: TypeScript/React/Node, Java/Spring, Go).
- **Git:** PRs bem estruturados, code review como revisor e autor.
- **Testes:** unitários e de integração; entende a pirâmide de testes.
- **Banco de dados:** modelagem, queries, índices, transações.
- **APIs e arquitetura:** REST/gRPC, autenticação, design de serviços.

### Cada vez mais esperado (2025–2026)
- **Cloud e containers:** Docker, noções de Kubernetes, deploy em cloud.
- **CI/CD:** manutenção e melhoria do pipeline.
- **Observabilidade:** logs estruturados, métricas, tracing.
- **IA aplicada:** uso de LLMs/agentes para acelerar entrega e em features de produto.

---

## 3. Faixa Salarial de Referência (Brasil, 2025)

| Nível         | CLT (mensal)          | PJ (mensal)           |
|---------------|-----------------------|-----------------------|
| Júnior        | R$ 3.500 – R$ 7.000   | R$ 5.000 – R$ 9.000   |
| **Pleno**     | **R$ 8.000 – R$ 14.000** | **R$ 11.000 – R$ 18.000** |
| Sênior        | R$ 14.000 – R$ 24.000 | R$ 18.000 – R$ 32.000 |

> Fontes de referência: Glassdoor Brasil, levels.fyi, pesquisas salariais de comunidades de tecnologia.

---

## 4. O que o Mercado Mede (além de código)

O mercado avalia plenos por **entrega de impacto com qualidade e autonomia**:

1. **Impacto no produto:** features que chegam à produção e geram valor.
2. **Qualidade técnica:** código testável, documentado, com tratamento de erros e atenção a performance.
3. **Consistência:** entregas regulares, não sprints brilhantes seguidos de sumiço.
4. **Evolução de escopo:** capacidade crescente de resolver problemas mais ambíguos.
5. **Colaboração:** code reviews que ajudam, documentação, suporte a juniores.

> **Nota sobre métricas de atividade:** commits e PRs medem *atividade*, não *impacto*. Uma feature crítica entregue com 10 commits cuidadosos vale mais que 50 commits cosméticos. O contexto qualitativo (o que as mensagens descrevem) importa tanto quanto o volume.

---

## 5. Rubrica de Níveis de Desempenho

Os limites numéricos são determinados pelo classificador determinístico (percentis auto-referentes). Os descritivos abaixo definem o *significado qualitativo* de cada nível.

---

### 🔴 Abaixo (`abaixo`)

**Perfil típico:** atividade significativamente abaixo da própria linha de base.

**Indicadores:**
- Poucas ou nenhuma entrega significativa.
- Commits escassos com mensagens vagas.
- Ausência de PRs ou PRs sem descrição.

**Contexto:** pode refletir férias, bloqueio técnico, ou fase de planejamento sem entregas concretas. A rubrica registra o padrão de atividade relativo ao histórico pessoal.

---

### 🟡 Atendendo (`atendendo`)

**Perfil típico:** atividade dentro do esperado para um pleno em regime normal.

**Indicadores:**
- Cadência regular de commits com mensagens descritivas.
- PRs abertos e mergeados com contexto (título + descrição).
- Trabalho em tarefas de complexidade moderada: features incrementais, correções, manutenção.

**Contexto:** patamar sustentável do dia a dia — confiável, não medíocre. Um pleno consistente aqui cumpre o contrato com o mercado.

---

### 🟢 Acima (`acima`)

**Perfil típico:** atividade acima da linha de base, com qualidade e escopo ampliado.

**Indicadores:**
- Volume de entrega consistentemente superior ao histórico pessoal.
- PRs com contexto técnico, motivação das decisões, atenção a testes.
- Features de maior complexidade: integrações novas, refatorações, melhorias de performance.
- Proatividade: identificar e resolver problemas sem ser solicitado.

**Contexto:** operando acima das expectativas do cargo, sinalizando prontidão para mais responsabilidade.

---

### 🏆 Muito Acima (`muito_acima`)

**Perfil típico:** período de entrega excepcional, muito acima do próprio histórico.

**Indicadores:**
- Volume entre os maiores do histórico pessoal.
- Iniciativas de alto impacto: novo módulo, refatoração estrutural, solução de problema crítico.
- Mensagens e PRs que evidenciam profundidade técnica: decisões arquiteturais, trade-offs, diagnósticos complexos.

**Contexto:** por definição é um pico em relação ao próprio histórico. A recorrência de picos é o que sinaliza evolução para sênior.

---

## 6. Sobre o Sistema de Classificação

O classificador usa **percentis auto-referentes** — cada período é comparado apenas contra o próprio histórico.

| Componente      | Peso | Justificativa                                                  |
|-----------------|------|----------------------------------------------------------------|
| `throughput`    | 0.45 | Combinação de commits + PRs; melhor proxy de entrega real.    |
| `active_days`   | 0.35 | Consistência temporal; evita que um dia de spam infle o período.|
| `churn`         | 0.20 | Linhas adicionadas + removidas; indicador secundário.          |

| Nível        | Composite score |
|--------------|-----------------|
| `abaixo`     | < 0.20          |
| `atendendo`  | 0.20 – 0.70     |
| `acima`      | 0.70 – 0.90     |
| `muito_acima`| ≥ 0.90          |

### Limitações conhecidas
- Mede **atividade no GitHub** — design, reuniões, mentoria e documentação fora do código não são capturados.
- Períodos com menos de 8 semanas/meses têm `small_sample: true` no meta do report.

---

*Documento gerado para o projeto dev-telemetry. Última revisão: junho de 2026.*
