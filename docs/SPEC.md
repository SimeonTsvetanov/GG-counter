# SPEC — GG Counter

> Status: **approved 2026-11-19 by Moni** (as-is behaviour + the 2026-11-19 migration decisions) · written by `/migrate-app`
> from the code at `83fd838`. Facts only; "TO CONFIRM" marks what Moni must confirm.

## 1. Problem and users
- Problem: keeping score by hand during a board-game night is slow and error-prone.
- Who uses it: people at a table with one phone (Carcassonne, Star Realms, any point game).
- Example: add "Ana", "Boris" → tap +/− or enter "+12" → leaderboard shows 🥇 Ana 34, 🥈 Boris 27.

## 2. Reuse
- Catalog: none reused. After migration `packages/core` holds the score logic (private package).

## 3. Features (as-is; each becomes a characterization test before any change)
| ID | Feature | Acceptance |
|---|---|---|
| F1 | Add a player by name; empty name → "Player N" | AC1: adding "" as the 3rd player creates "Player 3" with score 0 |
| F2 | Rename and remove a player (remove asks to confirm) | AC2: removed player is gone after reload |
| F3 | Change a score: +1 / −1 buttons, and a dialog for a custom amount | AC3: +1, −1 and a custom +12 give the exact sum |
| F4 | Leaderboard sorted by score with 🥇🥈🥉, total score and player count | AC4: order and totals match the scores |
| F5 | Share the leaderboard as text (Web Share, else clipboard) | AC5: text equals the format in §4 for a fixed game |
| F6 | Reset all scores (confirm) and clear the session (confirm) | AC6: reset keeps players at 0; clear removes all |
| F7 | Everything is saved on the device and restored after reload | AC7: state written by the **old** app loads unchanged in the new one |
| F8 | Light / dark / system theme | AC8: choice survives reload |
| F9 | Installable PWA, works offline; online/offline indicator | AC9: loads offline after first visit; installed copy keeps working after the update |

## 4. Usage modes and public interfaces (must not change — migrate §1)
- Hosting: standard (GitHub Pages). **URL stays `https://simeontsvetanov.github.io/GG-counter/`** (Moni 2026-11-19).
- Modes after migration: browser only. No URL parameters, no embed, no API, no MCP (DECISIONS 2026-11-19).
- Storage keys (localStorage, shared origin): `gg-counter/state` =
  `{ players: [{ id, name, score, createdAt }], lastUpdated, version: 1 }` · `theme` = `light|dark|system`
  (un-namespaced — collides with any other app on the origin; migrated to a namespaced key, old value kept until verified).
- PWA: manifest `id: "gg-counter-pwa-v1"`, `start_url` and `scope` `/GG-counter/`, service worker `sw.js`, cache id `gg-counter`.
- Share text: `🏆 GG Counter Leaderboard` / one line per player `🥇 1st — Ana (34 pts)` / `🎯 Total score` / `👥 Players` / `🕒 Snapshot`.

## 5. Data and storage
- Stored: players and scores, theme → tier: prefs (localStorage) · export/import: no today (added by the shell's Settings).
- Nothing leaves the device; no analytics, no network calls except loading the app.

## 6. UI
- **Level 2 — React stays** (Moni 2026-11-19; existing app, see DECISIONS). Languages: English + Bulgarian (new).
- Accent today `#1F4ED8`; logo `public/favicon.svg` (meeple). Screens: one main screen, dialogs.

## 7. Limits and performance
- Limits (Moni 2026-11-19): 50 players, 40-character names, scores −999,999…999,999 — for new input; older saved games load unchanged.
- Targets: LCP ≤ 2.5 s, INP ≤ 200 ms, CLS ≤ 0.1; critical path ≤ 170 KB compressed; first-load JS budget for Level 2 TO CONFIRM after the first clean build.

## 8. Legal and AI layers
- New: Terms, Privacy, AI notice, Legal notice, Support pages and Help (Moni 2026-11-19). No personal data processed by us; contact email tsvetanov.simeon@gmail.com (Moni 2026-11-19). MIT licence (README states it; no LICENSE file in the repo — add).

## 9. Acceptance and risks
- Done when: AC1–AC9 pass on the live URL with data created by the old version; forge checks at 0 FAIL; baseline → after numbers recorded.
- Risks: installed PWAs during the service-worker change; the un-namespaced `theme` key; removing 2,189 tracked `node_modules` files from git history is **not** planned (only untracking).
