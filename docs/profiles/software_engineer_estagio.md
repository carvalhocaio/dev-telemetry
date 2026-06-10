# Engenheiro de Software Estagiário no Mercado Brasileiro
## Documento de Referência — dev-telemetry

> **Uso:** este documento serve duas finalidades:
> 1. **Auditoria humana** — base factual para acompanhar evolução do estágio.
> 2. **Contexto LLM** — injetado no modelo como rubrica de mercado ao gerar narrativas interpretativas.
>
> O classificador determinístico do sistema é dono do nível numérico. Este documento define o *significado* de cada nível em termos de mercado.

---

## 1. O que é um Estagiário de Engenharia de Software no Brasil

Um estagiário está em fase de **primeiro contato com o desenvolvimento profissional**. Trabalha sob supervisão próxima, recebe tarefas bem delimitadas e tem como principal objetivo aprender — ferramentas, fluxo de trabalho, comunicação técnica e fundamentos de engenharia. O sucesso de um estágio é medido muito mais por **trajetória de aprendizado** do que por produção.

No mercado brasileiro de 2025–2026, o perfil de estagiário típico carrega:

- Cursando graduação ou bootcamp em tecnologia.
- Conhecimento básico de pelo menos uma linguagem de programação.
- Familiaridade inicial com Git (commit, push, branch).
- Disposição para aprender e capacidade de seguir orientações.

---

## 2. Stack Esperada

### Core obrigatório
- **Lógica de programação** e uma linguagem (JavaScript/TypeScript, Python, Java, etc.).
- **Git:** commit, branch, abertura de PR (mesmo que pequenos).
- **Fundamentos:** estruturas de dados básicas, leitura de código alheio.

### Em desenvolvimento (esperado durante o estágio)
- Padrões do time e ferramentas (linter, testes, CI).
- Participação em code review como autor.
- Pequenas tarefas em uma base de código real.

---

## 3. Faixa de Bolsa-Auxílio de Referência (Brasil, 2025)

| Nível         | Bolsa (mensal)        |
|---------------|-----------------------|
| **Estágio**   | **R$ 1.200 – R$ 3.000** |
| Júnior        | R$ 3.500 – R$ 6.500   |

> Fontes de referência: pesquisas de programas de estágio em tech (Nubank, iFood, Mercado Livre), Glassdoor Brasil. Bolsas variam bastante por porte da empresa e carga horária.

---

## 4. O que o Mercado Mede (além de código)

Para estagiários, o foco é **aprendizado, atitude e regularidade**:

1. **Curva de aprendizado:** evolução visível no tipo de tarefa que consegue assumir.
2. **Regularidade:** presença e entregas consistentes, mesmo que pequenas.
3. **Receptividade a feedback:** aplica o que aprende nos code reviews.
4. **Comunicação:** pede ajuda no momento certo, descreve o que tentou.
5. **Cuidado:** commits claros, PRs pequenos e fáceis de revisar.

> **Nota sobre métricas de atividade:** para um estagiário, volume é o indicador *menos* importante. Um padrão regular de pequenas contribuições, com qualidade crescente, é um sinal muito mais forte que picos de atividade.

---

## 5. Rubrica de Níveis de Desempenho

Os limites numéricos são determinados pelo classificador determinístico (percentis auto-referentes). Os descritivos abaixo definem o *significado qualitativo* de cada nível.

---

### 🔴 Abaixo (`abaixo`)

**Perfil típico:** atividade abaixo da própria linha de base.

**Indicadores:**
- Poucas ou nenhuma contribuição no período.
- Commits raros, sem contexto.

**Contexto:** muito comum em início de estágio (período de ambientação, estudo, setup) ou em semanas de provas/faculdade. Não julga causas — o importante é retomar cadência e comunicar dificuldades.

---

### 🟡 Atendendo (`atendendo`)

**Perfil típico:** atividade dentro do esperado para um estagiário em ritmo normal.

**Indicadores:**
- Contribuições pequenas e regulares.
- PRs pequenos com descrição mínima.
- Tarefas guiadas concluídas com apoio.

**Contexto:** este é exatamente o patamar saudável de um estágio. Entregar pequenas tarefas de forma consistente e aprender com cada uma é o objetivo do nível.

---

### 🟢 Acima (`acima`)

**Perfil típico:** atividade acima da linha de base, com sinais de autonomia inicial.

**Indicadores:**
- Volume de contribuição superior ao histórico pessoal.
- PRs com descrições mais completas.
- Tarefas assumidas com menos necessidade de supervisão.

**Contexto:** um estagiário neste nível está acelerando — começando a se comportar como um júnior em formação.

---

### 🏆 Muito Acima (`muito_acima`)

**Perfil típico:** período de contribuição excepcional para o nível.

**Indicadores:**
- Volume entre os maiores do histórico pessoal.
- Uma entrega que demonstra salto: uma pequena feature completa, um bug resolvido com pouca ajuda.
- Commits e PRs que evidenciam compreensão crescente do sistema.

**Contexto:** picos assim são ótimos sinais de prontidão para uma vaga júnior — desde que acompanhados de qualidade, não apenas volume.

---

## 6. Sobre o Sistema de Classificação

O classificador usa **percentis auto-referentes** — cada período é comparado apenas contra o próprio histórico.

| Componente      | Peso | Justificativa                                                  |
|-----------------|------|----------------------------------------------------------------|
| `throughput`    | 0.45 | Combinação de commits + PRs; proxy de atividade.              |
| `active_days`   | 0.35 | Consistência temporal — o sinal mais relevante para estágio.  |
| `churn`         | 0.20 | Linhas adicionadas + removidas; indicador secundário.          |

| Nível        | Composite score |
|--------------|-----------------|
| `abaixo`     | < 0.20          |
| `atendendo`  | 0.20 – 0.70     |
| `acima`      | 0.70 – 0.90     |
| `muito_acima`| ≥ 0.90          |

### Limitações conhecidas
- Mede **atividade no GitHub** — estudo, pareamento e aprendizado recebido não são capturados.
- Quase todo estágio começa com `small_sample: true` (histórico curto); os níveis são menos estáveis no início.

---

*Documento gerado para o projeto dev-telemetry. Última revisão: junho de 2026.*
