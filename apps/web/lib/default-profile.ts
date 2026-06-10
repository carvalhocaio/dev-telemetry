/**
 * Default market profile for Phase 1.
 * Phase 2 will introduce a profile CRUD system; for now this is the
 * embedded reference rubric used as context for narrative generation.
 */
export const DEFAULT_PROFILE = `# Engenheiro de Dados Pleno no Mercado Brasileiro
## Documento de Referência — dev-telemetry

> O classificador determinístico do sistema é dono do nível numérico.
> Este documento define o *significado* de cada nível em termos de mercado.

---

## 1. O que é um Engenheiro de Dados Pleno no Brasil

Um profissional pleno no contexto brasileiro de engenharia de dados opera com autonomia em tarefas definidas, resolve problemas técnicos sem supervisão constante e começa a tomar decisões de design. A distinção prática em relação ao júnior é a capacidade de **entregar pipelines de ponta a ponta com qualidade de produção**.

No mercado brasileiro de 2025–2026:
- **2 a 5 anos** de experiência relevante.
- Domínio de Python ou Scala/Java e SQL avançado.
- Experiência com orquestração (Airflow, Prefect, Dagster).
- Familiaridade com arquiteturas modernas: lakehouse, data mesh, CDC.
- Comunicação com stakeholders sem intermediários.

---

## 2. O que o Mercado Mede

1. **Impacto nos dados da empresa:** pipelines que chegam à produção.
2. **Qualidade técnica:** código testável, documentado, com tratamento de erros.
3. **Consistência:** entregas regulares, não apenas sprints brilhantes.
4. **Evolução de escopo:** capacidade crescente de resolver problemas complexos.
5. **Colaboração:** code reviews, documentação, suporte a colegas.

---

## 3. Rubrica de Níveis de Desempenho

### Abaixo (\`abaixo\`)
Atividade significativamente abaixo da própria linha de base histórica.
- Poucas ou nenhuma entrega significativa.
- Commits escassos com mensagens vagas.
- Ausência de PRs ou PRs sem descrição.

### Atendendo (\`atendendo\`)
Atividade dentro do esperado para um pleno em regime normal.
- Cadência regular de commits com mensagens descritivas.
- PRs abertos e mergeados com contexto.
- Trabalho em tarefas de complexidade moderada.

### Acima (\`acima\`)
Atividade acima da linha de base, com sinais de qualidade e escopo ampliado.
- Volume de entrega consistentemente superior ao histórico pessoal.
- Commits e PRs com descrições detalhadas e contexto técnico.
- Features de maior complexidade: integrações, refatorações arquiteturais.

### Muito Acima (\`muito_acima\`)
Entrega excepcional, significativamente acima do próprio histórico.
- Volume de atividade entre os maiores do histórico pessoal.
- Trabalho em iniciativas de alto impacto.
- Mensagens que evidenciam profundidade técnica e decisões arquiteturais.

---

## 4. Metodologia do Classificador

O classificador usa **percentis auto-referentes** — cada período é comparado apenas contra o próprio histórico.

| Componente    | Peso | Justificativa                                    |
|---------------|------|--------------------------------------------------|
| throughput    | 0.45 | commits + PRs; melhor proxy de entrega real     |
| active_days   | 0.35 | consistência temporal                            |
| churn         | 0.20 | linhas adicionadas + removidas (peso baixo)      |

| Nível        | Composite score |
|--------------|-----------------|
| abaixo       | < 0.20          |
| atendendo    | 0.20 – 0.70     |
| acima        | 0.70 – 0.90     |
| muito_acima  | ≥ 0.90          |
`;
