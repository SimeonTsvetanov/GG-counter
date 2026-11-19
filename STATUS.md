# STATUS — GG Counter

**Updated:** 2026-11-19 (T-14 part) · **Phase:** migration into the forge (`flow` → migrate) → release 1.0.0 prepared, not published

## Done
- Migration steps 1–4 (baseline, SPEC, DECISIONS, PLAN) approved 2026-11-19. T-01: 8 characterization flows ×
  desktop + phone. T-02/T-03: pnpm 12 + supply chain, `LICENSE`, forge ESLint, `pnpm verify`, CI + CodeQL.
- T-04 workspace `app/` + `packages/core`; T-05 split by feature; T-06 `app.config.ts` → head/OG/JSON-LD, page text,
  sitemap, llms.txt, robots, 404; T-07 storage only in `app/src/storage/`, `gg-counter:v1:*` keys, verified copy of the old keys.
- T-08 shell (menu, Settings, Help, What's new, About, Report a problem, footer, update toast, error screen);
  T-09 English + Bulgarian; T-10 legal dialogs + standalone pages; T-12 forge tokens, Tailwind 4, forge look.
- T-01…T-12 deployed and checked live 2026-11-19 (live e2e 84 passed / 2 skipped).
- T-14 part: sitemap `lastmod` per source (`scripts/sitemap.ts`); `docs/migration/after-2026-11-19.md` (before → after);
  GEO snapshot `docs/geo/2026-11-19.md`; version 1.0.0 + dated CHANGELOG; JS budget 125 KB gzip recorded.
  336 Vitest, 86 e2e; first-load JS 118.3 KB; a11y 0 FAIL (en + bg); compliance 0 FAIL; structure 13/13.

## Next
- `docs-writer`: user docs (`docs/how-to|reference|about`); forge `apps.json` entry (orchestrator).
- Release gates (PLAN T-14): security-check FAIL — meta CSP on `index.html`/`404.html`, React DOM `innerHTML` in the
  bundle, GitHub repo settings (Dependabot updates, private vulnerability reporting, ruleset on `main`); reviews.
- Moni: screenshot matrix (T-12), `legal-reviewer` items (DECISIONS T-10), "release approved", then tag `v1.0.0`.
- T-13 (Radix → Base UI) optional — Moni decides. Old-key removal release not before 2026-12-19 (PLAN §4).

## Blockers / open
- pwa-check: 1 FAIL "manifest id" stays on purpose (`gg-counter-pwa-v1` = installed copies; DECISIONS 2026-11-19).
- JS budget is checked by perf-check at release, not in CI (no Lighthouse CI yet — PLAN §4 follow-up).
- `.github/instructions/*.md` (old Copilot rules) contradict the forge rules — waiting for Moni: keep or remove.
