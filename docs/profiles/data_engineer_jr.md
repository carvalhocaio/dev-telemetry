# Engenheiro de Dados Júnior no Mercado Brasileiro
## Documento de Referência — dev-telemetry

> **Uso:** este documento serve duas finalidades:
> 1. **Auditoria humana** — base factual para justificar nível de desempenho em revisões e promoções.
> 2. **Contexto LLM** — injetado no modelo como rubrica de mercado ao gerar narrativas interpretativas.
>
> O classificador determinístico do sistema é dono do nível numérico. Este documento define o *significado* de cada nível em termos de mercado.

---

## 1. O que é um Engenheiro de Dados Júnior no Brasil

Um profissional júnior em engenharia de dados está em fase de consolidação técnica. Executa tarefas bem definidas com supervisão, aprende a stack do time e começa a entregar partes de pipelines já desenhados por colegas mais experientes. A distinção prática em relação ao estagiário é a **autonomia em tarefas delimitadas** e a responsabilidade por código que vai à produção.

No mercado brasileiro de 2025–2026, o perfil júnior típico carrega:

- **0 a 2 anos** de experiência relevante em dados ou desenvolvimento.
- Domínio inicial de Python e SQL (queries, joins, agregações).
- Familiaridade com Git e fluxo de PRs.
- Primeiro contato com orquestração (Airflow/Prefect) e cloud (geralmente um provedor).
- Capacidade de seguir padrões do time e pedir ajuda quando travado.

---

## 2. Stack Esperada

### Core obrigatório
- **Linguagens:** Python (básico a intermediário), SQL (joins, agregações, subqueries).
- **Controle de versão:** Git com PRs e participação em code review (como autor).
- **Dados:** manipulação com pandas ou SQL; leitura/escrita em formatos comuns (CSV, Parquet, JSON).

### Em desenvolvimento (esperado ao longo do nível)
- **Orquestração:** leitura e pequenas alterações em DAGs do Airflow/Prefect.
- **Cloud:** uso assistido de um provedor (S3/GCS, BigQuery/Redshift).
- **Qualidade:** escrita de testes simples e validações guiadas.

---

## 3. Faixa Salarial de Referência (Brasil, 2025)

| Nível         | CLT (mensal)          | PJ (mensal)           |
|---------------|-----------------------|-----------------------|
| **Júnior**    | **R$ 4.000 – R$ 7.000** | **R$ 5.000 – R$ 9.000** |
| Pleno         | R$ 9.000 – R$ 15.000  | R$ 12.000 – R$ 20.000 |
| Sênior        | R$ 15.000 – R$ 25.000 | R$ 20.000 – R$ 35.000 |

> Fontes de referência: State of Data Brazil 2024, Glassdoor Brasil, levantamentos da comunidade Data Hackers.

---

## 4. O que o Mercado Mede (além de código)

O mercado avalia juniores principalmente por **trajetória de aprendizado e confiabilidade em tarefas delimitadas**:

1. **Consistência:** aparece e entrega de forma regular, mesmo que em escopo menor.
2. **Capacidade de seguir padrões:** código alinhado às convenções do time.
3. **Crescimento:** evolução visível no tipo de tarefa que consegue assumir.
4. **Colaboração:** pede ajuda no momento certo, responde a code reviews, documenta o que aprende.
5. **Cuidado:** mensagens de commit claras, PRs pequenos e revisáveis.

> **Nota sobre métricas de atividade:** para um júnior, regularidade vale mais que volume. Poucos commits bem-feitos e consistentes sinalizam mais maturidade que picos isolados de atividade.

---

## 5. Rubrica de Níveis de Desempenho

Os limites numéricos são determinados pelo classificador determinístico (percentis auto-referentes). Os descritivos abaixo definem o *significado qualitativo* de cada nível.

---

### 🔴 Abaixo (`abaixo`)

**Perfil típico:** atividade significativamente abaixo da própria linha de base histórica.

**Indicadores:**
- Poucas ou nenhuma entrega no período.
- Commits escassos com mensagens vagas.
- Ausência de PRs ou PRs sem descrição.

**Contexto:** comum em períodos de onboarding intenso, estudo, ou bloqueios técnicos não comunicados. Para um júnior, o sinal mais importante é retomar cadência e comunicar dificuldades.

---

### 🟡 Atendendo (`atendendo`)

**Perfil típico:** atividade dentro do esperado para um júnior em ritmo normal.

**Indicadores:**
- Cadência regular de commits com mensagens descritivas.
- PRs pequenos, abertos e mergeados com contexto mínimo.
- Trabalho em tarefas bem definidas: correções, pequenas features, ajustes guiados.

**Contexto:** este é o patamar saudável de um júnior em evolução. Entregar de forma confiável tarefas delimitadas é exatamente o esperado do nível.

---

### 🟢 Acima (`acima`)

**Perfil típico:** atividade acima da linha de base, com sinais de autonomia crescente.

**Indicadores:**
- Volume de entrega superior ao histórico pessoal.
- Commits e PRs com descrições mais detalhadas e contexto técnico.
- Tarefas de complexidade um pouco maior, assumidas com menos supervisão.
- Sinais de proatividade: identificar pequenos problemas e propor correções.

**Contexto:** um júnior neste nível está acelerando o aprendizado e começando a sinalizar prontidão para escopo maior — caminho natural rumo ao pleno.

---

### 🏆 Muito Acima (`muito_acima`)

**Perfil típico:** período de entrega excepcional para o nível, muito acima do próprio histórico.

**Indicadores:**
- Volume de atividade entre os maiores do histórico pessoal.
- Entregas que demonstram salto de autonomia: uma feature completa, um problema resolvido sem mão na massa de um sênior.
- Mensagens de commit e PRs que evidenciam compreensão crescente do sistema.

**Contexto:** por definição é um pico em relação ao próprio histórico. Picos recorrentes em um júnior são o sinal mais claro de evolução para pleno.

---

## 6. Sobre o Sistema de Classificação

O classificador usa **percentis auto-referentes** — cada período é comparado apenas contra o próprio histórico do profissional, não contra o mercado externo.

| Componente      | Peso | Justificativa                                                  |
|-----------------|------|----------------------------------------------------------------|
| `throughput`    | 0.45 | Combinação de commits + PRs; melhor proxy de entrega real.    |
| `active_days`   | 0.35 | Consistência temporal — especialmente importante para juniores.|
| `churn`         | 0.20 | Linhas adicionadas + removidas; indicador secundário.          |

| Nível        | Composite score |
|--------------|-----------------|
| `abaixo`     | < 0.20          |
| `atendendo`  | 0.20 – 0.70     |
| `acima`      | 0.70 – 0.90     |
| `muito_acima`| ≥ 0.90          |

### Limitações conhecidas
- Mede **atividade no GitHub** — estudo, pareamento, reuniões e mentoria recebida não são capturados.
- Períodos com menos de 8 semanas/meses têm `small_sample: true` no meta do report.

---

*Documento gerado para o projeto dev-telemetry. Última revisão: junho de 2026.*
