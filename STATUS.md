# STATUS — GG Counter

**Updated:** 2026-11-19 · **Phase:** migration into the forge (`flow` → migrate) · live pre-forge app unchanged for users

## Done
- Migration steps 1–4: baseline, as-is SPEC, DECISIONS, PLAN — approved by Moni 2026-11-19.
- T-01 safety net: 8 characterization flows × desktop + phone (16 e2e) green on the unchanged app.
- T-02 repo hygiene: build output untracked, npm → pnpm 12 with the supply-chain policy, `LICENSE`.
- T-03 forge frame: lint green with the forge ESLint rules (size rules off only for `src/app.tsx` and
  `src/components/player-card.tsx` until T-05), `pnpm verify`, AGENTS/STATUS/LEARNINGS/CHANGELOG/
  SECURITY, `service.json`, CI (`ci.yml`, `deploy.yml` after CI, `codeql.yml`), Dependabot.

## Next
- T-04: workspace layout — `packages/core` (score logic, tests first) and the app moved to `app/`.

## Blockers / open
- None. Group a (T-01–T-03) deployed 2026-11-19 through the new CI → Deploy; the 16 e2e tests pass
  against the live URL (`E2E_BASE_URL=https://simeontsvetanov.github.io/GG-counter/ pnpm e2e`).
- `.github/instructions/*.md` (old Copilot rules) contradict the forge rules — waiting for Moni: keep or remove.
