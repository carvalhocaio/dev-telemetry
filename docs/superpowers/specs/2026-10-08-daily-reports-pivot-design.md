# Design Spec: Daily Reports & Activity Timeline Pivot

## Overview
Transform `dev-telemetry` from an evaluative performance/rubric dashboard into an executive daily activity timeline and report generator ("Gerar Daily" & "Gerar Report").

## Key Requirements

1. **Purge of Rubrics & Performance Grading:**
   - Remove `user_profile` table from Drizzle schema and drop it from the Neon database.
   - Delete `docs/profiles/*.md` (9 rubric files).
   - Remove `packages/core/src/profile.ts`, `classifier.ts`, `classifier.test.ts`, and references to levels (`muito_acima`, `acima`, `atendendo`, `abaixo`).
   - Remove `/profile/[key]` route from `apps/web`.

2. **Activity Timeline Data Layer:**
   - Agrupamento diário de commits e pull requests (`commit`, `pull_request`, `repository`).
   - Métricas por dia:
     - `date`: formato `YYYY-MM-DD`
     - `commitsCount`: número de commits no dia
     - `prsCreated`: PRs criados no dia (`ghCreatedAt`)
     - `prsMerged`: PRs mergeados no dia (`ghMergedAt`)
     - `churn`: total de linhas alteradas (`additions + deletions`)
     - `repositories`: lista com nomes dos repositórios envolvidos
     - `commits`: lista de commits do dia (sha, message, repo, additions, deletions)
     - `prs`: lista de PRs do dia (number, title, repo, state)

3. **AI Daily & Executive Report Generation (`@dev-telemetry/ai`):**
   - Novo schema e prompt com tom editorial, executivo e técnico.
   - Agrupado por projeto/repositório com numeração (`1. Nome do Projeto (repo)`).
   - Bullet points com entregas técnicas concretas, impactos, integrações e testes.
   - Descarte de mensagens banais (merge commits sem contexto, typos, etc.).

4. **API Endpoints (`apps/web/server`):**
   - `GET /api/activity/daily?start=&end=&scope=`: lista os dias agrupados com suas métricas e detalhes.
   - `POST /api/reports/generate`: payload `{ startDate, endDate, scope }`, gera o relatório executivo via LLM.

5. **UI & Design System:**
   - Preset Shadcn: **Lyra** com base **Zinc**, acento **Yellow**, `radius: 0` (sharp edges).
   - Tipografia:
     - **Melodrama** (Fontshare) para títulos principais (`h1`, `h2`), modal de relatórios e headers editoriais.
     - **Pathway Extreme** para corpo de texto, tabelas e interface.
     - **Geist Mono** para métricas, números e hashes.
   - Tela Principal (`/dashboard`):
     - Barra de topo com escopo e botão global **"Gerar Report"** (para seleção de período).
     - Tabela/Lista diária de atividades:
       - Coluna de Data (`08/10/2026`)
       - Indicadores: commits, PRs (criados / mergeados), churn
       - Badges dos repositórios
       - Botão de ação por linha: **"Gerar Daily"** (abre modal/drawer com o texto gerado daquele dia)
       - Accordion / expansão de linha para inspecionar commits e PRs do dia.
     - Modal de Report/Daily:
       - Título no estilo editorial (com fonte Melodrama): "Report de Atividades — DD/MM"
       - Visualização Markdown do relatório gerado
       - Botão de ação rápida **"Copiar para o Clipboard"** com feedback
       - Opção de regenerar.
