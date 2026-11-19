# PLAN — GG Counter (migration into the forge)

> Status: **approved 2026-11-19 by Moni** ("go, you decide"). Based on `docs/SPEC.md` (as-is + decisions of
> 2026-11-19) and `docs/migration/baseline-2026-11-19.md`. Order follows `flow` → migrate §3.4:
> every task ends green and deployable; the live URL, saved data and installed copies keep working.

## 1. Architecture (target)
### core (`gg-counter-core`, private workspace package — not published)
- Pure functions + Zod schemas: `addPlayer`, `removePlayer`, `renamePlayer`, `adjustScore`, `setScore`,
  `resetScores`, `rank` (order, ties, totals), `formatLeaderboard` (share text), `parseSavedState`
  (reads version 1 exactly as today). Results are typed (`{ ok, value } | { ok, error }`).
### mcp — none (DECISIONS 2026-11-19).
### app (PWA, Level 2 — React)
- `app/src/<feature>/` split of today's `app.tsx` (772 lines): players, score dialog, leaderboard, share.
- Storage through one module; keys namespaced `gg-counter:v1:*` with a one-time read of the old keys.
### service — none.

## 2. Standard parts used
| Part | Used | Note |
|---|---|---|
| App shell, Help, legal + policy pages, error pages | yes | React versions of the shell parts; texts from `app.config.ts` |
| Storage module (beyond prefs) | no | prefs tier only |
| n8n block / API / remote MCP | no | no HTTP API |

## 3. Tasks
### T-01 · Safety net: characterization tests
- Goal: lock today's behaviour before touching code.
- Files: `tests/e2e/*.spec.ts`, `src/**/*.test.ts(x)`, Vitest + Playwright config, fixtures of real saved state (version 1, and version 0 / broken JSON).
- Reading list: engineering → testing; flow → migrate §3.4a.
- Acceptance: AC1–AC8 of SPEC pass against the **unchanged** app; storage round-trip test loads the fixtures.
- Depends on: —
- [x] done — 8 flows × 2 viewports green on the unchanged app (2026-11-19). Found on the way: empty names add nobody; rename saves on Enter/blur; theme key is `gg-counter-theme`; a `null` player entry loses the whole saved game (fixed in T-04).

### T-02 · Repo hygiene without behaviour change
- Goal: untrack `node_modules/` and `dist/`, generated `*.tsbuildinfo`, `vite.config.js/.d.ts`; npm → pnpm with the supply-chain policy; add `LICENSE`.
- Files: `.gitignore`, `pnpm-workspace.yaml`, `pnpm-lock.yaml`, `package.json`, `LICENSE`.
- Reading list: engineering → security §5; migrate §4.
- Acceptance: clean clone → `pnpm i --frozen-lockfile && pnpm build` works; T-01 tests green; `perf-check --dist dist` recorded in the baseline file.
- Depends on: T-01
- [x] done — `node_modules`, `dist` and generated files untracked (43 tracked files left); pnpm 12 with the supply-chain policy; `LICENSE` added; clean install + build + 16 e2e green (2026-11-19).

### T-03 · Forge frame
- Goal: `AGENTS.md`, `CLAUDE.md`, `STATUS.md`, `LEARNINGS.md`, `CHANGELOG.md`, `SECURITY.md`, `service.json`, `.claude/settings.json`, CI (`ci.yml`, `deploy.yml` with SHA-pinned actions and the `workflow_run` guard, `codeql.yml`), ESLint 10 flat config with the forge rules, `pnpm verify`.
- Files: repo root, `.github/workflows/`, `eslint.config.js`.
- Reading list: flow → architecture §2; engineering → security §7, code-quality §9.
- Acceptance: `pnpm verify` green; deploy from CI reaches the same URL; T-01 tests green on the deployed build.
- Depends on: T-02
- [x] done — forge ESLint rules green without weakening (reducer split by a `updatePlayer` helper, named `App` export, typed hook results); `pnpm verify` = lint + typecheck (src, tests, configs) + build + e2e; frame files, `service.json`, Dependabot; CI → Deploy (`workflow_run`, push + same-repo guard, SHA-pinned) + CodeQL (2026-11-19).

### T-04 · Workspace layout and core package
- Goal: `packages/core` with the pure score logic moved out of the reducer and `app.tsx`, tests first; app moved to `app/`; layers declared (`structure.config.json` not needed once the forge layout exists).
- Files: `packages/core/**`, `app/**`, `tsconfig*.json`, `pnpm-workspace.yaml`.
- Reading list: engineering → structure §1–5, §7; code-quality §2–6.
- Acceptance: `structure-check` 0 FAIL; core ≥ 90 % line coverage incl. fast-check properties for `parseSavedState`; T-01 tests green; moves and behaviour changes in separate commits.
- Depends on: T-03
- [ ] done

