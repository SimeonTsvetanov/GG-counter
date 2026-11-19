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
  a test to get green (the temporary size-rule block was removed in PLAN T-05).
- The e2e tests in `tests/e2e/` are characterization tests of the pre-forge behaviour — a change
  that breaks one is a behaviour change and needs a SPEC/DECISIONS entry first.
- Saved data: `localStorage` keys `gg-counter/state` and `gg-counter-theme` are read by installed
  copies — never rename or reshape them outside PLAN T-07.
- Moni corrects/dislikes something → apply it and add an entry to `LEARNINGS.md`.
- Decisions → `docs/DECISIONS.md` (date · decision · reason) the same day. Update `STATUS.md` (≤ 30 lines).

## Where things are (workspace since PLAN T-04, features since T-05)
```
packages/core   gg-counter-core (private) — pure score logic + Vitest/fast-check tests; no DOM/storage/network;
                test/fixtures/ = saved-state fixtures (also imported by tests/e2e)
app/            gg-counter-app — the React PWA (Vite): src/app.tsx (composition root), feature folders
                src/players/, src/leaderboard/, src/session/ (header, action bar, confirmations), src/share/;
                src/components/ (theme toggle, status banner), src/hooks/ (use-game-state wraps core),
                src/lib/ (storage I/O, layout classes), src/providers/; src/components/ui/ = vendored shadcn/Radix.
                Imports core by name (`gg-counter-core`).
app/public/     icons, favicon             tests/e2e     Playwright (desktop + phone, Chromium)
docs/           SPEC, PLAN, DECISIONS, migration baseline
app/vite.config.ts  base `/GG-counter/` in production, PWA manifest (id `gg-counter-pwa-v1`)
```

## Commands
`pnpm i` · `pnpm dev` · `pnpm verify` (lint + typecheck + test + build + e2e) · `pnpm lint` ·
`pnpm typecheck` (`tsc -b`: core, app, Vite config, tests, tool configs) · `pnpm test` (Vitest, core ≥ 90 % lines) ·
`pnpm build` (→ `app/dist`) · `node …/structure-check.mjs --repo .` (layers in `structure.config.json`) ·
`pnpm e2e` (needs `pnpm build`; serves `app/dist` with `vite preview`)
