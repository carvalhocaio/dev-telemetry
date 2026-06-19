# apps/web

Next.js application for dev-telemetry — frontend pages and embedded Elysia API.

## Development

Run from the **monorepo root**:

```bash
bun dev
```

Or scoped to this app:

```bash
cd apps/web && bun dev
```

## Environment

Copy and fill in the example before running:

```bash
cp apps/web/.env.example apps/web/.env.local
```

See the [root README](../../README.md) for the full list of required variables.

## Structure

```
apps/web/
├── app/        # Next.js App Router pages
├── components/ # React components
├── hooks/      # Custom React hooks
├── lib/        # Utilities (auth, range, crypto helpers)
├── server/     # Elysia route handlers
└── types/      # Shared TypeScript types
```
