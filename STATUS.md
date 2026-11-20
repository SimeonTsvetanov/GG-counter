# STATUS — GG Counter

**Updated:** 2026-11-20 (T-15: 1.1 part A) · **Phase:** after the migration (1.0.0) → 1.1 in progress (SPEC §10; PLAN T-15 done, T-16 next)

## Done
- Migration (2026-11-19): T-01 characterization flows; T-02/T-03 pnpm 12, supply chain, `LICENSE`, forge ESLint, `pnpm verify`,
  CI + CodeQL; T-04 workspace `app/` + `packages/core`; T-05 split by feature; T-06 `app.config.ts` → head, page text, sitemap,
  llms.txt, robots, 404; T-07 storage only in `app/src/storage/` (`gg-counter:v1:*`, verified copy of the old keys); T-08 shell;
  T-09 English + Bulgarian; T-10 legal dialogs + pages; T-12 forge tokens, Tailwind 4. Deployed + checked live (84 e2e passed).
- T-14: sitemap `lastmod` per source; `docs/migration/after-2026-11-19.md`; GEO snapshot; version 1.0.0; JS budget 125 KB gzip;
  user docs (`docs/index.md`, how-tos, reference, about; generated light/dark screenshots; `docs:check` in verify + CI; wiki mirror).
- T-15 (1.1 part A, 2026-11-20, unreleased): one "what to clear" alert with a choice (Clear session / Reset scores, a player's
  delete button); score history in core (merge ≤ 3 s, cap 50, base derived) saved as game version 2 + in exports; Privacy updated.

## Next
- T-16 (1.1 part B): last changes line, history sheet with ×, last-scored highlight, rank badges, denser cards → then 1.1.0.
- Forge `apps.json` entry (orchestrator). After the push: Docs → Wiki run — Moni enables Wikis + creates the first wiki page once.
- Release gates (PLAN T-14): security-check 1 FAIL left — React DOM's own `innerHTML` in the bundle (library code;
  needs a forge-script allowlist); GitHub repo settings (Dependabot updates, private vulnerability reporting,
  ruleset on `main`); reviews. Meta CSP done 2026-11-19 (`scripts/csp.ts`, `tests/e2e/csp.spec.ts`, DECISIONS).
- Moni: screenshot matrix (T-12), `legal-reviewer` items (DECISIONS T-10), "release approved", then tag `v1.0.0`.
- T-13 (Radix → Base UI) optional — Moni decides. Old-key removal release not before 2026-12-19 (PLAN §4).

## Blockers / open
- pwa-check: 1 FAIL "manifest id" stays on purpose (`gg-counter-pwa-v1` = installed copies; DECISIONS 2026-11-19).
- JS budget is checked by perf-check at release, not in CI (no Lighthouse CI yet — PLAN §4 follow-up).
- `.github/instructions/*.md` (old Copilot rules) contradict the forge rules — waiting for Moni: keep or remove.
