# DECISIONS — GG Counter

Format: date · decision · reason.

- **2026-11-19 · Migrate into the forge instead of rebuilding (Moni: "full makeover, as if the forge made it").** The app has users and saved data, so `flow` → migrate applies: same URL, same saved data, small deployable steps.
- **2026-11-19 · Same repo and same URL `…/GG-counter/` (Moni).** Installed copies keep working. Consequence: app id `gg-counter` (kebab-case, storage namespace, npm names) differs from the URL path `/GG-counter/`; the app sets its base path explicitly. Exception to the forge rule "id = repo name = URL", recorded in the forge too.
- **2026-11-19 · React stays — Level 2 (Moni).** Existing screens are kept; a UI rewrite is not part of the migration. From `engineering` → react only what this small app needs: React 19, Tailwind mapped to `design/tokens.css`, i18next. Not used (no need): router, TanStack Query, Zustand, React Hook Form, Dexie. Radix → Base UI and Tailwind 3 → 4 are separate tasks at the end of the plan, each deployable on its own.
- **2026-11-19 · Scope added (Moni): Bulgarian, local MCP server, legal pages + Help.** No other new features.

- **2026-11-19 · Plan approved; Moni: "go, no need to approve anything, you decide; check that everything works after the changes".** Tasks run in order; each ends green; the live URL is checked after every deployed group.
- **2026-11-19 · Contact email on the legal pages: tsvetanov.simeon@gmail.com (Moni).**
- **2026-11-19 · Limits (Moni: as proposed):** up to 50 players, names up to 40 characters, scores from −999,999 to 999,999. Saved games that exceed them still load unchanged; the limits apply to new input.
- **2026-11-19 · No MCP server (Moni: "no point here").** An MCP server cannot reach the game saved in the browser, so it would add nothing. Supersedes the scope line above. `packages/core` stays a private workspace package — nothing is published to npm.
- 2026-11-19 · Saved data lives under `gg-counter:v1:state|theme`, copied once from the pre-forge keys (`gg-counter/state`, `gg-counter-theme`) before the first render; marker `gg-counter:v1:migrated`; the new key wins when both exist · forge storage namespace on a shared origin (`simeontsvetanov.github.io`), without losing any existing game. Checked with a real update: game + dark theme created in the build of `f636cb1`, then the T-07 build served on the same origin and path — players, scores and theme survived; the new app never wrote the old keys.
- 2026-11-19 · The old keys are never written or deleted by this release; they are removed only in a separate release at least 30 days after T-07 is live (PLAN T-14 records the date) · a user who opens the app rarely must still find the old copy, and a rollback of the deploy must still find its data.
- 2026-11-19 · `theme-init.js` (generated, precached) sets the theme class before the first paint · no flash of the wrong theme; an external file keeps a future CSP free of inline script.
- 2026-11-19 · The AC7/AC8 e2e tests remove the `gg-counter:v1:*` keys before they seed the old key, and read the saved game from the new key; their assertions are unchanged · they keep proving "first load after the update" now that the app writes only the new keys.
