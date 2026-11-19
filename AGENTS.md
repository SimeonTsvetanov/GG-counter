# AGENTS.md — GG Counter

Offline score tracker for board-game nights — a free micro-app by Simeon "Moni" Tsvetanov
(GitHub Pages PWA, React **Level 2**). Being migrated into the forge: see `docs/PLAN.md`.

## Read first
1. `STATUS.md` (current state, next step). 2. `docs/SPEC.md` + `docs/PLAN.md`. 3. `docs/DECISIONS.md`.
4. `docs/migration/baseline-2026-11-19.md` — the pre-forge numbers every later step is compared with.

## Rules
- Talk to Moni in **Bulgarian**; every file, commit and issue in **English**.
- Follow the forge plugin (`forge` + `forge-standards`); this is a migration, so `flow` → migrate
  applies: same URL, same saved data, every task ends green and deployable.
  Cloud session without the plugin: read `simeonts-microapp-forge/plugins/*/skills/*/SKILL.md` for
  the area, then only the chapters it points to; agents are in `plugins/*/agents/*.md`.
- React stays (DECISIONS 2026-11-19): `engineering` → react, only the parts this app needs.
- Run `pnpm verify` before saying "done"; keep working while it fails. Never weaken a lint rule or
  a test to get green; the only lint exception is the dated size-rule block in `eslint.config.js`
  (removed in PLAN T-05).
- The e2e tests in `tests/e2e/` are characterization tests of the pre-forge behaviour — a change
  that breaks one is a behaviour change and needs a SPEC/DECISIONS entry first.
- Saved data: `localStorage` keys `gg-counter/state` and `gg-counter-theme` are read by installed
  copies — never rename or reshape them outside PLAN T-07.
- Moni corrects/dislikes something → apply it and add an entry to `LEARNINGS.md`.
- Decisions → `docs/DECISIONS.md` (date · decision · reason) the same day. Update `STATUS.md` (≤ 30 lines).

## Where things are (until PLAN T-04 moves the app to `app/` and logic to `packages/core`)
```
src/            React app: app.tsx (main screen), components/, hooks/, lib/storage.ts, providers/
src/components/ui/  vendored shadcn/Radix primitives
public/         icons, favicon             tests/e2e     Playwright (desktop + phone, Chromium)
tests/fixtures  saved-state fixtures       docs/         SPEC, PLAN, DECISIONS, migration baseline
vite.config.ts  base `/GG-counter/` in production, PWA manifest (id `gg-counter-pwa-v1`)
```

## Commands
`pnpm i` · `pnpm dev` · `pnpm verify` (lint + typecheck + build + e2e) · `pnpm lint` ·
`pnpm typecheck` (src, tests and config files via `tsconfig.eslint.json`) · `pnpm build` ·
`pnpm e2e` (needs `pnpm build`; serves `dist/` with `vite preview`)
