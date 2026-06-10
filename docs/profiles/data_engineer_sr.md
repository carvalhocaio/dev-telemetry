# Engenheiro de Dados Sênior no Mercado Brasileiro
## Documento de Referência — dev-telemetry

> **Uso:** este documento serve duas finalidades:
> 1. **Auditoria humana** — base factual para justificar nível de desempenho em revisões e promoções.
> 2. **Contexto LLM** — injetado no modelo como rubrica de mercado ao gerar narrativas interpretativas.
>
> O classificador determinístico do sistema é dono do nível numérico. Este documento define o *significado* de cada nível em termos de mercado.

---

## 1. O que é um Engenheiro de Dados Sênior no Brasil

Um profissional sênior opera com total autonomia, define arquiteturas e é responsável pela qualidade técnica de sistemas de dados inteiros. A distinção prática em relação ao pleno é o **impacto em escala**: decisões de design que afetam múltiplos times, mentoria de outros engenheiros, e responsabilidade por trade-offs de longo prazo (custo, confiabilidade, manutenibilidade).

No mercado brasileiro de 2025–2026, o perfil sênior típico carrega:

- **5+ anos** de experiência relevante em dados e engenharia de software.
- Domínio profundo de Python/Scala, SQL avançado e otimização de performance.
- Experiência desenhando arquiteturas: lakehouse, data mesh, CDC, streaming em escala.
- Fluência em cloud, IaC (Terraform), CI/CD e observabilidade de pipelines.
- Capacidade de liderar tecnicamente, mentorar plenos/juniores e negociar com stakeholders.

---

## 2. Stack Esperada

### Core obrigatório
- **Linguagens:** Python avançado, SQL de alta performance, frequentemente Scala/Java.
- **Orquestração:** Airflow/Prefect/Dagster com padrões de produção (idempotência, retries, SLAs).
- **Processamento:** Spark em escala, dbt para modelagem, otimização de custo/performance.
- **Arquitetura:** Delta Lake/Iceberg/Hudi, lakehouse, modelagem dimensional, CDC.

### Esperado no nível
- **Streaming:** Kafka/Kinesis/Flink em produção, não apenas POCs.
- **Infra:** Terraform/IaC, Kubernetes, CI/CD de pipelines.
- **Observabilidade e qualidade:** Monte Carlo, Great Expectations, SLAs de dados, data contracts.
- **LLMs e agentes:** projeto de sistemas que incorporam IA de forma confiável.

---

## 3. Faixa Salarial de Referência (Brasil, 2025)

| Nível         | CLT (mensal)          | PJ (mensal)           |
|---------------|-----------------------|-----------------------|
| Júnior        | R$ 4.000 – R$ 7.000   | R$ 5.000 – R$ 9.000   |
| Pleno         | R$ 9.000 – R$ 15.000  | R$ 12.000 – R$ 20.000 |
| **Sênior**    | **R$ 15.000 – R$ 25.000** | **R$ 20.000 – R$ 35.000** |

> Fontes de referência: State of Data Brazil 2024, Glassdoor Brasil, levels.fyi, levantamentos da comunidade Data Hackers.

---

## 4. O que o Mercado Mede (além de código)

Para seniores, o mercado mede **impacto sistêmico e capacidade de elevar o time**, não volume de código:

1. **Decisões de arquitetura:** escolhas que reduzem custo, risco e dívida técnica em escala.
2. **Liderança técnica:** mentoria, code reviews que ensinam, definição de padrões.
3. **Confiabilidade:** sistemas que operam com SLAs, observabilidade e baixa intervenção.
4. **Visão de negócio:** alinhamento entre dados e objetivos da empresa.
5. **Multiplicação:** tornar outros engenheiros mais produtivos.

> **Nota sobre métricas de atividade:** para um sênior, volume de commits pode até *cair* conforme o trabalho migra para design, revisão e mentoria. Um pico de `muito_acima` frequentemente reflete uma iniciativa estrutural; um período `atendendo` pode esconder trabalho de altíssimo impacto não capturado por commits.

---

## 5. Rubrica de Níveis de Desempenho

Os limites numéricos são determinados pelo classificador determinístico (percentis auto-referentes). Os descritivos abaixo definem o *significado qualitativo* de cada nível.

---

### 🔴 Abaixo (`abaixo`)

**Perfil típico:** atividade de código significativamente abaixo da própria linha de base.

**Indicadores:**
- Poucos commits ou PRs no período.
- Ausência de entregas de código mensuráveis.

**Contexto:** para seniores, este nível **frequentemente não indica baixo desempenho** — pode refletir um período dominado por design, reuniões de arquitetura, mentoria intensa, ou incident response. A rubrica registra o padrão de atividade no código, não o impacto total.

---

### 🟡 Atendendo (`atendendo`)

**Perfil típico:** atividade de código dentro do esperado para um sênior em regime normal.

**Indicadores:**
- Cadência regular de commits e PRs com alta qualidade.
- Code reviews frequentes, contexto técnico rico nas descrições.
- Trabalho equilibrado entre entrega direta e suporte ao time.

**Contexto:** este é o patamar sustentável de um sênior. O valor está tanto no que entrega quanto no que viabiliza nos outros.

---

### 🟢 Acima (`acima`)

**Perfil típico:** atividade acima da linha de base, com sinais de iniciativa estrutural.

**Indicadores:**
- Volume de entrega superior ao histórico pessoal.
- PRs com decisões arquiteturais documentadas e trade-offs explicados.
- Trabalho em refatorações estruturais, novos sistemas, ou otimizações de impacto.

**Contexto:** um sênior neste nível está conduzindo iniciativas técnicas relevantes, combinando entrega própria com elevação do padrão do time.

---

### 🏆 Muito Acima (`muito_acima`)

**Perfil típico:** período de entrega excepcional, muito acima do próprio histórico.

**Indicadores:**
- Volume entre os maiores do histórico pessoal.
- Liderança de uma iniciativa de alto impacto: nova arquitetura, migração crítica, sistema completo.
- Mensagens e PRs que evidenciam profundidade: trade-offs, diagnósticos complexos, decisões de longo prazo.

**Contexto:** picos assim normalmente correspondem a marcos arquiteturais. Para um sênior, a *recorrência* de impacto estrutural — não a frequência de commits — é o que sinaliza prontidão para staff/principal.

---

## 6. Sobre o Sistema de Classificação

O classificador usa **percentis auto-referentes** — cada período é comparado apenas contra o próprio histórico do profissional.

| Componente      | Peso | Justificativa                                                  |
|-----------------|------|----------------------------------------------------------------|
| `throughput`    | 0.45 | Combinação de commits + PRs; melhor proxy de entrega real.    |
| `active_days`   | 0.35 | Consistência temporal.                                         |
| `churn`         | 0.20 | Linhas adicionadas + removidas; indicador secundário.          |

| Nível        | Composite score |
|--------------|-----------------|
| `abaixo`     | < 0.20          |
| `atendendo`  | 0.20 – 0.70     |
| `acima`      | 0.70 – 0.90     |
| `muito_acima`| ≥ 0.90          |

### Limitações conhecidas (críticas para seniores)
- Mede **atividade no GitHub** — arquitetura, mentoria, reuniões de decisão e incident response não aparecem.
- Para seniores, a correlação entre volume de commits e impacto real é a **mais fraca** de todos os níveis. Interprete `abaixo`/`atendendo` com cautela.
- Períodos com menos de 8 semanas/meses têm `small_sample: true` no meta do report.

---

*Documento gerado para o projeto dev-telemetry. Última revisão: junho de 2026.*
