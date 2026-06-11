# dev-telemetry

> Personal developer performance dashboard — powered by your GitHub activity

dev-telemetry ingests your GitHub activity (commits and pull requests), stores
your credentials encrypted at rest, computes performance metrics, and generates
AI-powered narratives that explain how your output is trending over time. It is
built as a multi-tenant SaaS, so each user's data is fully isolated. The UI is
in Brazilian Portuguese and is aimed at developers who want an objective,
data-driven view of their own work.

## Features

- **GitHub sync** — resumable ingestion of commits and PRs via Octokit
- **Metrics dashboard** — aggregated activity by day, week, and month
- **AI narratives** — natural-language summaries of each period's performance
- **Custom profiles** — built-in role rubrics or your own markdown rubric
- **Multi-LLM support** — Anthropic Claude, OpenAI GPT, and Google Gemini
- **Org/personal scope filter** — include or exclude organization activity

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
| AI        | Vercel AI SDK                           | Multi-provider narrative generation              |
| Crypto    | AES-256-GCM                             | Authenticated encryption for stored secrets      |

## Prerequisites

- [Bun](https://bun.sh) ≥ 1.3
- A PostgreSQL database (e.g. [Neon](https://neon.tech))
- A [GitHub OAuth App](https://github.com/settings/developers)

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/dev-telemetry/dev-telemetry.git
   cd dev-telemetry
   ```
2. Copy the example environment file and fill in the values:
   ```bash
   cp .env.example .env
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
| `ENCRYPTION_KEY`               | 32-byte hex key for AES-256-GCM               | Yes      |
| `ANTHROPIC_API_KEY`            | Enables Claude narratives                     | No       |
| `OPENAI_API_KEY`               | Enables GPT narratives                        | No       |
| `GOOGLE_GENERATIVE_AI_API_KEY` | Enables Gemini narratives                     | No       |

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
│   ├── ai/             # Multi-provider LLM narrative generation
│   ├── core/           # Metrics, classification, reporting
│   ├── crypto/         # AES-256-GCM encryption
│   ├── db/             # Drizzle schema + DB client
│   └── github/         # Octokit ingestion + backfill
├── tests/              # Integration, smoke, security, regression tests
└── docs/profiles/      # Market profile rubrics (9 roles)
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
[github.com/dev-telemetry/dev-telemetry](https://github.com/dev-telemetry/dev-telemetry).

## License

MIT
