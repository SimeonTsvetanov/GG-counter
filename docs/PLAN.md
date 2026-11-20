# PLAN — GG Counter (migration into the forge)

> Status: **approved 2026-11-19 by Moni** ("go, you decide"). Based on `docs/SPEC.md` (as-is + decisions of
> 2026-11-19) and `docs/migration/baseline-2026-11-19.md`. Order follows `flow` → migrate §3.4:
> every task ends green and deployable; the live URL, saved data and installed copies keep working.

## 1. Architecture (target)
### core (`gg-counter-core`, private workspace package — not published)
- Pure functions + Zod schemas: `addPlayer`, `removePlayer`, `renamePlayer`, `adjustScore`, `setScore`,
  `resetScores`, `rank` (order, ties, totals), `formatLeaderboard` (share text), `parseSavedState`
  (reads version 1 exactly as today). Results are typed (`{ ok, value } | { ok, error }`).
  1.1 (T-15): `adjustScore` records history; `removeScoreEntry`, `resetPlayerScore`, `lastScoredPlayerId`, `rank().places`,
  `checkSavedGame` (strict import check); `setScore` removed (no caller; every change must be recorded).
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
- [x] done — pnpm workspace: app moved to `app/` (`gg-counter-app`, `git mv`), `packages/core` = `gg-counter-core` (players, scores, ranking, share text, `parseSavedState`; limits for new input) with 90 Vitest/fast-check tests at 100 % lines; app imports core by name; layers in `structure.config.json`; one behaviour change: a `null` player entry is dropped instead of losing the game (2026-11-19).

### T-05 · Split `app.tsx` by feature
- Goal: no source file over 300 lines; one component per file; duplicated desktop/mobile action bars become one component.
- Files: `app/src/players/`, `app/src/scores/`, `app/src/leaderboard/`, `app/src/share/`.
- Reading list: engineering → react §2, structure §4–5.
- Acceptance: `structure-check` and lint green; T-01 tests green; screenshots before/after identical; the temporary size-rule block in `eslint.config.js` (added in T-03 for `app.tsx` and `player-card.tsx`; paths updated by T-04) is deleted.
- Depends on: T-04
- [x] done — `app.tsx` (747 lines) → 117-line composition root + `players/`, `leaderboard/`, `session/`, `share/` (score dialog lives in `players/`; no `scores/` folder needed); one action bar, one leaderboard dialog and one clear-session dialog instead of copies; size-rule block deleted; saved-state fixtures moved to `packages/core/test/fixtures/` (shared with e2e); 44 before/after screenshots (390×844 + 1280×800, light + dark) byte-identical; 16 e2e green (2026-11-19).

### T-06 · `app.config.ts` + generator (single source of truth)
- Goal: head/meta/OG, canonical, JSON-LD, manifest, sitemap, llms.txt, 404 from one config; **static HTML carries the h1, the answer sentence, steps and FAQ** (crawlers see text without JavaScript); base path `/GG-counter/` set explicitly.
- Files: `app.config.ts`, `scripts/generate.ts`, `app/index.html`, `app/vite.config.ts`.
- Reading list: growth → seo-geo §2–6, geo §3–4, geo-content §1–3; app-shell → app-shell §0.
- Acceptance: `geo-check --render` 0 FAIL and `seo-check` 0 FAIL on the preview; manifest `id`, `scope`, `start_url` unchanged; an installed old copy updates and still opens its saved game.
- Depends on: T-05
- [x] done — `app.config.ts` + `scripts/generate.ts` (sitemap, llms.txt, robots.txt, 404) and the Vite head/page-text plugin; raw HTML carries h1, answer, 5 steps, 7-question FAQ, moved below the leaderboard on load (one h1, now in the header); manifest id/scope/start_url unchanged; geo-check 0 FAIL, 22 e2e green (2026-11-19).

### T-07 · Storage namespace with migration
- Goal: `gg-counter:v1:state` and `gg-counter:v1:theme`; first load copies the old `gg-counter/state` and `gg-counter-theme`, keeps the old values until the new ones are verified; Settings → export/import/clear.
- Files: `app/src/storage/`.
- Reading list: engineering → browser-storage; migrate §1.
- Acceptance: AC7 with fixtures from the old app; a second forge app on the same origin does not see or change the data.
- Depends on: T-06
- [x] done — `app/src/storage/` is the only code that touches localStorage (ESLint rule): keys `gg-counter:v1:state|theme|migrated`, a one-time copy of the old keys verified by read-back and marked per item (old keys kept), memory fallback with typed results when storage is blocked or full, `exportData`/`importData`/`clearData` for T-08's Settings; `public/theme-init.js` (generated) applies the saved theme before the first paint; 62 new unit tests (module 100 % lines) + 8 e2e (2026-11-19).

