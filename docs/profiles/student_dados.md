# Estudante de Dados no Mercado Brasileiro
## Documento de Referência — dev-telemetry

> **Uso:** este documento serve duas finalidades:
> 1. **Auto-acompanhamento** — base factual para o estudante medir sua própria evolução.
> 2. **Contexto LLM** — injetado no modelo como rubrica de mercado ao gerar narrativas interpretativas.
>
> O classificador determinístico do sistema é dono do nível numérico. Este documento define o *significado* de cada nível em termos de aprendizado.

---

## 1. O que é um Estudante de Dados

Um estudante de dados está construindo fundamentos para uma futura carreira em engenharia/ciência de dados. O contexto não é o de uma empresa, mas o de **projetos pessoais, cursos, desafios e portfólio**. O objetivo não é produzir como um profissional, mas **desenvolver hábitos de aprendizado consistentes** e construir evidências de competência.

Perfil típico:

- Cursando graduação, bootcamp ou estudo autodidata em dados.
- Aprendendo Python, SQL e fundamentos de estatística/análise.
- Construindo projetos de portfólio (análises, pipelines simples, dashboards).
- Praticando com datasets públicos (Kaggle, dados abertos do governo).

---

## 2. O que Estudar (trilha de referência)

### Fundamentos
- **Python:** manipulação de dados com pandas, scripts, organização de código.
- **SQL:** consultas, joins, agregações, modelagem básica.
- **Git:** versionamento dos próprios projetos, commits regulares, README.

### Próximos passos
- **Visualização:** matplotlib/seaborn, ou ferramentas de BI.
- **Pipelines:** noções de ETL, agendamento simples.
- **Cloud:** primeiro contato com um provedor (free tier).
- **Estatística e ML:** fundamentos para análise e modelos simples.

---

## 3. O que Sinaliza Progresso (além de código)

Para um estudante, o que importa é **consistência e evidência de aprendizado**:

1. **Regularidade:** commits frequentes ao longo das semanas, não apenas em véspera de prazo.
2. **Projetos completos:** análises e pipelines levados do início ao fim, com README.
3. **Qualidade crescente:** código mais limpo e organizado com o tempo.
4. **Portfólio público:** repositórios que demonstram a trajetória de aprendizado.
5. **Documentação:** explicar o que foi feito e por quê — habilidade muito valorizada no mercado de dados.

> **Nota sobre métricas de atividade:** para um estudante, o sistema mede o **hábito de praticar**. A consistência (dias ativos, commits regulares) é um proxy muito mais útil que o volume bruto. Um commit por dia vale mais que 50 commits num fim de semana e silêncio por um mês.

---

## 4. Rubrica de Níveis de Desempenho

Os limites numéricos são determinados pelo classificador determinístico (percentis auto-referentes). Os descritivos abaixo definem o *significado qualitativo* de cada nível **no contexto de estudo**.

---

### 🔴 Abaixo (`abaixo`)

**Perfil típico:** atividade de estudo abaixo da própria linha de base.

**Indicadores:**
- Poucos ou nenhum commit no período.
- Projetos parados.

**Contexto:** normal em períodos de provas, férias ou desânimo. O importante é retomar o hábito — mesmo com pequenas sessões diárias.

---

### 🟡 Atendendo (`atendendo`)

**Perfil típico:** ritmo de estudo regular e saudável.

**Indicadores:**
- Commits regulares em projetos de aprendizado.
- Pequenos avanços consistentes: uma análise, um script, um notebook.

**Contexto:** este é o patamar ideal de um estudante constante. Manter o hábito é mais importante que a intensidade.

---

### 🟢 Acima (`acima`)

**Perfil típico:** ritmo de estudo acima da própria média, com projetos ganhando forma.

**Indicadores:**
- Volume de atividade superior ao histórico pessoal.
- Projetos mais completos: pipeline funcional, análise documentada.
- Commits com mensagens mais claras e estrutura melhor.

**Contexto:** o estudante está acelerando e construindo portfólio de qualidade — ótimo sinal de prontidão para estágio.

---

### 🏆 Muito Acima (`muito_acima`)

**Perfil típico:** período de aprendizado excepcional.

**Indicadores:**
- Atividade entre as maiores do histórico pessoal.
- Um projeto ambicioso entregue do início ao fim.
- Evidência de domínio crescente: código organizado, README rico, decisões explicadas.

**Contexto:** picos assim, especialmente quando geram projetos de portfólio sólidos, são o que diferencia candidatos a estágio. Buscar consistência, não só intensidade.

---

## 5. Sobre o Sistema de Classificação

O classificador usa **percentis auto-referentes** — cada período é comparado apenas contra o próprio histórico do estudante.

| Componente      | Peso | Justificativa                                                  |
|-----------------|------|----------------------------------------------------------------|
| `throughput`    | 0.45 | Commits + PRs; proxy de atividade de estudo.                  |
| `active_days`   | 0.35 | Consistência — o indicador mais importante para estudantes.   |
| `churn`         | 0.20 | Linhas adicionadas + removidas; indicador secundário.          |

| Nível        | Composite score |
|--------------|-----------------|
| `abaixo`     | < 0.20          |
| `atendendo`  | 0.20 – 0.70     |
| `acima`      | 0.70 – 0.90     |
| `muito_acima`| ≥ 0.90          |

### Limitações conhecidas
- Mede **atividade no GitHub** — cursos, leitura, exercícios fora do Git e estudo teórico não são capturados.
- Quase todo estudante começa com `small_sample: true` (histórico curto).

---

*Documento gerado para o projeto dev-telemetry. Última revisão: junho de 2026.*
