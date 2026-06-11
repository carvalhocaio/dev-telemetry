# Architecture

This document describes the technical architecture of dev-telemetry: how data
flows through the system, why the major technology choices were made, and how
the core subsystems (ingestion, classification, narrative generation, and
security) work.

## 1. Overview

dev-telemetry is a single Next.js application that embeds its own API. GitHub
activity is ingested, persisted to PostgreSQL, transformed into metrics,
classified against the user's own history, and finally summarized by an LLM.

```
GitHub API → Octokit Ingestion → PostgreSQL
                                     ↓
                           @dev-telemetry/core
                     (metrics · classification · reporting)
                                     ↓
                           @dev-telemetry/ai
                     (narrative generation · multi-LLM)
                                     ↓
                        Next.js + Elysia API → React UI
```

The frontend and backend live in the same process. React Server Components
render auth-gated pages, and the Elysia API (mounted at
`app/api/[[...slug]]/route.ts`) serves data requests. The Eden Treaty client
gives the frontend a fully typed view of the API without code generation.

## 2. Monorepo layout

| Package               | Purpose                                            | Key exports                                              |
| --------------------- | -------------------------------------------------- | -------------------------------------------------------- |
| `apps/web`            | Next.js app: pages, components, Elysia API         | App Router routes, `server/` route handlers              |
| `@dev-telemetry/core` | Metrics aggregation, classification, reporting     | metric buckets, classifier, report builders              |
| `@dev-telemetry/ai`   | Multi-provider LLM narrative generation            | narrative generator, model resolution, Zod output schema |
| `@dev-telemetry/github`| Octokit-based ingestion and resumable backfill    | sync runner, cursor pagination, backfill driver          |
| `@dev-telemetry/crypto`| AES-256-GCM encryption for secrets                | `encrypt`, `decrypt` helpers                             |
| `@dev-telemetry/db`   | Drizzle schema and database client                 | schema tables, Drizzle client                            |

Packages depend on each other only through their published exports. `core`,
`ai`, `github`, and `crypto` are pure libraries with no knowledge of HTTP; the
web app is the only layer that imports all of them and wires them together.

## 3. Stack decisions

Each major choice was made for a specific reason, not by default.

- **Bun + Turborepo** — Bun gives fast installs and a built-in test runner, so
  there is no separate Jest/Vitest setup. Turborepo provides incremental builds
  and task caching across packages, which keeps the monorepo developer
  experience fast as the codebase grows.

- **Next.js 16 App Router** — React Server Components let auth-gated pages fetch
  and render data on the server without shipping that logic to the client. The
  App Router also lets us embed the API in the same deployment, so there is no
  separate backend process to operate.

- **Elysia embedded in Next.js** — Elysia is mounted inside a catch-all Next.js
  route. Because the API and frontend share a process and origin, there is no
  CORS configuration to manage. Eden Treaty consumes Elysia's types directly,
  giving end-to-end type safety from handler to caller.

- **Drizzle ORM** — Drizzle is type-safe and SQL-first with no hidden runtime
  magic. Queries read like SQL, migrations are explicit, and it works cleanly
  against Neon's serverless PostgreSQL.

- **Better-Auth** — A lightweight auth library with first-class GitHub OAuth, a
  session-cookie model, and a Drizzle adapter, so authentication tables live in
  the same schema as the rest of the data.

- **Vercel AI SDK (multi-provider)** — One API surface covers Anthropic, OpenAI,
  and Google. Switching providers or falling back when a key is missing is a
  matter of model resolution rather than rewriting integration code.

- **AES-256-GCM for secrets** — An industry-standard authenticated encryption
  scheme. GCM provides both confidentiality and integrity, so tampering with
  ciphertext is detected on decryption rather than silently accepted.

- **Tailwind CSS v4** — Uses CSS variables and design tokens with no config
  file. Styling stays close to markup and the token system keeps the UI
  consistent without a separate theme layer.

## 4. Database schema

All application data lives in PostgreSQL and is accessed through Drizzle.

**Better-Auth tables**

- `user` — account identity (id, name, email, image, timestamps).
- `session` — active sessions keyed by token, with expiry and user reference.
- `account` — OAuth provider linkage (GitHub), holding provider account id and
  tokens.
- `verification` — verification challenges used by the auth flow.

**Application tables**

- `user_secret` — encrypted GitHub PAT and per-provider LLM API keys. Values are
  stored as AES-256-GCM ciphertext and are never returned as plaintext. Scoped
  one row per user.
- `user_profile` — either a built-in rubric key or a custom markdown rubric
  (capped at 32KB). One profile per user.
- `user_usage` — quota accounting, enforcing a 3GB ceiling on stored data per
  user.
- `repository` — GitHub repositories synced for a user.
- `commit` — git commits. The message field is capped at 4KB at write time.
- `pull_request` — GitHub pull requests. The body field is capped at 16KB.
- `sync_job` — resumable background sync jobs with cursor state and status.

**Uniqueness constraints**

- One `user_secret`, `user_profile`, and `user_usage` row per `userId` — these
  are per-user singletons, and uniqueness prevents duplicate or conflicting
  state.
- `repository`, `commit`, and `pull_request` are unique per
  `(userId, external identifier)` — repo full name, commit SHA, and PR number
  respectively. These constraints make ingestion idempotent: re-running a sync
  upserts rather than duplicating rows, which is essential for the
  cursor-based, resumable pipeline.

