# STATUS — GG Counter

**Updated:** 2026-11-19 · **Phase:** migration into the forge (`flow` → migrate) · live pre-forge app unchanged for users

## Done
- Migration steps 1–4: baseline, as-is SPEC, DECISIONS, PLAN — approved by Moni 2026-11-19.
- T-01 safety net: 8 characterization flows × desktop + phone (16 e2e) green on the unchanged app.
- T-02 hygiene: build output untracked, pnpm 12 + supply-chain policy, `LICENSE`. T-03 frame: forge ESLint,
  `pnpm verify`, frame files, CI → Deploy + CodeQL, Dependabot.
- T-04 workspace: app in `app/` (`gg-counter-app`, build → `app/dist`), pure logic in `packages/core`
  (`gg-counter-core`, private) with 90 Vitest + fast-check tests (100 % lines, gate 90 %); limits
  (50 players, 40-character names, ±999,999) apply to new input; layers in `structure.config.json`.
  Behaviour change: a `null` player entry in the saved game is dropped instead of losing the game.
- T-05 split by feature: `app.tsx` is a composition root; `players/`, `leaderboard/`, `session/`, `share/`;
  size-rule block deleted; screenshots identical; first-load JS 110.6 KB gzip (was 109.5).
- T-06 single source: `app.config.ts` → head/OG/JSON-LD, page text (h1, answer, steps, FAQ in raw HTML,
  shown below the leaderboard after load), manifest values, sitemap, llms.txt, robots.txt, 404 page;
  og-image committed (`pnpm og-image`). geo-check 0 FAIL; 22 e2e; first-load JS 110.7 KB gzip.
- T-07 storage: only `app/src/storage/` (ESLint); `gg-counter:v1:*` keys, verified one-time copy of the old keys
  (kept, removal PLAN T-14); export/import/clear without UI; `theme-init.js`; 176 Vitest, 30 e2e, JS 112.2 KB.

## Next
- T-08: shell (menu, Settings with export/import/clear, Help, What's new, update toast, error screen).

## Blockers / open
- Group a (T-01–T-03) deployed 2026-11-19; T-04–T-07 not deployed yet (CI deploys `app/dist` now).
- `structure.config.json` stays until `design/tokens.css` exists (T-12): forge layout check needs it.
- Limit errors from core are not shown in the UI yet (a rejected name stays in the field; a rejected
  score change is ignored) — messages come with the shell/i18n tasks (T-08/T-09).
- `.github/instructions/*.md` (old Copilot rules) contradict the forge rules — waiting for Moni: keep or remove.
