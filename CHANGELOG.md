# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [2.0.0] - 2026-06-27

### Added
- New pit-wall/mission-control visual identity — deep black background, neon green accent, monospace typography throughout. (#5e486e2)
- Dashboard rebuilt with focused components: score hero, metrics row, area chart, and 3-column insight panel (narrative · strengths · situation). (#025e9f8)
- PRs metric now shows open/merged ratio (e.g. `2/15`). (#6b90b96)
- Info tooltips on each dashboard metric explaining how it is calculated. (#5013fc9)
- Selected org scope is now persisted across sessions via localStorage. (#ed81c11)
- Weekly view added to the mode selector; dashboard auto-syncs on first load. (#985045a)
- Sync now defaults to the last 30 days instead of incremental delta. (#3ad73f0)
- Profile description modal — clicking the role badge shows the full markdown rubric. (#ed923fa)
- Settings: preview button to read any built-in profile description with copy-to-clipboard. (#6b4f48d)
- Mobile: profile viewer opens in a dedicated `/profile/[key]` page in a new tab. (#59aa255)
- Mobile: hamburger menu with sign-out option, 3-row dashboard header, full-width scope selector, and responsive landing/login titles. (#befb128)

### Fixed
- Churn (lines added/deleted) is now correctly populated by fetching per-commit stats. (#3b200bf)
- Stats are back-filled for commits ingested in earlier syncs that lacked diff data. (#d9643f0)
- Re-syncing no longer resets churn to zero for known commits. (#2fa1099)
- Sync progress now covers both commits and PRs in a single 0–100% bar with ETA and current repository name. (#2fa1099)
- Merged PR count and stale detection corrected during ingestion. (#304436f)
- Merge commits excluded from commit count, churn, and active-day calculations. (#7805d89)
- Saving a custom profile now correctly persists the key; displays as "Personalizado". (#fbca594)
- Storage and sync progress bars replaced with CSS bars — no more visual false-fill. (#b4673f1)
- Sign-out triggers a full page reload to clear stale router cache. (#872b51e)
- Commit count in the score hero no longer double-counts entries. (#7f321b9)
- Score level badge now matches the composite score displayed. (#8488e48)
- Switching time mode (weekly/monthly/all-time) no longer resets the org/scope filter. (#fe134ed)
- Org selector no longer clips long organization names. (#d1580b5)
- Sync job now skips inaccessible repositories (403/404) instead of failing the entire job. (#defa74c)
- Navigation converted to Server Component — React hydration mismatches eliminated. (#4319f3e)
- Footer is now pinned to the bottom of the viewport on all pages. (#915f1aa)

### Improved
- Dashboard streak metric renamed from "Dias Ativos" to "Sequência". (#915f1aa)
- Profile badge JSX deduplicated; `MOBILE_BREAKPOINT` constant shared across components; accessibility attributes restored on icon buttons. (#5720010)

## [1.0.2] - 2026-06-19

### Fixed
- Auth header parser no longer triggers SAST false positive — Bearer token extraction rewritten to use `String.match` instead of `RegExp.exec`. (#891087c)

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
