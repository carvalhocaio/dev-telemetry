# Engenheiro de Dados Pleno no Mercado Brasileiro
## Documento de Referência — dev-telemetry

> **Uso:** este documento serve duas finalidades:
> 1. **Auditoria humana** — base factual para justificar nível de desempenho em revisões e promoções.
> 2. **Contexto LLM** — injetado no Gemini como rubrica de mercado ao gerar narrativas interpretativas.
>
> O classificador determinístico do sistema é dono do nível numérico. Este documento define o *significado* de cada nível em termos de mercado.

---

## 1. O que é um Engenheiro de Dados Pleno no Brasil

Um profissional pleno no contexto brasileiro de engenharia de dados opera com autonomia em tarefas definidas, resolve problemas técnicos sem supervisão constante e começa a tomar decisões de design. A distinção prática em relação ao júnior é a capacidade de **entregar pipelines de ponta a ponta com qualidade de produção**, não apenas implementar partes de sistemas já desenhados.

No mercado brasileiro de 2025–2026, o perfil pleno típico carrega:

- **2 a 5 anos** de experiência relevante em dados ou engenharia de software.
- Domínio de pelo menos uma linguagem principal (Python ou Scala/Java) e SQL avançado.
- Experiência com orquestração de pipelines (Airflow, Prefect, ou equivalente).
- Familiaridade com arquiteturas de dados modernas: lakehouse, data mesh, CDC.
- Capacidade de trabalhar próximo à infraestrutura (cloud, contêineres, IaC básico).
- Comunicação com stakeholders de negócio sem intermediários.

---

## 2. Stack Esperada

### Core obrigatório
- **Linguagens:** Python (principal), SQL avançado (window functions, CTEs, otimização de queries).
- **Orquestração:** Apache Airflow, Prefect, ou Dagster.
- **Armazenamento:** S3/GCS/ADLS, Delta Lake, Apache Iceberg, ou Hudi.
- **Processamento:** Apache Spark (PySpark) ou dbt para transformações.
- **Controle de versão:** Git com práticas de PR e code review.

### Cada vez mais esperado (2025–2026)
- **Streaming:** Kafka, Kinesis, ou Flink para pipelines em tempo real.
- **Qualidade de dados:** Great Expectations, Soda, ou validações customizadas.
- **Observabilidade:** Monte Carlo, dbt tests, ou alertas em pipelines.
- **LLMs e agentes de IA:** integração de modelos de linguagem em pipelines ou ferramentas internas — competência diferenciadora em aceleração.

### Cloud
O mercado brasileiro concentra-se em:
- **AWS** (dominante, especialmente em fintechs e e-commerce).
- **GCP** (crescente, especialmente BigQuery como DWH).
- **Azure** (predominante em enterprises e setor público).

---

## 3. Faixa Salarial de Referência (Brasil, 2025)

| Nível         | CLT (mensal)          | PJ (mensal)           |
|---------------|-----------------------|-----------------------|
| Júnior        | R$ 4.000 – R$ 7.000   | R$ 5.000 – R$ 9.000   |
| **Pleno**     | **R$ 9.000 – R$ 15.000** | **R$ 12.000 – R$ 20.000** |
| Sênior        | R$ 15.000 – R$ 25.000 | R$ 20.000 – R$ 35.000 |

> Fontes de referência: State of Data Brazil 2024, Glassdoor Brasil, pesquisas salariais Nubank/iFood (publicadas), levantamentos de comunidades como Data Hackers.

---

## 4. O que o Mercado Mede (além de código)

O mercado brasileiro avalia plenos não apenas por linhas de código ou PRs mergeados, mas por:

1. **Impacto nos dados da empresa:** pipelines que chegam à produção e geram confiança nos dados.
2. **Qualidade técnica:** código testável, documentado, com tratamento de erros.
3. **Consistência:** entregas regulares, não apenas sprints brilhantes seguidos de sumiço.
4. **Evolução de escopo:** capacidade crescente de resolver problemas mais complexos.
5. **Colaboração:** code reviews, documentação, suporte a colegas.

> **Nota sobre métricas de atividade:** commits e PRs medem *atividade*, não *impacto*. Um pipeline crítico entregue com 10 commits cuidadosos vale mais que 50 commits de ajustes cosméticos. O sistema de classificação usa atividade como proxy — auditável, objetivo — mas o contexto qualitativo (o que as mensagens de commit descrevem) importa tanto quanto o volume.

---

## 5. Rubrica de Níveis de Desempenho

Esta rubrica define os quatro níveis usados pelo classificador e pelo sistema de narrativa. Os limites numéricos são determinados pelo classificador determinístico (percentis auto-referentes). Os descritivos abaixo definem o *significado qualitativo* de cada nível.

---

### 🔴 Abaixo (`abaixo`)

**Perfil típico:** atividade significativamente abaixo da própria linha de base histórica.

**Indicadores:**
- Poucas ou nenhuma entrega significativa no período.
- Commits escassos com mensagens vagas ou sem contexto.
- Ausência de PRs ou PRs sem descrição.
- Nenhum sinal de evolução técnica no conteúdo descrito.

**Contexto:** pode refletir período de férias, doença, bloqueio técnico, ou fase de planejamento sem entregas concretas. A rubrica não julga causas — apenas registra o padrão de atividade relativo ao histórico pessoal.

**O que um pleno em recuperação faria:** retomar cadência, comunicar bloqueios, entregar ao menos tarefas menores para manter visibilidade.

---

### 🟡 Atendendo (`atendendo`)

