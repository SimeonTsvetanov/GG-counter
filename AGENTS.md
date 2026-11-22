# AGENTS.md — GG Counter

Offline score tracker for board-game nights — a free micro-app by Simeon "Moni" Tsvetanov
(GitHub Pages PWA, React **Level 2**). Being migrated into the forge: see `docs/PLAN.md`.

## Read first
1. `STATUS.md`. 2. `docs/SPEC.md` + `docs/PLAN.md`. 3. `docs/DECISIONS.md`. 4. `docs/migration/baseline-2026-11-19.md` (pre-forge
numbers). 5. `app.config.ts` — the single source for name, texts, FAQ, SEO, manifest values and the base path.

## Rules
- Talk to Moni in **Bulgarian**; every file, commit and issue in **English**.
- Follow the forge plugin (`forge` + `forge-standards`); `flow` → migrate applies: same URL, same saved data, every task ends
  green and deployable. Cloud session without the plugin: read `simeonts-microapp-forge/plugins/*/skills/*/SKILL.md` for the
  area, then only the chapters it points to; agents are in `plugins/*/agents/*.md`.
- React stays (DECISIONS 2026-11-19): `engineering` → react, only the parts this app needs.
- Run `pnpm verify` before saying "done"; keep working while it fails. Never weaken a lint rule or a test to get green.
- The e2e tests in `tests/e2e/` are characterization tests — a change that breaks one is a behaviour change and needs
  a SPEC/DECISIONS entry first. `miniapp/` specs open the screen only through `support/` (ESLint): Quizzard runs them.
- Saved data: only `packages/miniapp/src/storage/` and `app/src/storage/` touch browser storage (ESLint). Keys `gg-counter:v1:state|theme|migrated|last-seen-version|lang`;
  the pre-forge `gg-counter/state` and `gg-counter-theme` are copied once and never written — removal per PLAN T-14.
- Moni corrects/dislikes something → apply it + a `LEARNINGS.md` entry. Decisions → `docs/DECISIONS.md` (date · decision ·
  reason) the same day. Update `STATUS.md` (≤ 30 lines).
- Never hand-edit generated files (git-ignored, `pnpm generate`): `app/public/{sitemap.xml,llms.txt,robots.txt,404.html,
  not-found.css,theme-init.js,sw-handover.js,tokens.css,policy-page.css,year.js,third-party-licenses.txt}`, the policy pages
  `app/public/<page>/`, `app/src/generated/accent.css`; nor the repo `LICENSE` (committed) and the `<!--app-*-->` text of
  `app/index.html`. Edit `app.config.ts`, `content/legal/*.md`, `design/tokens.css` or the `scripts/*.ts` builders instead.
  `app/public/og-image.png` is committed: `pnpm og-image` after a name, tagline, accent or logo change.
- Look (PLAN T-12): every value from `design/tokens.css` (forge) + the accent of `app.config.ts`; CSS in `app/src/styles/`
  and `packages/miniapp/src/styles/` (layer order, `theme.css` = Tailwind 4 `@theme inline reference`, one file per component);
  shadcn components in `src/components/ui/` map props to those classes; utilities in JSX only place things.
- Legal texts (PLAN T-10) must match the code: a change to storage, sharing, reporting, hosting or a new third party
  updates `content/legal/privacy.md` (+ its "Last updated") in the same commit; run the forge `compliance-check.mjs`.
- User docs (PLAN T-14, forge `user-docs`): English pages in `docs/index.md`, `docs/how-to|reference|about/`, written by `docs-writer`
  at every release; a user-visible change (UI text, limit, setting, flow) updates the page in the same change. Images are generated
  (`tests/docs/shots.ts` → `pnpm docs:images`, light + dark), never hand-made; UI labels in the pages are copied from `app/src/i18n/en.ts`.

## Where things are (workspace since PLAN T-04; game screen = package since Quizzard PLAN GG-02)
```
packages/core     gg-counter-core: pure score logic + Vitest/fast-check; test/fixtures/ = saved games (also used by e2e)
packages/miniapp  gg-counter-miniapp: the game screen behind the Quizzard mini-app contract (mount, meta, help, host-api,
                  vite-preset); players/, leaderboard/, session/, share/, storage/ (game keys), i18n/, lib/ (motion, reveal)
app/src/          standalone shell: app.tsx, miniapp/ (context + mount of the screen on <main>), ui/ (menu, dialogs, Settings,
                  footer, toasts, pwa.ts, error screen), i18n/, storage/ (page prefs), styles/ (CSS layers), components/ui/
tests/e2e/        miniapp/ (screen flows, also run by Quizzard at #/scores) · shell/ (standalone only) · support/ (entry.ts:
                  openApp/reloadApp/seedStorage; host.ts: the one host switch) — desktop + phone
tests/a11y/       screens.json (`scope`: miniapp | shell) · tests/docs/ shots.ts → docs/images · unit tests: app/test, packages/*/test
docs/             SPEC, PLAN, DECISIONS (dev) · index.md, how-to/, reference/, about/, images/ = user docs (English)
content/legal/    policy sources → scripts/legal.ts → lazy dialogs + standalone pages (scripts/legal-page.ts)
scripts/          generate.ts + builders (csp, seo, sitemap, static-page, legal, licenses, changelog, …), config-check,
                  check-docs.ts, docs-to-wiki.mjs (→ GitHub Wiki), accent.ts, tokens.ts, og-image.ts; page-assets/
app.config.ts     single source · design/tokens.css (forge) · app/vite.config.ts: base, head text, manifest, Tailwind
```

## Commands
`pnpm i` · `pnpm dev` · `pnpm generate` (also before dev/build/verify) · `pnpm og-image` ·
`pnpm docs:check` (links, alt text, light/dark twins, orphan images) · `pnpm docs:images` (builds, then writes docs/images light + dark) ·
`pnpm verify` (generate + lint + typecheck + test + docs:check + build + e2e) · `pnpm lint` ·
`pnpm typecheck` (`tsc -b`: core, app, Vite config, scripts, tests, tool configs) · `pnpm test` (Vitest: core + app storage ≥ 90 % lines + generator; then `node --test` for docs-to-wiki) ·
`pnpm build` (→ `app/dist`) · `node …/structure-check.mjs --repo .` (forge defaults) · `node …/a11y-check.mjs <url> --screens tests/a11y/screens.json` ·
`pnpm e2e` (needs `pnpm build`; serves `app/dist` with `vite preview`; one suite: `pnpm e2e:miniapp|e2e:shell`)