### T-08 · Shell: menu, Settings, Help, What's new, update toast, error screen
- Goal: the required frame in React, generated from `app.config.ts`; `registerType: "prompt"` with an update toast instead of silent auto-update; confirm dialogs keep their current wording.
- Files: `app/src/ui/**`.
- Reading list: app-shell → app-shell, help-docs, error-pages; pwa → pwa.
- Acceptance: `pwa-check` 0 FAIL; `a11y-check` 0 FAIL in light and dark; offline reload works.
- Depends on: T-07
- [x] done — shell in `app/src/ui/` from `app.config.ts` `shell`: menu (keyboard, inert page), Settings (theme, export → import with core check + confirm, Clear my data), Help, What's new (CHANGELOG at build time, once after an update), About + credits, Report a problem (GitHub issue or email), footer, toasts, error boundary screen; limit messages; all texts in `app/src/i18n/en.ts`; `registerType: "prompt"` + update toast, offline-only 404 fallback, `sw-handover.js` for copies on the old auto-update worker (checked with a real update); a11y-check 0 FAIL light + dark (axe included); pwa-check 1 FAIL = manifest id `gg-counter-pwa-v1` kept on purpose (DECISIONS); 222 Vitest, 52 e2e; first-load JS 118.8 KB gzip (2026-11-19).

### T-09 · English + Bulgarian
- Goal: every string through i18next; language choice in Settings; one English URL for crawlers.
- Files: `app/src/i18n/en.ts`, `bg.ts`, components.
- Reading list: app-shell → i18n; growth → seo-geo §2.
- Acceptance: no hard-coded UI string (lint rule); both languages pass T-01 flows; share text localized, English format unchanged.
- Depends on: T-08
- [x] done — i18next 26.7.2 (no react-i18next: a `useSyncExternalStore` hook in the composition roots); `bg.ts` + `l10n.bg`
  of app.config.ts in a lazy chunk (5.1 KB gzip), loaded before the first render only for Bulgarian; Settings → Language,
  start = `?lang=` → saved `gg-counter:v1:lang` → English (no auto-detect); export/import/clear carry the choice;
  share text in Bulgarian, English byte for byte (property test); in-app page block translated, raw HTML English only;
  JSX UI-text lint rule (scripts/ui-text-rule.ts); 18 Bulgarian e2e (desktop + phone); first-load JS 136.2 KB gzip
  (perf-check WARN over 130: i18next ≈ 16 KB) (2026-11-19).

### T-10 · Legal pages
- Goal: Terms, Privacy, AI notice, Legal notice, Support as dialogs and standalone pages, matched to what the code does.
- Files: `content/legal/*.md`, generator.
- Reading list: app-shell → legal-pages.
- Acceptance: `compliance-check` 0 FAIL; `legal-reviewer` verdict; contact email confirmed by Moni.
- Depends on: T-08
- [x] done — `content/legal/{terms,privacy,ai-notice,legal-notice,support}.md` from the forge templates, checked
  against the code; `scripts/legal.ts` (Markdown subset → data, placeholders from app.config.ts) feeds the lazy
  `legal-dialog.tsx` (4.8 KB gzip chunk) and `scripts/legal-page.ts` (standalone `/GG-counter/<page>/`, meta CSP,
  year.js for year + email, `policy-page.css`); menu About group + footer via `app.config.ts` `shell`, deep links,
  Help → Privacy / Support, About → `third-party-licenses.txt` (`scripts/licenses.ts`, 55 packages, upstream texts
  for 2 packages without one); sitemap + llms.txt list the pages; `LICENSE` generated; 315 Vitest, 86 e2e;
  compliance-check 0 FAIL; first-load JS 136.8 KB gzip (2026-11-19). `legal-reviewer` verdict still open.

### T-11 · (removed — no MCP server, DECISIONS 2026-11-19)
- [x] done

