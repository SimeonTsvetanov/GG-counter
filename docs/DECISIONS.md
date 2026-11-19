# DECISIONS — GG Counter

Format: date · decision · reason.

- **2026-11-19 · Migrate into the forge instead of rebuilding (Moni: "full makeover, as if the forge made it").** The app has users and saved data, so `flow` → migrate applies: same URL, same saved data, small deployable steps.
- **2026-11-19 · Same repo and same URL `…/GG-counter/` (Moni).** Installed copies keep working. Consequence: app id `gg-counter` (kebab-case, storage namespace, npm names) differs from the URL path `/GG-counter/`; the app sets its base path explicitly. Exception to the forge rule "id = repo name = URL", recorded in the forge too.
- **2026-11-19 · React stays — Level 2 (Moni).** Existing screens are kept; a UI rewrite is not part of the migration. From `engineering` → react only what this small app needs: React 19, Tailwind mapped to `design/tokens.css`, i18next. Not used (no need): router, TanStack Query, Zustand, React Hook Form, Dexie. Radix → Base UI and Tailwind 3 → 4 are separate tasks at the end of the plan, each deployable on its own.
- **2026-11-19 · Scope added (Moni): Bulgarian, local MCP server, legal pages + Help.** No other new features.

## Open (need Moni)
- Contact email shown on the legal pages.
- Limits in SPEC §7 (players, name length, score range).
- MCP tool shape: proposed one pure tool `rank_scores` (players + scores in → sorted leaderboard and share text out); the app's saved game is not reachable from an MCP server.
- npm package names: `@simeonts/gg-counter-core` and `@simeonts/gg-counter-mcp`.
