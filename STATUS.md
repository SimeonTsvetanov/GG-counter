# STATUS — GG Counter

**Updated:** 2026-11-20 (T-17: version 1.2.0) · **Phase:** 1.1.0 live; 1.2.0 built, not yet released (SPEC §11; PLAN T-17 done)

## Done
- Migration (2026-11-19): T-01 characterization flows; T-02/T-03 pnpm 12, supply chain, `LICENSE`, forge ESLint, `pnpm verify`,
  CI + CodeQL; T-04 workspace `app/` + `packages/core`; T-05 split by feature; T-06 `app.config.ts` → head, page text, sitemap,
  llms.txt, robots, 404; T-07 storage only in `app/src/storage/` (`gg-counter:v1:*`, verified copy of the old keys); T-08 shell;
  T-09 English + Bulgarian; T-10 legal dialogs + pages; T-12 forge tokens, Tailwind 4. Deployed + checked live (84 e2e passed).
- T-14: sitemap `lastmod` per source; `docs/migration/after-2026-11-19.md`; GEO snapshot; version 1.0.0; JS budget 125 KB gzip;
  user docs (`docs/index.md`, how-tos, reference, about; generated light/dark screenshots; `docs:check` in verify + CI; wiki mirror).
- 1.1.0 (T-15/T-16): clear/delete alerts with a choice; score history (core, game v2, exports); last-changes line → history
  sheet (× + Restore); last-scored tint; medals 🥇🥈🥉 (ties share); compact cards from 5 players; docs + images.
- T-17 (1.2.0): the Add/rename field stays between header and keyboard (focus, each Add, keyboard resize); quiet motion
  (cards in/out + settle, score roll, line, medals, tint, leaderboard/history rows; reduced motion = fades); new share text
  with the app link (EN + BG); no pill, raised last-scored card, bigger score (52 px target, same card height). JS 123.8 KB.

## Next
- Moni: 1.2.0 review (share text, motion video, keyboard on a real phone), "release approved" → push, deploy, check live;
  tags `v1.0.0`, `v1.1.0`, `v1.2.0`.
- Forge `apps.json` entry (orchestrator). After the push: Docs → Wiki run — Moni enables Wikis + creates the first wiki page once.
- Release gates (PLAN T-14): security-check 1 FAIL left — React DOM's own `innerHTML` in the bundle (library code;
  needs a forge-script allowlist); GitHub repo settings (Dependabot updates, private vulnerability reporting, ruleset on `main`).
- Moni: `legal-reviewer` items (DECISIONS T-10). T-13 (Radix → Base UI) optional. Old keys: not before 2026-12-19 (PLAN §4).

## Blockers / open
- pwa-check: 1 FAIL "manifest id" stays on purpose (`gg-counter-pwa-v1` = installed copies; DECISIONS 2026-11-19).
- JS budget is checked by perf-check at release, not in CI (no Lighthouse CI yet — PLAN §4 follow-up).
- `.github/instructions/*.md` (old Copilot rules) contradict the forge rules — waiting for Moni: keep or remove.
- Not checked on a real phone: VoiceOver/TalkBack (history line, medals, sheet); 1.2 keyboard reveal on iOS Safari (Moni).
