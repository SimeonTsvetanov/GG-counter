# STATUS — GG Counter

**Updated:** 2026-11-19 (T-12) · **Phase:** migration into the forge (`flow` → migrate) · live pre-forge app unchanged for users

## Done
- Migration steps 1–4 (baseline, SPEC, DECISIONS, PLAN) approved 2026-11-19. T-01: 8 characterization flows ×
  desktop + phone. T-02/T-03: pnpm 12 + supply chain, `LICENSE`, forge ESLint, `pnpm verify`, CI + CodeQL.
- T-04 workspace `app/` + `packages/core` (100 % lines; limits 50/40/±999,999); T-05 split by feature (JS 110.6 KB);
  T-06 `app.config.ts` → head/OG/JSON-LD, raw-HTML page text, sitemap, llms.txt, robots, 404 (geo-check 0 FAIL);
  T-07 storage only in `app/src/storage/`, `gg-counter:v1:*` keys, verified copy of the old keys (kept until T-14).
- T-08 shell (`app/src/ui/`, from `app.config.ts` `shell`): menu, Settings (theme, export/import/clear), Help,
  What's new, About, Report a problem, footer, update toast (prompt, handover for old auto-update copies),
  error screen, limit messages; texts in `app/src/i18n/en.ts`. 222 Vitest, 52 e2e, JS 118.8 KB; a11y 0 FAIL.
- T-09 English + Bulgarian (i18next, lazy `bg.ts`, Settings → Language, `?lang=`, saved `gg-counter:v1:lang`); Bulgarian
  share text, English byte for byte; JSX UI-text lint rule. 287 Vitest, 72 e2e; a11y (bg) 0 FAIL; JS 136.2 KB.
- T-10 legal: Terms, Privacy (+ Art. 13 block for email/issues), AI notice (Variant A), Legal notice, Support from
  `content/legal/*.md` → lazy dialogs (menu About group, footer, Help, `#privacy`…) + standalone `/GG-counter/<page>/`
  (offline, sitemap); `third-party-licenses.txt`, generated `LICENSE`. 315 Vitest, 86 e2e; compliance-check 0 FAIL; JS 136.8 KB.
- T-12 forge look: `design/tokens.css` + generated accent, Tailwind 4, component CSS; same tokens on policy/404 pages;
  links without underline; header menus lazy → first-load JS 118.2 KB. 332 Vitest, 86 e2e; a11y 0 FAIL (en + bg, all dialogs).

## Next
- Moni reviews the T-12 screenshot matrix and confirms the Level 2 JS budget (125 KB proposed); then T-13 (optional) / T-14.
- `legal-reviewer` verdict on T-10; Moni/lawyer items in DECISIONS 2026-11-19 (T-10).

## Blockers / open
- Group a (T-01–T-03) deployed 2026-11-19; T-04–T-08 not deployed yet (CI deploys `app/dist` now).
- pwa-check: 1 FAIL "manifest id" stays on purpose (`gg-counter-pwa-v1` = installed copies; DECISIONS 2026-11-19).
- seo-check against the preview: canonical + "sitemap URLs 200" FAIL until deployed (live URLs; policy pages not live yet).
- `.github/instructions/*.md` (old Copilot rules) contradict the forge rules — waiting for Moni: keep or remove.
