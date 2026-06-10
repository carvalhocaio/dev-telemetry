# Engenheiro de Software Sênior no Mercado Brasileiro
## Documento de Referência — dev-telemetry

> **Uso:** este documento serve duas finalidades:
> 1. **Auditoria humana** — base factual para justificar nível de desempenho em revisões e promoções.
> 2. **Contexto LLM** — injetado no modelo como rubrica de mercado ao gerar narrativas interpretativas.
>
> O classificador determinístico do sistema é dono do nível numérico. Este documento define o *significado* de cada nível em termos de mercado.

---

## 1. O que é um Engenheiro de Software Sênior no Brasil

Um sênior opera com total autonomia, define arquiteturas, lidera tecnicamente e é responsável por trade-offs de longo prazo. A distinção em relação ao pleno é o **impacto além do próprio código**: decisões que afetam o time e o produto, mentoria, e elevação do padrão técnico coletivo.

No mercado brasileiro de 2025–2026, o perfil sênior típico carrega:

- **5+ anos** de experiência profissional.
- Domínio profundo da stack e visão de sistema (back, front, dados, infra).
- Experiência desenhando arquiteturas e liderando iniciativas técnicas.
- Fluência em observabilidade, performance, segurança e confiabilidade.
- Capacidade de mentorar, conduzir code reviews que ensinam e alinhar técnica com negócio.

---

## 2. Stack Esperada

### Core obrigatório
- **Linguagem(s) com profundidade** e domínio de design de sistemas.
- **Arquitetura:** serviços, mensageria, caching, modelagem de dados, design de APIs.
- **Qualidade:** estratégia de testes, CI/CD, observabilidade, performance.
- **Cloud e infra:** containers, Kubernetes, IaC (Terraform), deploy seguro.

### Esperado no nível
- **Segurança:** threat modeling, gestão de segredos, princípios de menor privilégio.
- **Liderança técnica:** RFCs, definição de padrões, mentoria estruturada.
- **IA aplicada:** projeto de sistemas que incorporam LLMs/agentes de forma confiável.

---

## 3. Faixa Salarial de Referência (Brasil, 2025)

| Nível         | CLT (mensal)          | PJ (mensal)           |
|---------------|-----------------------|-----------------------|
| Júnior        | R$ 3.500 – R$ 7.000   | R$ 5.000 – R$ 9.000   |
| Pleno         | R$ 8.000 – R$ 14.000  | R$ 11.000 – R$ 18.000 |
| **Sênior**    | **R$ 14.000 – R$ 24.000** | **R$ 18.000 – R$ 32.000** |

> Fontes de referência: Glassdoor Brasil, levels.fyi, pesquisas salariais de comunidades de tecnologia. Cargos staff/principal e empresas internacionais (PJ em dólar) ultrapassam essas faixas.

---

## 4. O que o Mercado Mede (além de código)

Para seniores, o mercado mede **impacto sistêmico e capacidade de elevar o time**:

1. **Decisões de arquitetura:** escolhas que reduzem custo, risco e dívida técnica.
2. **Liderança técnica:** mentoria, reviews que ensinam, definição de padrões.
3. **Confiabilidade:** sistemas observáveis, resilientes, seguros.
4. **Visão de negócio:** alinhamento entre técnica e objetivos do produto.
5. **Multiplicação:** tornar o time inteiro mais produtivo.

> **Nota sobre métricas de atividade:** para um sênior, volume de commits pode *cair* conforme o trabalho migra para design, revisão e mentoria. Um período `atendendo` pode esconder trabalho de altíssimo impacto não capturado por commits.

---

## 5. Rubrica de Níveis de Desempenho

Os limites numéricos são determinados pelo classificador determinístico (percentis auto-referentes). Os descritivos abaixo definem o *significado qualitativo* de cada nível.

---

### 🔴 Abaixo (`abaixo`)

**Perfil típico:** atividade de código abaixo da própria linha de base.

**Indicadores:**
- Poucos commits ou PRs no período.
- Ausência de entregas de código mensuráveis.

**Contexto:** para seniores, este nível **frequentemente não indica baixo desempenho** — pode refletir design, reuniões de arquitetura, mentoria intensa, ou incident response. Interprete com cautela.

---

### 🟡 Atendendo (`atendendo`)

**Perfil típico:** atividade de código dentro do esperado para um sênior em regime normal.

**Indicadores:**
- Cadência regular de commits e PRs de alta qualidade.
- Code reviews frequentes, descrições técnicas ricas.
- Equilíbrio entre entrega direta e suporte ao time.

**Contexto:** patamar sustentável de um sênior. O valor está tanto no que entrega quanto no que viabiliza nos outros.

---

### 🟢 Acima (`acima`)

**Perfil típico:** atividade acima da linha de base, com iniciativa estrutural.

**Indicadores:**
- Volume de entrega superior ao histórico pessoal.
- PRs com decisões arquiteturais documentadas e trade-offs explicados.
- Refatorações estruturais, novos sistemas, otimizações de impacto.

**Contexto:** conduzindo iniciativas técnicas relevantes e elevando o padrão do time.

---

### 🏆 Muito Acima (`muito_acima`)

**Perfil típico:** período de entrega excepcional, muito acima do próprio histórico.

**Indicadores:**
- Volume entre os maiores do histórico pessoal.
- Liderança de iniciativa de alto impacto: nova arquitetura, migração crítica, sistema completo.
- Mensagens e PRs que evidenciam profundidade: trade-offs, diagnósticos complexos, decisões de longo prazo.

**Contexto:** picos assim correspondem a marcos técnicos. A *recorrência* de impacto estrutural sinaliza prontidão para staff/principal.

---

## 6. Sobre o Sistema de Classificação

O classificador usa **percentis auto-referentes** — cada período é comparado apenas contra o próprio histórico.

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
- Mede **atividade no GitHub** — arquitetura, mentoria, decisões e incident response não aparecem.
- Para seniores, a correlação entre volume de commits e impacto real é a **mais fraca** de todos os níveis.
- Períodos com menos de 8 semanas/meses têm `small_sample: true` no meta do report.

---

*Documento gerado para o projeto dev-telemetry. Última revisão: junho de 2026.*
