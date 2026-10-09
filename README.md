# dev-telemetry

> Developer activity timeline & AI executive report generator — powered by your GitHub activity

**Live:** https://dev-telemetry-one.vercel.app

dev-telemetry ingests your GitHub activity (commits and pull requests), stores
your credentials encrypted at rest, aggregates daily activity metrics, and generates
AI-powered executive reports and dailies grouped by project. It is
built as a multi-tenant SaaS, so each user's data is fully isolated. The UI is
in Brazilian Portuguese and is aimed at developers who want an objective view
of their daily output and ready-to-send reports for managers and standups.

## Features

- **GitHub sync** — fast, resumable ingestion of commits and PRs via Octokit, auto-scoped to active view periods
- **Daily activity timeline** — clean chronological timeline with commits count, PRs created/merged, and detailed churn (+add / -del)
- **AI executive reports & dailies** — concise, structured reports grouped by project/repository, ready to copy and send to managers or Slack
- **Dynamic project selection** — filter which repositories to include right inside the report modal
- **Multi-LLM support** — Anthropic Claude, OpenAI GPT, and Google Gemini
- **Responsive UI** — Shadcn Lyra preset with Melodrama editorial typography and sharp modern borders

## Workflow

1. **Daily Timeline** — Review your daily engineering output grouped chronologically with commits count, PRs (created vs. merged), and churn line stats.
2. **"Gerar Daily"** — Click the sparkle icon on any day row to compile a concise daily report formatted for standups and manager syncs.
3. **"Gerar Report"** — Click in the top bar to generate an executive report for the active window (Weekly, Monthly, All-time, or Custom Calendar Range).
4. **Project Filtering** — Toggle which repositories to include or exclude directly in the report modal before generating or copying.

## Preview

<img width="50%" height="50%" alt="Screenshot From 2026-06-11 13-13-47" src="https://github.com/user-attachments/assets/a8d7af6d-7d35-43ec-8df9-c5cfce95e029" />

## Tech stack

| Area      | Technology                              | Notes                                            |
| --------- | --------------------------------------- | ------------------------------------------------ |
| Runtime   | Bun 1.3                                 | Package manager and test runner                  |
| Monorepo  | Turborepo 2                             | Incremental builds and task orchestration        |
| Frontend  | Next.js 16, React 19, TypeScript        | App Router with React Server Components          |
| Styling   | Tailwind CSS v4                         | CSS variables, design tokens, no config file     |
| API       | Elysia + Eden Treaty                    | Embedded in Next.js, type-safe end to end        |
| Database  | PostgreSQL (Neon) + Drizzle ORM         | SQL-first, type-safe schema                      |
| Auth      | Better-Auth 1.6                         | GitHub OAuth, session cookie                     |
| AI        | Vercel AI SDK                           | Multi-provider executive reports & dailies       |
| Crypto    | AES-256-GCM                             | Authenticated encryption for stored secrets      |

## Prerequisites

- [Bun](https://bun.sh) ≥ 1.3
- A PostgreSQL database (e.g. [Neon](https://neon.tech))
- A [GitHub OAuth App](https://github.com/settings/developers)

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/carvalhocaio/dev-telemetry.git
   cd dev-telemetry
   ```
2. Copy the example environment file and fill in the values:
   ```bash
   cp apps/web/.env.example apps/web/.env.local
   ```
3. Install dependencies:
   ```bash
   bun install
   ```
4. Start the development server:
   ```bash
   bun dev
   ```

## Environment variables

| Variable                       | Description                                   | Required |
| ------------------------------ | --------------------------------------------- | -------- |
| `DATABASE_URL`                 | PostgreSQL connection string                  | Yes      |
| `BETTER_AUTH_SECRET`           | Auth secret, minimum 32 characters            | Yes      |
| `BETTER_AUTH_URL`              | Base URL (default `http://localhost:3000`)    | No       |
| `GITHUB_CLIENT_ID`             | GitHub OAuth app client ID                    | Yes      |
| `GITHUB_CLIENT_SECRET`         | GitHub OAuth app client secret                | Yes      |
| `SECRET_ENCRYPTION_KEY`        | 32-byte hex key for AES-256-GCM               | Yes      |
| `ANTHROPIC_API_KEY`            | Enables Claude reports (or enter in /settings) | No       |
| `OPENAI_API_KEY`               | Enables GPT reports (or enter in /settings)    | No       |
| `GOOGLE_GENERATIVE_AI_API_KEY` | Enables Gemini reports (or enter in /settings) | No       |

## Monorepo structure

```
dev-telemetry/
├── apps/web/           # Next.js app (frontend + Elysia API)
│   ├── app/            # Next.js App Router pages
│   ├── components/     # React components
│   ├── hooks/          # Custom hooks
│   ├── lib/            # Utilities, auth, range logic
│   ├── server/         # Elysia route handlers
│   └── types/          # TypeScript types
├── packages/
│   ├── ai/             # Multi-provider LLM executive reports & dailies
│   ├── core/           # Daily activity aggregation, metrics, reporting
│   ├── crypto/         # AES-256-GCM encryption
│   ├── db/             # Drizzle schema + DB client
│   └── github/         # Octokit ingestion + backfill
└── tests/              # Integration, smoke, security, regression tests
```

## Running tests

```bash
bun test
```

## Contributing

Contributions are welcome. Before submitting changes, run the test suite and
make sure linting passes. Keep pull requests focused on a single concern, and
describe the motivation in the PR body. For larger changes, open an issue first
to discuss the approach. Open an issue or PR at
[github.com/carvalhocaio/dev-telemetry](https://github.com/carvalhocaio/dev-telemetry).

## License

MIT
