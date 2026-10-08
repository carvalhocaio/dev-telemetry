# Daily Reports & Activity Timeline Pivot Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Pivot `dev-telemetry` from an evaluative performance/seniority rubric tool into an executive daily activity timeline and AI report generator ("Gerar Daily" & "Gerar Report"), with Melodrama editorial typography and sharp-cornered Lyra preset.

**Architecture:** Database purged of rubrics/profiles. Core layer provides daily aggregation of commits and pull requests with churn and repository grouping. AI layer crafts concise executive bullet-point reports by project. Next.js dashboard features an interactive daily timeline with inline "Gerar Daily" modals and range-based "Gerar Report".

**Tech Stack:** Next.js 16 (App Router), React 19, Tailwind CSS v4, Elysia + Eden Treaty, Drizzle ORM + Neon PostgreSQL, Vercel AI SDK, Fontshare Melodrama, Google Fonts Pathway Extreme, Lucide React.

**Spec:** `docs/superpowers/specs/2026-10-08-daily-reports-pivot-design.md`

## Global Constraints
- Remove all traces of `user_profile` table, rubrics markdown files, and performance grading (`muito_acima`, `acima`, `atendendo`, `abaixo`).
- Styling adheres to Shadcn Lyra (Zinc + Yellow accent + `radius: 0`).
- Melodrama font used for executive headings and report titles.
- Pathway Extreme used for UI and report body text.
- Full typecheck and tests must pass after changes.

---

### Task 1: Database & Core Clean-up (Purge Profiles and Evaluative Rubrics)

**Files:**
- Modify: `packages/db/src/schema.ts`
- Modify: `packages/core/src/index.ts`
- Modify: `packages/core/src/types.ts`
- Delete: `packages/core/src/classifier.ts`
- Delete: `packages/core/src/classifier.test.ts`
- Delete: `packages/core/src/profile.ts`
- Delete: `docs/profiles/*.md`
- Delete: `apps/web/app/profile/[key]/page.tsx`
- Delete: `apps/web/server/profiles.ts`

- [ ] **Step 1: Remove `userProfile` from Drizzle schema**
Remove `userProfile` definition and its relations from `packages/db/src/schema.ts`.
- [ ] **Step 2: Drop `user_profile` table from Neon DB**
Execute `DROP TABLE IF EXISTS user_profile CASCADE;` via sql client.
- [ ] **Step 3: Remove rubric files**
Delete `docs/profiles/*.md`.
- [ ] **Step 4: Remove profile and classifier modules in `packages/core`**
Remove `classifier.ts`, `classifier.test.ts`, `profile.ts` and update `packages/core/src/index.ts`.
- [ ] **Step 5: Remove `/profile/[key]` page and `profiles.ts` Elysia router**
Delete `apps/web/app/profile/[key]/page.tsx` and `apps/web/server/profiles.ts`.
- [ ] **Step 6: Run typecheck to verify clean dependencies**
Run `bun run typecheck`.

---

### Task 2: Core Activity Aggregator (`@dev-telemetry/core`)

**Files:**
- Create: `packages/core/src/daily-activity.ts`
- Create: `packages/core/src/daily-activity.test.ts`
- Modify: `packages/core/src/index.ts`
- Modify: `packages/core/src/types.ts`

**Interfaces:**
- Produces: `getDailyActivity({ db, userId, start, end, scope, githubLogin }) -> Promise<DailyActivityReport>`
- Types:
  ```ts
  export interface DailyCommitItem {
    sha: string;
    message: string;
    repoName: string;
    additions: number;
    deletions: number;
    authoredAt: string;
    htmlUrl: string;
  }
  export interface DailyPrItem {
    number: number;
    title: string;
    repoName: string;
    state: string;
    htmlUrl: string;
    ghCreatedAt: string;
    ghMergedAt: string | null;
  }
  export interface DailyActivityDay {
    date: string; // YYYY-MM-DD
    commitsCount: number;
    prsCreated: number;
    prsMerged: number;
    churn: number;
    repositories: string[];
    commits: DailyCommitItem[];
    prs: DailyPrItem[];
  }
  export interface DailyActivityReport {
    days: DailyActivityDay[];
    totals: {
      daysCount: number;
      commitsCount: number;
      prsCreated: number;
      prsMerged: number;
      churn: number;
      repositories: string[];
    };
  }
  ```

- [ ] **Step 1: Write test for `getDailyActivity`**
Test grouping of commits and PRs by date, calculation of churn (`additions + deletions`), PR created vs merged counts, and repository list.
- [ ] **Step 2: Implement `getDailyActivity`**
Implement database query joining `commit`, `pull_request`, and `repository` by date, ordered newest first.
- [ ] **Step 3: Run tests**
Run `bun test packages/core/src/daily-activity.test.ts` to verify passing.
- [ ] **Step 4: Export from `packages/core/src/index.ts`**

---