### T-12 · Design tokens and Tailwind 4
- Goal: `design/tokens.css` from the forge; Tailwind 4 `@theme` mapped to the tokens; accent contrast checked. Visual change expected — Moni reviews screenshots.
- Files: `design/tokens.css`, `app/src/styles/`, Tailwind config.
- Reading list: design → design-system, css-architecture; engineering → react §1.
- Acceptance: `a11y-check` 0 FAIL; screenshot matrix approved by Moni.
- Depends on: T-08
- [x] done — `design/tokens.css` (forge 0.26.0 + `--z-modal`), accent `#1F4ED8` generated and checked (36/36 PASS);
  Tailwind 4.3.5 (`@theme inline reference`), component CSS in layers, shadcn components restyled; frosted header,
  player cards (score row + equal −/+), sheets/alerts/menu/toasts, Settings, Help, legal, error screen, policy + 404
  pages on the same tokens; links without underline; Inter (Latin + Cyrillic); `theme-color` light/dark; og-image;
  header menus lazy (first-load JS 136.8 → 118.2 KB); `structure.config.json` removed (2026-11-19). Screenshot matrix
  waits for Moni's approval.

### T-13 · Radix → Base UI (optional, Moni decides after T-12)
- Goal: follow the Level 2 component choice. Skipped unless approved — no user-visible gain by itself.
- Depends on: T-12
- [ ] done

### T-14 · User docs, second baseline, release
- Goal: `docs-writer` pages, `docs/migration/after-<date>.md` next to the baseline, GEO snapshot, `apps.json` entry in the forge, release with the full checklist (nothing is published to npm).
- Reading list: flow → release, migrate §3.6.
- Acceptance: all release gates 0 FAIL; before → after table in the report; Moni's "release approved".
- Old storage keys (planned in T-07, 2026-11-19): `gg-counter/state` and `gg-counter-theme` stay untouched until a
  later release of their own, at least 30 days after the T-07 code is live. That release deletes an old key only
  when the marker `gg-counter:v1:migrated` lists its item (the new value was written and read back equal) — never
  while the marker is missing — and drops the fallback in `theme-init.js`; `clearData` already removes them.
