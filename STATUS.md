# STATUS — GG Counter

**Updated:** 2026-11-19 · **Phase:** migration into the forge (`flow` → migrate) · live pre-forge app unchanged for users

## Done
- Migration steps 1–4 (baseline, SPEC, DECISIONS, PLAN) approved 2026-11-19. T-01: 8 characterization flows ×
  desktop + phone. T-02/T-03: pnpm 12 + supply chain, `LICENSE`, forge ESLint, `pnpm verify`, CI + CodeQL.
- T-04 workspace: app in `app/` (`gg-counter-app`, build → `app/dist`), pure logic in `packages/core`
  (`gg-counter-core`, private) with 90 Vitest + fast-check tests (100 % lines, gate 90 %); limits
  (50 players, 40-character names, ±999,999) apply to new input; layers in `structure.config.json`.
  Behaviour change: a `null` player entry in the saved game is dropped instead of losing the game.
- T-05 split by feature: `app.tsx` is a composition root; `players/`, `leaderboard/`, `session/`, `share/`;
  size-rule block deleted; screenshots identical; first-load JS 110.6 KB gzip (was 109.5).
- T-06 single source: `app.config.ts` → head/OG/JSON-LD, page text (h1, answer, steps, FAQ in raw HTML),
  manifest values, sitemap, llms.txt, robots.txt, 404 page; og-image committed. geo-check 0 FAIL.
- T-07 storage: only `app/src/storage/` (ESLint); `gg-counter:v1:*` keys, verified one-time copy of the old keys
  (kept, removal PLAN T-14); export/import/clear without UI; `theme-init.js`; 176 Vitest, 30 e2e, JS 112.2 KB.
- T-08 shell (`app/src/ui/`, from `app.config.ts` `shell`): menu, Settings (theme, export/import/clear), Help,
  What's new, About, Report a problem, footer, update toast (prompt, handover for old auto-update copies),
  error screen, limit messages; texts in `app/src/i18n/en.ts`. 222 Vitest, 52 e2e, JS 118.8 KB; a11y 0 FAIL.

## Next
- T-09: Bulgarian with i18next (swap `t()` in `app/src/i18n/index.ts`, add `bg.ts`, language in Settings).

## Blockers / open
- Group a (T-01–T-03) deployed 2026-11-19; T-04–T-08 not deployed yet (CI deploys `app/dist` now).
- `structure.config.json` stays until `design/tokens.css` exists (T-12): forge layout check needs it.
- pwa-check: 1 FAIL "manifest id = /GG-counter/" stays on purpose (id `gg-counter-pwa-v1` = installed copies;
  DECISIONS 2026-11-19); forge asked for a migrated-app option.
- `.github/instructions/*.md` (old Copilot rules) contradict the forge rules — waiting for Moni: keep or remove.
