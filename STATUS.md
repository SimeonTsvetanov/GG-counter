# STATUS — GG Counter

**Updated:** 2026-11-19 · **Phase:** migration into the forge (`flow` → migrate) · live pre-forge app unchanged for users

## Done
- Migration steps 1–4: baseline, as-is SPEC, DECISIONS, PLAN — approved by Moni 2026-11-19.
- T-01 safety net: 8 characterization flows × desktop + phone (16 e2e) green on the unchanged app.
- T-02 repo hygiene: build output untracked, npm → pnpm 12 with the supply-chain policy, `LICENSE`.
- T-03 forge frame: forge ESLint rules, `pnpm verify`, frame files, CI → Deploy + CodeQL, Dependabot.
- T-04 workspace: app in `app/` (`gg-counter-app`, build → `app/dist`), pure logic in `packages/core`
  (`gg-counter-core`, private) with 90 Vitest + fast-check tests (100 % lines, gate 90 %); limits
  (50 players, 40-character names, ±999,999) apply to new input; layers in `structure.config.json`.
  Behaviour change: a `null` player entry in the saved game is dropped instead of losing the game.

## Next
- T-05: split `app/src/app.tsx` by feature; delete the temporary size-rule block in `eslint.config.js`.

## Blockers / open
- Group a (T-01–T-03) deployed 2026-11-19; T-04 not deployed yet (CI deploys `app/dist` now).
- Limit errors from core are not shown in the UI yet (a rejected name stays in the field; a rejected
  score change is ignored) — messages come with the shell/i18n tasks (T-08/T-09).
- `.github/instructions/*.md` (old Copilot rules) contradict the forge rules — waiting for Moni: keep or remove.
