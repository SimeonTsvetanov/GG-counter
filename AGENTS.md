# AGENTS.md — GG Counter

Offline score tracker for board-game nights — a free micro-app by Simeon "Moni" Tsvetanov
(GitHub Pages PWA, React **Level 2**). Being migrated into the forge: see `docs/PLAN.md`.

## Read first
1. `STATUS.md` (current state, next step). 2. `docs/SPEC.md` + `docs/PLAN.md`. 3. `docs/DECISIONS.md`.
4. `docs/migration/baseline-2026-11-19.md` — the pre-forge numbers every later step is compared with.
5. `app.config.ts` — the single source for name, texts, FAQ, SEO, manifest values and the base path.

## Rules
- Talk to Moni in **Bulgarian**; every file, commit and issue in **English**.
- Follow the forge plugin (`forge` + `forge-standards`); this is a migration, so `flow` → migrate
  applies: same URL, same saved data, every task ends green and deployable.
  Cloud session without the plugin: read `simeonts-microapp-forge/plugins/*/skills/*/SKILL.md` for
  the area, then only the chapters it points to; agents are in `plugins/*/agents/*.md`.
- React stays (DECISIONS 2026-11-19): `engineering` → react, only the parts this app needs.
- Run `pnpm verify` before saying "done"; keep working while it fails. Never weaken a lint rule or
  a test to get green (the temporary size-rule block was removed in PLAN T-05).
- The e2e tests in `tests/e2e/` are characterization tests of the pre-forge behaviour — a change
  that breaks one is a behaviour change and needs a SPEC/DECISIONS entry first.
- Saved data: only `app/src/storage/` touches browser storage (ESLint rule). Keys `gg-counter:v1:state|theme|migrated|last-seen-version|lang`;
  the pre-forge `gg-counter/state` and `gg-counter-theme` are copied once and never written — removal per PLAN T-14.
- Moni corrects/dislikes something → apply it and add an entry to `LEARNINGS.md`.
- Decisions → `docs/DECISIONS.md` (date · decision · reason) the same day. Update `STATUS.md` (≤ 30 lines).
- Never hand-edit generated files (git-ignored, `pnpm generate`): `app/public/{sitemap.xml,llms.txt,robots.txt,404.html,
  not-found.css,theme-init.js,sw-handover.js,tokens.css,policy-page.css,year.js,third-party-licenses.txt}`, the policy pages
  `app/public/<page>/`, `app/src/generated/accent.css`; nor the repo `LICENSE` (committed) and the `<!--app-*-->` text of
  `app/index.html`. Edit `app.config.ts`, `content/legal/*.md`, `design/tokens.css` or the `scripts/*.ts` builders instead.
  `app/public/og-image.png` is committed: `pnpm og-image` after a name, tagline, accent or logo change.
- Look (PLAN T-12): every value from `design/tokens.css` (forge) + the accent of `app.config.ts`; CSS in
  `app/src/styles/` (`app.css` layer order, `theme.css` = Tailwind 4 `@theme inline reference`, one file per component);
  shadcn components in `src/components/ui/` map props to those classes; utilities in JSX only place things.
- Legal texts (PLAN T-10) must match the code: a change to storage, sharing, reporting, hosting or a new third party
  updates `content/legal/privacy.md` (+ its "Last updated") in the same commit; run the forge `compliance-check.mjs`.
- User docs (PLAN T-14, forge `user-docs`): English pages in `docs/index.md`, `docs/how-to|reference|about/`, written by `docs-writer`
  at every release; a user-visible change (UI text, limit, setting, flow) updates the page in the same change. Images are generated
  (`tests/docs/shots.ts` → `pnpm docs:images`, light + dark), never hand-made; UI labels in the pages are copied from `app/src/i18n/en.ts`.

## Where things are (workspace since PLAN T-04, features since T-05)
```
packages/core   gg-counter-core (private): pure score logic + Vitest/fast-check; test/fixtures/ (also used by tests/e2e)
app/src/        app.tsx (composition root); players/ (cards, history sheet), leaderboard/, session/ (header, actions, alerts), share/;
                ui/ = app shell (menu + lazy header menus, shell dialogs, Settings, footer, toasts, pwa.ts, error screen);
                i18n/ (en.ts = every UI text, bg.ts lazy, no JSX string literals); storage/ (the only storage access);
                styles/ (CSS layers), components/ui/ (vendored shadcn/Radix), hooks/, lib/, providers/ (theme), config.ts
app/test/       storage/, ui/, lib/ unit tests         tests/e2e  Playwright (desktop + phone; en-US, i18n.spec bg-BG)
design/         tokens.css (forge)                  tests/a11y screens.json for the forge a11y-check (--screens)
docs/           SPEC, PLAN, DECISIONS (dev) · index.md, how-to/, reference/, about/, images/ = user docs (English)
tests/docs/     shots.ts + docs-images.spec.ts → docs/images (pnpm docs:images; playwright.docs.config.ts)
content/legal/  policy sources → scripts/legal.ts → lazy dialogs + standalone pages (scripts/legal-page.ts)
scripts/        generate.ts, csp (the one meta CSP), seo, sitemap, static-page, config-check, changelog, credits, sw-handover, legal(-page), licenses,
                check-docs.ts (docs:check), docs-to-wiki.mjs (+ .github/workflows/docs-wiki.yml: docs/ → GitHub Wiki mirror),
                accent.ts (forge copy), tokens.ts (hex of tokens), og-image.ts; page-assets/ (404 + policy CSS, licences)
app.config.ts   single source (T-06; `shell` T-08; `l10n.bg` T-09)   app/vite.config.ts  base, head text, manifest, Tailwind
```

## Commands
`pnpm i` · `pnpm dev` · `pnpm generate` (also before dev/build/verify) · `pnpm og-image` ·
`pnpm docs:check` (links, alt text, light/dark twins, orphan images) · `pnpm docs:images` (builds, then writes docs/images light + dark) ·
`pnpm verify` (generate + lint + typecheck + test + docs:check + build + e2e) · `pnpm lint` ·
`pnpm typecheck` (`tsc -b`: core, app, Vite config, scripts, tests, tool configs) · `pnpm test` (Vitest: core + app storage ≥ 90 % lines + generator; then `node --test` for docs-to-wiki) ·
`pnpm build` (→ `app/dist`) · `node …/structure-check.mjs --repo .` (forge defaults) · `node …/a11y-check.mjs <url> --screens tests/a11y/screens.json` ·
`pnpm e2e` (needs `pnpm build`; serves `app/dist` with `vite preview`)
