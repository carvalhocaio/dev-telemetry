# Engenheiro de Software Júnior no Mercado Brasileiro
## Documento de Referência — dev-telemetry

> **Uso:** este documento serve duas finalidades:
> 1. **Auditoria humana** — base factual para justificar nível de desempenho em revisões.
> 2. **Contexto LLM** — injetado no modelo como rubrica de mercado ao gerar narrativas interpretativas.
>
> O classificador determinístico do sistema é dono do nível numérico. Este documento define o *significado* de cada nível em termos de mercado.

---

## 1. O que é um Engenheiro de Software Júnior no Brasil

Um júnior em engenharia de software entrega funcionalidades bem definidas com supervisão moderada. Já domina o fluxo de desenvolvimento (Git, PR, testes, CI) e começa a assumir responsabilidade por pequenas partes do produto. A distinção em relação ao estágio é a **autonomia em tarefas delimitadas** e a responsabilidade por código em produção.

No mercado brasileiro de 2025–2026, o perfil júnior típico carrega:

- **0 a 2 anos** de experiência profissional.
- Domínio de pelo menos uma linguagem e um framework (React, Node, Spring, Django, etc.).
- Git com PRs e participação ativa em code review.
- Noções de testes automatizados e leitura de logs/debugging.
- Capacidade de quebrar uma tarefa pequena em passos.

---

## 2. Stack Esperada

### Core obrigatório
- **Linguagem + framework principal** do time (ex.: TypeScript/React, Java/Spring, Python/Django).
- **Git:** PRs pequenos, resolução de conflitos simples, code review como autor.
- **Testes:** escrita de testes unitários para o próprio código.
- **APIs:** consumo de REST, noções de HTTP e autenticação.

### Em desenvolvimento
- Banco de dados (SQL básico, ORM).
- CI/CD (entender o pipeline do time).
- Boas práticas: SOLID básico, código legível, tratamento de erros.

---

## 3. Faixa Salarial de Referência (Brasil, 2025)

| Nível         | CLT (mensal)          | PJ (mensal)           |
|---------------|-----------------------|-----------------------|
| **Júnior**    | **R$ 3.500 – R$ 7.000** | **R$ 5.000 – R$ 9.000** |
| Pleno         | R$ 8.000 – R$ 14.000  | R$ 11.000 – R$ 18.000 |
| Sênior        | R$ 14.000 – R$ 24.000 | R$ 18.000 – R$ 32.000 |

> Fontes de referência: Glassdoor Brasil, levels.fyi, pesquisas salariais de comunidades de tecnologia.

---

## 4. O que o Mercado Mede (além de código)

O mercado avalia juniores por **confiabilidade em tarefas delimitadas e ritmo de aprendizado**:

1. **Consistência:** entregas regulares dentro do escopo definido.
2. **Qualidade básica:** código testado, legível, alinhado aos padrões do time.
3. **Crescimento:** evolução do tipo de tarefa que consegue assumir sem ajuda.
4. **Colaboração:** responde bem a reviews, ajuda a documentar, pergunta no momento certo.
5. **Cuidado:** PRs pequenos, mensagens de commit claras.

> **Nota sobre métricas de atividade:** regularidade e qualidade pesam mais que volume. Um júnior consistente, com PRs revisáveis, sinaliza mais maturidade que picos de commits.

---

## 5. Rubrica de Níveis de Desempenho

Os limites numéricos são determinados pelo classificador determinístico (percentis auto-referentes). Os descritivos abaixo definem o *significado qualitativo* de cada nível.

---

### 🔴 Abaixo (`abaixo`)

**Perfil típico:** atividade abaixo da própria linha de base.

**Indicadores:**
- Poucas entregas no período.
- Commits escassos, PRs sem descrição ou ausentes.

**Contexto:** pode refletir onboarding, bloqueio técnico, ou período de estudo. O importante é retomar cadência e comunicar dificuldades.

---

### 🟡 Atendendo (`atendendo`)

**Perfil típico:** atividade dentro do esperado para um júnior em ritmo normal.

**Indicadores:**
- Cadência regular de commits com mensagens descritivas.
- PRs pequenos, abertos e mergeados com contexto.
- Correções e features incrementais bem definidas.

**Contexto:** patamar saudável e esperado. Entregar tarefas delimitadas de forma confiável é o contrato do nível.

---

### 🟢 Acima (`acima`)

**Perfil típico:** atividade acima da linha de base, com autonomia crescente.

**Indicadores:**
- Volume de entrega superior ao histórico pessoal.
- PRs com mais contexto técnico e cuidado com testes.
- Tarefas de complexidade um pouco maior, com menos supervisão.
- Proatividade: identificar e corrigir pequenos problemas.

**Contexto:** sinaliza prontidão crescente para escopo maior — caminho para o pleno.

---

### 🏆 Muito Acima (`muito_acima`)

**Perfil típico:** período de entrega excepcional para o nível.

**Indicadores:**
- Volume entre os maiores do histórico pessoal.
- Uma feature completa entregue com pouca ajuda, ou um bug complexo resolvido.
- Commits e PRs que demonstram compreensão crescente da arquitetura.

**Contexto:** picos recorrentes com qualidade são o sinal mais claro de evolução para pleno.

---

## 6. Sobre o Sistema de Classificação

O classificador usa **percentis auto-referentes** — cada período é comparado apenas contra o próprio histórico.

| Componente      | Peso | Justificativa                                                  |
|-----------------|------|----------------------------------------------------------------|
| `throughput`    | 0.45 | Combinação de commits + PRs; melhor proxy de entrega real.    |
| `active_days`   | 0.35 | Consistência temporal — muito relevante para juniores.        |
| `churn`         | 0.20 | Linhas adicionadas + removidas; indicador secundário.          |

| Nível        | Composite score |
|--------------|-----------------|
| `abaixo`     | < 0.20          |
| `atendendo`  | 0.20 – 0.70     |
| `acima`      | 0.70 – 0.90     |
| `muito_acima`| ≥ 0.90          |

### Limitações conhecidas
- Mede **atividade no GitHub** — pareamento, reuniões e aprendizado recebido não são capturados.
- Períodos com menos de 8 semanas/meses têm `small_sample: true` no meta do report.

---

*Documento gerado para o projeto dev-telemetry. Última revisão: junho de 2026.*