### Task 3: AI Daily & Executive Report Generation (`@dev-telemetry/ai`)

**Files:**
- Modify: `packages/ai/src/schema.ts`
- Modify: `packages/ai/src/narrative.ts`
- Modify: `packages/ai/src/index.ts`
- Modify: `packages/ai/src/index.test.ts`

**Interfaces:**
- Input:
  ```ts
  export interface GenerateExecutiveReportInput {
    provider: LlmProvider;
    model: string;
    apiKey: string;
    startDate: string; // YYYY-MM-DD
    endDate: string;   // YYYY-MM-DD
    commits: Array<{ message: string; repo: string; additions: number; deletions: number; date: string }>;
    prs: Array<{ title: string; repo: string; state: string; date: string }>;
  }
  ```
- Output:
  ```ts
  export interface ExecutiveReport {
    title: string; // e.g. "Report de Atividades — 08/10/2026"
    summary: string; // concise 1-2 sentence executive overview
    projects: Array<{
      name: string; // e.g. "Scheffer Arquivista"
      repo: string; // e.g. "scheffer-arquivista"
      highlights: string[]; // concrete bullet points
    }>;
    markdownText: string; // fully formatted markdown ready to copy/send
  }
  ```

- [ ] **Step 1: Update schema and prompt in `@dev-telemetry/ai`**
Replace narrative schema with `ExecutiveReportSchema` and craft the system prompt focused on managerial reporting grouped by project.
- [ ] **Step 2: Update unit tests in `packages/ai/src/index.test.ts`**
Run and verify `bun test packages/ai/src/index.test.ts`.

---

### Task 4: API Routes (`apps/web/server`)

**Files:**
- Modify: `apps/web/server/reports.ts`
- Modify: `apps/web/server/app.ts`

**Interfaces:**
- `GET /api/activity/daily?start=&end=&scope=` -> returns `DailyActivityReport`
- `POST /api/reports/generate` -> body `{ startDate, endDate, scope }` -> returns `ExecutiveReport`

- [ ] **Step 1: Implement `GET /api/activity/daily`**
Connects to `getDailyActivity` from `@dev-telemetry/core`.
- [ ] **Step 2: Implement `POST /api/reports/generate`**
Fetches the activity for the given date/range, decrypts user LLM key, and calls `generateExecutiveReport`.
- [ ] **Step 3: Update `apps/web/server/app.ts`**
Register updated routes and remove obsolete profile routes.

---

### Task 5: Design Tokens & Typography (Melodrama + Lyra Preset)

**Files:**
- Modify: `apps/web/app/layout.tsx`
- Modify: `apps/web/app/globals.css`

- [ ] **Step 1: Import Melodrama and Pathway Extreme fonts**
Add Fontshare Melodrama webfont and Google Font Pathway Extreme in `apps/web/app/layout.tsx` or `globals.css` with font variables `--font-melodrama` and `--font-pathway`.
- [ ] **Step 2: Apply Shadcn Lyra theme tokens (Zinc, Yellow accent, `radius: 0`)**
Update `apps/web/app/globals.css` with the verified OKLCH color tokens, setting `--radius: 0` for sharp precision borders.

---

### Task 6: UI — Activity Timeline & Daily Report Modal

**Files:**
- Create: `apps/web/components/dashboard/DailyTimeline.tsx`
- Create: `apps/web/components/dashboard/DailyReportModal.tsx`
- Create: `apps/web/components/dashboard/GenerateReportButton.tsx`
- Modify: `apps/web/components/Dashboard.tsx`
- Modify: `apps/web/components/DashboardHeader.tsx`
- Modify: `apps/web/components/layout/NavBar.tsx`

- [ ] **Step 1: Build `DailyReportModal`**
Modal displaying the generated report in Melodrama-styled typography with Markdown preview, copy-to-clipboard button, and regeneration trigger.
- [ ] **Step 2: Build `DailyTimeline`**
Table/list view displaying days:
`DD/MM/YYYY • X commits • Y PRs (A criados, B mergeados) • Z churn` + repository tags + inline button "Gerar Daily" + expandable commit/PR details.
- [ ] **Step 3: Build `GenerateReportButton`**
Header button to trigger custom range reports (e.g. weekly/sprint summaries).
- [ ] **Step 4: Update `Dashboard.tsx` and Navigation**
Remove old evaluative score components (PitWallChart, MetricHero, Level badges) and integrate `DailyTimeline` and `GenerateReportButton`. Remove "Perfis" link from `NavBar.tsx`.

---

### Task 7: Full Verification & E2E Validation

- [ ] **Step 1: Run project typecheck across all packages**
Run `bun run typecheck`.
- [ ] **Step 2: Run test suite**
Run `bun run --cwd apps/web test` and `bun test packages/core/src/daily-activity.test.ts`.
- [ ] **Step 3: Verify dev server endpoints**
Test `GET /api/activity/daily` and `POST /api/reports/generate` on the running instance.