## 5. Security model

Security is enforced at every layer, not bolted on.

**Secret encryption flow** — When a user submits a GitHub PAT or LLM API key,
the value is encrypted with AES-256-GCM (using `ENCRYPTION_KEY`) before being
written to `user_secret`. The API never returns stored secrets as plaintext;
read endpoints expose only presence flags or masked indicators. Decryption
happens server-side, in memory, only when a secret is needed to call an external
API.

**Session authentication** — Every Elysia route requires an authenticated
Better-Auth session. The session is carried by a cookie and validated by a
middleware layer, with a short (5-minute) cache to avoid revalidating on every
request. Unauthenticated requests are rejected before reaching any handler
logic.

**Multi-tenant isolation** — Every database query includes a `userId` predicate.
There is no code path that reads another user's commits, PRs, secrets, or
reports. Tenant isolation is verified by a dedicated security test layer.

**Field-length caps** — Caps are enforced at ingestion write time so that
oversized payloads from GitHub cannot inflate storage or quota:
- commit message ≤ 4KB
- pull request body ≤ 16KB
- custom profile markdown ≤ 32KB

**OAuth scopes** — The GitHub OAuth app requests `read:user` and `read:org`.
`read:user` is required to identify the authenticated user; `read:org` is
required to enumerate the organizations whose activity the user may choose to
include via the scope filter. No write scopes are requested.

## 6. GitHub ingestion pipeline

Ingestion is resumable and client-driven, so a long backfill survives timeouts
and can continue across multiple requests.

**State machine** — A `sync_job` moves through `pending → running → done` on
success, or `running → failed` on an unrecoverable error. The current job is
exposed via `GET /api/sync/current`.

**Cursor-based pagination** — The job persists cursor state between batches: the
last processed commit SHA and the last processed PR number. Because ingestion is
idempotent (unique constraints on SHA and PR number), resuming from a cursor
never duplicates rows.

**Client-driven batching** — `POST /api/sync/start` creates the job. The client
then loops on `POST /api/sync/batch/:id`, processing one bounded batch per call
and advancing the cursor each time. This keeps individual requests short and
lets the client show progress, rather than relying on one long-running server
task.

**Quota enforcement** — Before each batch, the pipeline checks `user_usage`
against the 3GB ceiling. If the user is at quota, the batch is rejected and the
job stops, preventing unbounded growth from a single account.

## 7. Classification system

Each reporting period is classified into one of four performance levels, ranked
against the user's own historical distribution rather than against other users.

| Level         | Meaning      | Band       |
| ------------- | ------------ | ---------- |
| `muito-acima` | very above   | top ~10%   |
| `acima`       | above        | top ~35%   |
| `atendendo`   | meeting      | ~50%       |
| `abaixo`      | below        | bottom ~15%|

**Percentile ranking** — A period's metrics are compared against the
distribution of the same user's past periods. The level reflects where the
period falls within that personal distribution, so classification is relative to
the individual's own baseline.

**Market profiles** — Nine built-in role rubrics (under `docs/profiles/`) define
what "meeting" looks like for different roles. A user selects a built-in rubric
key via `user_profile`, or supplies a custom markdown rubric (≤32KB). The active
profile shapes how metrics are interpreted and how the narrative frames the
period.

## 8. AI narrative generation

Narratives turn the numeric report for a period into a readable summary.

- **Per-period, cached** — A narrative is generated for a specific period and
  cached in the session so repeated views do not re-invoke the model.
- **Output validation** — The model's response is validated against a Zod schema
  before being returned, so malformed or off-shape output is rejected rather
  than rendered.
- **Multi-provider with model resolution** — `@dev-telemetry/ai` resolves which
  provider and model to use based on which API keys are configured, calling
  Anthropic, OpenAI, or Google through the Vercel AI SDK's shared interface.
- **Window context** — The generator receives the period's metrics, the computed
  classification level, and the date range, so the narrative is grounded in the
  same data the dashboard displays.

## 9. Testing strategy

The suite is organized into six layers, each targeting a distinct failure mode.

- **Unit** — Pure-logic tests in `packages/core`, `packages/ai`,
  `packages/crypto`, and `packages/github`. Cover metrics math, classification,
  encryption helpers, and ingestion utilities in isolation.
- **Integration** — Exercise the crypto pipeline end to end and the system
  backfill pipeline, confirming packages compose correctly.
- **Smoke** — Verify package exports and route structure so a broken export or
  missing route is caught early.
- **Security** — Assert multi-tenant isolation (no cross-user data access) and
  encryption tamper detection (modified ciphertext fails to decrypt).
- **Regression** — Lock down classifier edge cases that previously misbehaved.
- **Functional** — End-to-end report generation logic, validating the full path
  from stored activity to a finished report.

## 10. Known limitations

- **Single GitHub token per user** — Ingestion uses one personal access token,
  so coverage is limited to what that token can read.
- **No real-time sync** — Activity is pulled in client-driven batches, not
  streamed; the dashboard reflects data as of the last completed sync.
- **Narrative quality depends on the LLM** — Summaries are only as good as the
  configured provider and model, and may vary between runs.
- **Personal-baseline classification** — Levels are relative to the user's own
  history, so a new user with little data has a weak baseline until enough
  periods accumulate.
- **Storage quota** — A hard 3GB ceiling per user means very high-volume
  accounts may hit the limit and stop ingesting until data is trimmed.
