# STATUS — GG Counter

**Updated:** 2026-11-22 (1.2.4 prepared: the game screen is a mini-app package for Quizzard, no visible change) · **Phase:** 1.2.3 live; Quizzard PLAN GG-01…GG-03 done locally, not pushed

## Done
- Migration (2026-11-19, PLAN T-01…T-12, T-14): characterization e2e, pnpm 12 + supply chain, workspace, `app.config.ts` as the
  single source, namespaced storage with a verified copy of the old keys, shell, EN + BG, legal, forge tokens; version 1.0.0,
  JS budget 125 KB gzip, user docs + generated light/dark screenshots + wiki mirror. Deployed + checked live.
- 1.1.0 (T-15/T-16): clear/delete alerts with a choice; score history (core, game v2, exports); last-changes line → history
  sheet (× + Restore); last-scored tint; medals 🥇🥈🥉 (ties share); compact cards from 5 players; docs + images.
- T-17 (1.2.0): the Add/rename field stays between header and keyboard (focus, each Add, keyboard resize); quiet motion
  (cards in/out + settle, score roll, line, medals, tint, leaderboard/history rows; reduced motion = fades); new share text
  with the app link (EN + BG); no pill, raised last-scored card, bigger score (52 px target, same card height). JS 123.8 KB.
- Quizzard GG-01…03 (1.2.4): host seam; `packages/miniapp` behind the mini-app contract (history sheet + choice alerts lazy,
  JS 124.3 KB); e2e split `tests/e2e/miniapp` (38/project, also green against live 1.2.3) + `shell` (37); screens.json `scope`.

## Next
- Moni: "release approved" for 1.2.4 → push, deploy, check live, tag `v1.2.4` (Quizzard T-12 pins the submodule to it).
- No release tags exist yet (`v1.0.0` … `v1.2.3`); Moni decides whether to tag the old ones too.
- Forge `apps.json` entry (orchestrator). After the push: Docs → Wiki run — Moni enables Wikis + creates the first wiki page once.
- Release gates (PLAN T-14): security-check 1 FAIL left — React DOM's own `innerHTML` in the bundle (library code;
  needs a forge-script allowlist); GitHub repo settings (Dependabot updates, private vulnerability reporting, ruleset on `main`).
- Moni: `legal-reviewer` items (DECISIONS T-10). T-13 (Radix → Base UI) optional. Old keys: not before 2026-12-19 (PLAN §4).

## Blockers / open
- Not run yet: the miniapp suite inside Quizzard and on WebKit/Firefox (Quizzard T-13; host.ts Quizzard entries unverified).
  Forge a11y-check reloads by `goto(url)`: with a `#/scores` URL that may be a same-document hop (state kept) — check in T-13.
- pwa-check: 1 FAIL "manifest id" stays on purpose (`gg-counter-pwa-v1` = installed copies; DECISIONS 2026-11-19).
- JS budget: perf-check at release, not in CI (PLAN §4). `.github/instructions/*.md` (old Copilot rules) — Moni: keep or remove.
- Not checked on a real phone: VoiceOver/TalkBack (history line, medals, sheet); keyboard reveal on iOS Safari (Moni).