### T-05 · Split `app.tsx` by feature
- Goal: no source file over 300 lines; one component per file; duplicated desktop/mobile action bars become one component.
- Files: `app/src/players/`, `app/src/scores/`, `app/src/leaderboard/`, `app/src/share/`.
- Reading list: engineering → react §2, structure §4–5.
- Acceptance: `structure-check` and lint green; T-01 tests green; screenshots before/after identical; the temporary size-rule block in `eslint.config.js` (added in T-03 for `app.tsx` and `player-card.tsx`; paths updated by T-04) is deleted.
- Depends on: T-04
- [ ] done

### T-06 · `app.config.ts` + generator (single source of truth)
- Goal: head/meta/OG, canonical, JSON-LD, manifest, sitemap, llms.txt, 404 from one config; **static HTML carries the h1, the answer sentence, steps and FAQ** (crawlers see text without JavaScript); base path `/GG-counter/` set explicitly.
- Files: `app.config.ts`, `scripts/generate.ts`, `app/index.html`, `app/vite.config.ts`.
- Reading list: growth → seo-geo §2–6, geo §3–4, geo-content §1–3; app-shell → app-shell §0.
- Acceptance: `geo-check --render` 0 FAIL and `seo-check` 0 FAIL on the preview; manifest `id`, `scope`, `start_url` unchanged; an installed old copy updates and still opens its saved game.
- Depends on: T-05
- [ ] done

### T-07 · Storage namespace with migration
- Goal: `gg-counter:v1:state` and `gg-counter:v1:theme`; first load copies the old `gg-counter/state` and `gg-counter-theme`, keeps the old values until the new ones are verified; Settings → export/import/clear.
- Files: `app/src/storage/`.
- Reading list: engineering → browser-storage; migrate §1.
- Acceptance: AC7 with fixtures from the old app; a second forge app on the same origin does not see or change the data.
- Depends on: T-06
- [ ] done

### T-08 · Shell: menu, Settings, Help, What's new, update toast, error screen
- Goal: the required frame in React, generated from `app.config.ts`; `registerType: "prompt"` with an update toast instead of silent auto-update; confirm dialogs keep their current wording.
- Files: `app/src/ui/**`.
- Reading list: app-shell → app-shell, help-docs, error-pages; pwa → pwa.
- Acceptance: `pwa-check` 0 FAIL; `a11y-check` 0 FAIL in light and dark; offline reload works.
- Depends on: T-07
- [ ] done

### T-09 · English + Bulgarian
- Goal: every string through i18next; language choice in Settings; one English URL for crawlers.
- Files: `app/src/i18n/en.ts`, `bg.ts`, components.
- Reading list: app-shell → i18n; growth → seo-geo §2.
- Acceptance: no hard-coded UI string (lint rule); both languages pass T-01 flows; share text localized, English format unchanged.
- Depends on: T-08
- [ ] done

### T-10 · Legal pages
- Goal: Terms, Privacy, AI notice, Legal notice, Support as dialogs and standalone pages, matched to what the code does.
- Files: `content/legal/*.md`, generator.
- Reading list: app-shell → legal-pages.
- Acceptance: `compliance-check` 0 FAIL; `legal-reviewer` verdict; contact email confirmed by Moni.
- Depends on: T-08
- [ ] done

### T-11 · (removed — no MCP server, DECISIONS 2026-11-19)
- [x] done

### T-12 · Design tokens and Tailwind 4
- Goal: `design/tokens.css` from the forge; Tailwind 4 `@theme` mapped to the tokens; accent contrast checked. Visual change expected — Moni reviews screenshots.
- Files: `design/tokens.css`, `app/src/styles/`, Tailwind config.
- Reading list: design → design-system, css-architecture; engineering → react §1.
- Acceptance: `a11y-check` 0 FAIL; screenshot matrix approved by Moni.
- Depends on: T-08
- [ ] done

### T-13 · Radix → Base UI (optional, Moni decides after T-12)
- Goal: follow the Level 2 component choice. Skipped unless approved — no user-visible gain by itself.
- Depends on: T-12
- [ ] done

### T-14 · User docs, second baseline, release
- Goal: `docs-writer` pages, `docs/migration/after-<date>.md` next to the baseline, GEO snapshot, `apps.json` entry in the forge, release with the full checklist (nothing is published to npm).
- Reading list: flow → release, migrate §3.6.
- Acceptance: all release gates 0 FAIL; before → after table in the report; Moni's "release approved".
- Depends on: T-01…T-12
- [ ] done