**Perfil típico:** atividade dentro do esperado para um pleno operando em regime normal.

**Indicadores:**
- Cadência regular de commits com mensagens descritivas.
- PRs abertos e mergeados com contexto (título + descrição mínima).
- Trabalho em tarefas de complexidade moderada: correções, features incrementais, manutenção de pipelines.
- Ausência de grandes avanços ou grandes regressões.

**Contexto:** este é o patamar sustentável do dia a dia profissional — não é medíocre, é confiável. Um pleno que opera consistentemente aqui está cumprindo o contrato com o mercado.

**O que diferencia do Acima:** a ausência de entregas de impacto mais alto, refatorações estruturais, ou trabalho que demonstre crescimento de escopo.

---

### 🟢 Acima (`acima`)

**Perfil típico:** atividade acima da linha de base, com sinais de qualidade e escopo ampliado.

**Indicadores:**
- Volume de entrega consistentemente superior ao histórico pessoal.
- Commits e PRs com descrições detalhadas, contexto técnico, motivação das decisões.
- Trabalho em features de maior complexidade: integrações novas, refatorações de arquitetura, pipelines de streaming, ou desenvolvimento de agentes.
- Evidências de proatividade: identificação e resolução de problemas sem que sejam solicitados.

**Contexto:** um profissional neste nível está operando acima das expectativas do cargo atual, sinalizando prontidão para responsabilidades maiores.

**O que diferencia do Muito Acima:** a ausência de pico excepcional — a performance é boa e consistente, mas não representa ruptura de patamar.

---

### 🏆 Muito Acima (`muito_acima`)

**Perfil típico:** semana ou mês de entrega excepcional, significativamente acima do próprio histórico.

**Indicadores:**
- Volume de atividade entre os maiores do histórico pessoal.
- Trabalho em iniciativas de alto impacto: arquiteturas novas, sistemas completos, soluções para problemas críticos de dados.
- Mensagens de commit e descrições de PR que evidenciam profundidade técnica: decisões arquiteturais explicadas, trade-offs documentados, bugs complexos diagnosticados.
- Múltiplas entregas simultâneas ou uma entrega de escopo excepcionalmente amplo.

**Contexto:** este nível não deve ser sustentável toda semana — por definição, é um pico em relação ao próprio histórico. A recorrência de picos é o que sinaliza evolução para sênior.

**Sinal de alerta:** se `muito_acima` aparece com frequência crescente sem que o nível médio suba, pode indicar que a linha de base está subavaliada (histórico de atividade baixa nos períodos iniciais de coleta).

---

## 6. Sobre o Sistema de Classificação

### Metodologia
O classificador usa **percentis auto-referentes** — cada período é comparado apenas contra o próprio histórico do profissional, não contra o mercado externo. Isso é intencional:

- Elimina viés de senioridade (um júnior que cresce muito pode atingir `muito_acima` mesmo com volume absoluto menor que um sênior em ritmo normal).
- Foca em **evolução relativa**, não em benchmarks absolutos.
- Torna o sistema auditável: os números são reproduzíveis com os mesmos dados.

### Pesos dos componentes
| Componente      | Peso | Justificativa                                                                 |
|-----------------|------|-------------------------------------------------------------------------------|
| `throughput`    | 0.45 | Combinação de commits + PRs; melhor proxy de entrega real.                   |
| `active_days`   | 0.35 | Consistência temporal; evita que um dia de spam inflacione o período.        |
| `churn`         | 0.20 | Linhas adicionadas + removidas; indicador secundário; peso baixo intencional. |

> O peso baixo de `churn` é deliberado: é a métrica mais fácil de inflar (commits de formatação, geração de código) e a menos correlacionada com impacto real.

### Cortes de nível (percentis)
| Nível        | Intervalo de composite score |
|--------------|------------------------------|
| `abaixo`     | < 0.20                       |
| `atendendo`  | 0.20 – 0.70                  |
| `acima`      | 0.70 – 0.90                  |
| `muito_acima`| ≥ 0.90                       |

Os cortes são **assimétricos por design**: a banda `atendendo` é larga (50 pontos percentuais) porque a maioria dos períodos de um profissional consistente deve cair aqui. Isso evita que o sistema infle artificialmente os níveis superiores.

### Limitações conhecidas
- Mede **atividade no GitHub da organização** — trabalho em reuniões, design de sistemas, mentoria, e documentação fora do código não é capturado.
- Commits e PRs medem o que foi registrado, não necessariamente o que foi entregue (deploy, produção).
- Períodos com menos de 8 semanas/meses têm `small_sample: true` no meta do report — os níveis são menos estáveis.
- O sistema mede apenas a própria atividade do usuário autenticado nos repositórios da organização configurada.

---

## 7. Referências

- **State of Data Brazil 2024** — pesquisa anual da comunidade Data Hackers com Bain & Company sobre o mercado de dados no Brasil.
- **GitClear 2025: AI-Assisted Coding** — relatório sobre impacto de ferramentas de IA em métricas de código (churn, qualidade); contexto para interpretar métricas de adição/remoção de linhas.
- **Framework de carreira Nubank** (publicado parcialmente) — referência de critérios de progressão em empresas de tecnologia de referência no Brasil.
- **Glassdoor Brasil / levels.fyi** — faixas salariais de referência.

---

*Documento gerado para o projeto dev-telemetry. Última revisão: junho de 2026.*
*Para atualizar: edite este arquivo e versione via Git. O sistema LLM lerá a versão mais recente.*