- Depends on: T-01…T-12
- [ ] done — part done 2026-11-19: sitemap `lastmod` per source (`scripts/sitemap.ts` + tests); second baseline
  `docs/migration/after-2026-11-19.md` (before → after, every forge check on live + local build); GEO snapshot
  `docs/geo/2026-11-19.md`; version 1.0.0 (CHANGELOG dated, What's new shows it); JS budget 125 KB recorded.
  User docs done 2026-11-19: `docs/index.md`, 5 how-tos, `reference/settings.md`, `about/privacy-and-data.md`, 8 generated images,
  `docs:check` in verify + CI, wiki mirror (`docs-to-wiki.mjs`, `docs-wiki.yml`; runs after the first push).
  Open: forge `apps.json` entry; release gates still at FAIL — security-check (React DOM's `innerHTML` in the bundle;
  GitHub repo settings; the meta CSP is done) and pwa-check manifest id
  (kept on purpose); code/legal/ux/security reviews; Moni's "release approved"; tag `v1.0.0` + GitHub release.

### T-15 · 1.1 part A: score history (data) and the two alerts with a choice
- Goal: SPEC §10 F13–F15 — one "what to clear" alert for Clear session / Reset scores, the same pattern on each
  player's delete button, every score change recorded (merge window, cap) and saved/exported with the game.
- Files: `packages/core/src/{game,history,saved-history,saved-state,scores,ranking}.ts` (+ tests),
  `app/src/storage/{index,game,migrate}.ts`, `app/src/hooks/use-game-state.ts`, `app/src/ui/choice-confirm-dialog.tsx`,
  `app/src/styles/components/choice-list.css`, `app/src/session/`, `app/src/players/`, `app/src/leaderboard/`,
  `app/src/i18n/{en,bg}.ts`, `tests/e2e/clear-and-history.spec.ts` (+ csp, game, i18n, storage specs), `tests/a11y/screens.json`,
  `content/legal/privacy.md`, `docs/how-to/`, CHANGELOG.
- Reading list: design → ui-patterns §2–4, accessibility §3–4, §6, css-architecture; engineering → browser-storage §8, §10,
  code-quality, testing §3, react §6; app-shell → i18n §2, §5.
- Acceptance: AC13–AC15; core properties (score = base + sum, cap, unique ids, range) with fast-check; 1.0.0 state and
  export load unchanged (unit + e2e); `pnpm verify` ×2 green; a11y-check 0 FAIL en + bg with the new alert screens;
  compliance-check 0 FAIL; no storage change needed by T-16.
- Depends on: T-14 (1.0.0)
- [x] done — 2026-11-20 (see STATUS); version bump to 1.1.0 waits for T-16.

### T-16 · 1.1 part B: last changes, history sheet, last-scored highlight, rank badges, denser cards
- Goal: SPEC §10 F16–F18 on the player cards, using T-15's data and API only (no storage change).
- Files: `app/src/players/` (card, a history sheet), `app/src/styles/components/player-card.css`, i18n, e2e + a11y screens,
  `docs/how-to/change-scores.md` (+ `tests/docs/shots.ts` images), CHANGELOG, version 1.1.0.
- Reading list: design → ui-patterns §4–7 (sheets, undo vs confirm: × removes at once), moni-taste, responsive-layout;
  engineering → react; app-shell → i18n. API: `Player.history`, `removeScoreEntry`, `lastScoredPlayerId` / hook
  `lastScoredId`, `ranking.places` (SPEC §10).
- Acceptance: AC16–AC18; `pnpm verify` ×2; a11y-check 0 FAIL en + bg incl. the history sheet; screenshots light + dark;
  then version 1.1.0 (CHANGELOG dated, What's new).
- Depends on: T-15
- [x] done — 2026-11-20: "last changes" line (44 px button, calculator tape, newest right) → history sheet (×
  removes at once, Restore beside Close, "Earlier points", clock times), last-scored tint + pill, medals 🥇🥈🥉
  in the card corner (core `podiumPlaces`; leaderboard uses the same places), compact cards from 5 players
  (container queries; phone card 180 → 160 px), core `restoreScoreEntry`; EN + BG; e2e `history-and-cards.spec.ts`,
  csp + a11y screens; docs + images; version 1.1.0 (DECISIONS 2026-11-20, T-16 entries).

### T-17 · 1.2: the field stays on screen, quiet motion, a nicer shared leaderboard
- Goal: SPEC §11 F19–F22, version 1.2.0.
- Files: `app/src/lib/{reveal,motion,flip}.ts`, `app/src/hooks/{use-reveal-while-focused,use-flip,use-change}.ts`,
  `app/src/players/` (add card, card, section, history line and list), `app/src/leaderboard/podium-list.tsx`,
  `app/src/styles/` (player-card, history, leaderboard, layout, button, menu, choice-list, settings),
  `packages/core/src/leaderboard-text.ts` (+ tests), `app/src/share/`, i18n, e2e (`keyboard`, `motion`, game, i18n),
  docs (`share-leaderboard.md`, `manage-players.md`), `content/legal/privacy.md`, CHANGELOG, version 1.2.0.
- Reading list: design → design-system §9, ui-patterns §4, §6, accessibility §8, responsive-layout §5, moni-taste,
  css-architecture; app-shell → app-shell §8, i18n §2; engineering → react §6–7, code-quality, testing.
- Acceptance: AC19–AC22; `pnpm verify` ×2; touched e2e `--repeat-each 5`; a11y-check 0 FAIL en + bg; perf-check
  `--js-kb 125`; compliance-check 0 FAIL.
- Depends on: T-16
- [x] done — 2026-11-20: reveal helper + hook, motion (CSS keyframes + WAAPI FLIP, `use-leaving`), core share text v2,
  F22 card changes; e2e `motion.spec.ts`, keyboard + AC5 + i18n + F22 tests (`--repeat-each 5` green); version 1.2.0.

## 4. Follow-ups (dated)
- **Not before 2026-12-19** — old-key removal release (T-14 rule above, DECISIONS 2026-11-19): delete
  `gg-counter/state` / `gg-counter-theme` only where `gg-counter:v1:migrated` lists the item; drop the `theme-init.js`
  fallback; CHANGELOG + Privacy "Last updated" in the same commit.
- Lighthouse budgets in CI (`lighthouserc.json` from the forge template) — would make the 125 KB JS budget and LCP/CLS
  automatic; needs its own task (DECISIONS 2026-11-19, JS budget).
- Share fallback sheet (app-shell §8: WhatsApp + Copy where there is no share sheet, most desktops) — today both Share
  buttons copy instead; noticed in T-17, not built (DECISIONS 2026-11-20).
