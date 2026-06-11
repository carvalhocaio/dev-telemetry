# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.0.1] - 2026-06-11

### Fixed
- Lazy-initialize the database singleton via Proxy so importing `@dev-telemetry/db` at build time no longer requires `DATABASE_URL` to be set
- Switch workspace packages from `moduleResolution: NodeNext` to `bundler` so Turbopack can resolve bare TypeScript imports without `.js` extensions

### Changed
- Move Vercel configuration to `apps/web/vercel.json` and set `rootDirectory: apps/web` on the project so the build runs from the correct workspace package
- Declare server-side env vars in `turbo.json` build task so Turborepo passes them through to the Next.js build process
- Add `turbopack.root` and `outputFileTracingRoot` in `next.config.ts` pointing to the monorepo root so Turbopack resolves hoisted `node_modules` correctly

## [1.0.0] - 2026-06-11

### Added
- Sign in with GitHub and manage your session securely (#ca9d0fb)
- Encrypted storage for your GitHub access tokens (#e8c4264)
- Automatic import of your GitHub commit and pull request history (#577afa1)
- Activity reports, AI narratives, and on-demand data sync (#bd0349e)
- AI-generated performance narratives with multiple provider options (#577afa1)
- Settings page with session management and a status badge (#f5a9541)
- Career profiles tailored to nine different roles (#6a65d43)
- Personalized profile selection that shapes your reports and narrative (#a91295d)
- Switch between organization and personal activity views (#1c8aa6e)
- Public contributions page to showcase your work (#0cdf804)
- Per-organization metrics with control over which data gets imported (#8808db5)
- GitHub username, fetch-orgs action, and guided navigation after sync in settings (#daf3dcc)

### Fixed
- Profile settings now return your full custom content (#fa75266)
- Dashboard navigation links now point to the correct pages (#a4c513b)
- Sign-out button now shows a clearer logout icon (#d4f6d28)
- Charts now display Portuguese month names and group tasks correctly (#c822d49)
- Reports no longer fail to load on PostgreSQL (#87d8509)

### Improved
- Redesigned home as a landing page with a dedicated authenticated dashboard (#fdf71ac)
- Cleaner header layout with the AI Powered badge beside the scope selector (#dd422d0)
- Period selector and sync button relocated for a tidier dashboard (#0174ddc)
- Dashboard now shows your profile label and handles sync errors more gracefully (#ed2aaa5)
- Custom scrollbar styled to match the terminal theme (#43aca32)
- Date pickers replaced with a friendlier calendar component (#b1e71b1)
