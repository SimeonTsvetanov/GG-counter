# STATUS — GG Counter

**Updated:** 2026-11-19 (T-09) · **Phase:** migration into the forge (`flow` → migrate) · live pre-forge app unchanged for users

## Done
- Migration steps 1–4 (baseline, SPEC, DECISIONS, PLAN) approved 2026-11-19. T-01: 8 characterization flows ×
  desktop + phone. T-02/T-03: pnpm 12 + supply chain, `LICENSE`, forge ESLint, `pnpm verify`, CI + CodeQL.
- T-04 workspace: `app/` (PWA) + `packages/core` (private, Vitest + fast-check, 100 % lines); limits 50 players,
  40-character names, ±999,999 for new input; a `null` saved player is dropped instead of losing the game.
- T-05 split by feature (`players/`, `leaderboard/`, `session/`, `share/`); screenshots identical; JS 110.6 KB.
- T-06 single source: `app.config.ts` → head/OG/JSON-LD, page text (h1, answer, steps, FAQ in raw HTML),
  manifest values, sitemap, llms.txt, robots.txt, 404 page; og-image committed. geo-check 0 FAIL.
- T-07 storage: only `app/src/storage/` (ESLint); `gg-counter:v1:*` keys, verified one-time copy of the old keys
  (kept, removal PLAN T-14); export/import/clear without UI; `theme-init.js`; 176 Vitest, 30 e2e, JS 112.2 KB.
- T-08 shell (`app/src/ui/`, from `app.config.ts` `shell`): menu, Settings (theme, export/import/clear), Help,
  What's new, About, Report a problem, footer, update toast (prompt, handover for old auto-update copies),
  error screen, limit messages; texts in `app/src/i18n/en.ts`. 222 Vitest, 52 e2e, JS 118.8 KB; a11y 0 FAIL.
- T-09 English + Bulgarian (i18next, lazy `bg.ts`, Settings → Language, `?lang=`, saved `gg-counter:v1:lang`, else English);
  Bulgarian share text, English byte for byte; JSX UI-text lint rule. 287 Vitest, 72 e2e; a11y (bg) 0 FAIL; JS 136.2 KB
  (perf WARN > 130: i18next ≈ 16 KB).

## Next
- T-10: legal pages.

## Blockers / open
- Group a (T-01–T-03) deployed 2026-11-19; T-04–T-08 not deployed yet (CI deploys `app/dist` now).
- `structure.config.json` stays until `design/tokens.css` exists (T-12): forge layout check needs it.
- pwa-check: 1 FAIL "manifest id" stays on purpose (`gg-counter-pwa-v1` = installed copies; DECISIONS 2026-11-19).
- `.github/instructions/*.md` (old Copilot rules) contradict the forge rules — waiting for Moni: keep or remove.
