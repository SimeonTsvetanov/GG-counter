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
| F1 | Add a player by name (trimmed); an empty name adds nobody | AC1: "Ana", "  Boris  ", "   " → two players, score 0 |
| F2 | Rename (saved on Enter or blur; max 40 characters since PLAN T-08, was 32) and remove a player (remove asks to confirm; 1.1: with a choice, F14) | AC2: removed player is gone after reload |
| F3 | Change a score: +1 / −1 buttons, and a dialog for a custom amount | AC3: +1, −1 and a custom +12 give the exact sum |
| F4 | Leaderboard sorted by score with 🥇🥈🥉, total score and player count | AC4: order and totals match the scores |
| F5 | Share the leaderboard as text (Web Share, else clipboard) | AC5: text equals the format in §4 for a fixed game |
| F6 | Reset all scores (confirm) and clear the session (confirm) — 1.1: one alert with a choice (F13) | AC6: reset keeps players at 0; clear removes all |
| F7 | Everything is saved on the device and restored after reload | AC7: state written by the **old** app loads unchanged in the new one |
| F8 | Light / dark / system theme (Settings; the header theme button from 640 px up — phones use Settings since T-08) | AC8: choice survives reload |
| F9 | Installable PWA, works offline; online/offline indicator; a new version waits for the user's Reload (T-08) | AC9: loads offline after first visit; installed copy keeps working after the update |
| F10 | App shell (T-08): menu (Help, Settings, What's new, Share app, Install app, Report a problem, About, Support ☕, Source code), footer (version → What's new, More free tools, © current year), update toast, error screen | AC10: menu opens/closes with the keyboard; Settings export → clear → import gives back the same game; the error screen replaces a crash |
| F11 | Limit messages (T-08): too many players, name too long, score out of range say why under the field; a blank name or a non-number is still ignored silently | AC11: each limit shows its message and changes nothing |
| F12 | Policy pages (T-10): Terms, Privacy, AI notice, Legal notice, Support (menu "Contact") from `content/legal/*.md` — dialogs in the menu (About group), the footer, Help and by deep link `#terms`…; standalone English pages `/GG-counter/<page>/` (in the sitemap, precached); full licence texts `third-party-licenses.txt` (About) | AC12: each entry opens from the menu and the footer with the keyboard; each page loads directly and offline and links back to the app |

## 4. Usage modes and public interfaces (must not change — migrate §1)
- Hosting: standard (GitHub Pages). **URL stays `https://simeontsvetanov.github.io/GG-counter/`** (Moni 2026-11-19).
- Modes after migration: browser only. No embed, no API, no MCP (DECISIONS 2026-11-19). One URL parameter since T-09:
  `?lang=en|bg` shows that UI language for this visit (not saved; never in the sitemap or canonical).
- Languages (T-09): English (default, fallback) and Bulgarian. Start: `?lang=` → choice saved in Settings → English (no
  browser auto-detect, forge DECISIONS 2026-11-06). Raw HTML, head, JSON-LD, sitemap, llms.txt and the 404 page are English only.
- Storage keys (localStorage, shared origin): `gg-counter/state` =
  `{ players: [{ id, name, score, createdAt }], lastUpdated, version: 1 }` · `gg-counter-theme` = `light|dark` (key removed for "system").
  Both keys are app-prefixed but not in the forge `id:v1:` format; they are migrated to it with the old values kept until verified.
- PWA: manifest `id: "gg-counter-pwa-v1"`, `start_url` and `scope` `/GG-counter/`, service worker `sw.js`, cache id `gg-counter`.
- Share text (1.2, §11 F21 — replaces the pre-forge format on purpose, DECISIONS 2026-11-20): `🏆 GG Counter — Leaderboard` /
  `📅 <local date and time>` / one row per player `🥇 34 · Ana` (medals = the shared places of `podiumPlaces`, other places
  as keycap numbers `4️⃣`, scores right-aligned with figure spaces, true minus) / `👑 Winner: …` or `🤝 All tied …` /
  `👥 4 players · 85 points in total` / `— Made with GG Counter · <app url>`. Bulgarian: the same lines with Bulgarian words;
  the attribution line stays English (app-shell → i18n §2).

## 5. Data and storage
- Stored: players and scores, theme, the last version whose What's new was seen (`gg-counter:v1:last-seen-version`, T-08), the UI
  language chosen in Settings (`gg-counter:v1:lang` = `"en"|"bg"`, T-09; absent = English) → tier: prefs (localStorage) · export/import/clear: Settings → Your data (T-08), file `gg-counter-data-YYYY-MM-DD.json`; an import is checked through core and confirmed before it replaces the game. The export's `data.lang` (T-09, `null` = no
  choice) is written on import when present; files from before T-09 keep the device's choice.
- Nothing leaves the device; no analytics, no network calls except loading the app.

## 6. UI
- **Level 2 — React stays** (Moni 2026-11-19; existing app, see DECISIONS). Languages: English + Bulgarian (T-09; app/src/i18n).
- Look (T-12): the forge tokens (`design/tokens.css`) through Tailwind 4, the same look as the sibling apps; light / dark /
  system. Accent `#1F4ED8` (app.config.ts → generated accent tokens, WCAG-checked at build); browser bar and manifest colours =
  the page background; links accent + semibold, no underline. Logo `public/favicon.svg` (meeple). Screens: one main screen,
  dialogs (bottom sheets on phones), the standalone policy and 404 pages on the same tokens.

## 7. Limits and performance
- Limits (Moni 2026-11-19): 50 players, 40-character names, scores −999,999…999,999 — for new input; older saved games load unchanged.
- Targets: LCP ≤ 2.5 s, INP ≤ 200 ms, CLS ≤ 0.1; critical path ≤ 170 KB compressed; first-load JS budget for Level 2:
  **125 KB gzip proposed** (T-12 measured 118.2 KB; DECISIONS 2026-11-19) — TO CONFIRM by Moni.

## 8. Legal and AI layers
- Terms, Privacy, AI notice (Variant A: built with AI tools; no AI feature, so no EU AI Act Art. 50 duties), Legal notice,
  Support (T-10, `content/legal/*.md`, English only, matched to the code on 2026-11-19). Game data never reaches us; the
  only controller layers are an email to the contact address (also "Send by email") and a GitHub issue the user submits —
  Privacy has the GDPR Art. 13 block for them (retention: emails ≤ 1 month after the conversation). Contact email
  tsvetanov.simeon@gmail.com (Moni 2026-11-19); provider Simeon Tsvetanov, Bulgaria. No cookie banner (only strictly
  necessary on-device storage). MIT `LICENSE` generated (2025–current year) + `third-party-licenses.txt`. Not legal
  advice: open lawyer items in DECISIONS 2026-11-19 (T-10).

## 9. Acceptance and risks
- Done when: AC1–AC9 pass on the live URL with data created by the old version; forge checks at 0 FAIL; baseline → after numbers recorded.
- Risks: installed PWAs during the service-worker change; the storage-key migration; removing 2,189 tracked `node_modules` files from git history is **not** planned (only untracking).

## 10. Version 1.1 (Moni 2026-11-20; PLAN T-15 = part A, T-16 = part B)
> Approved by Moni's request of 2026-11-20 ("new features for 1.1"; decisions delegated). Behaviour changes
> on purpose against the characterization tests are named in DECISIONS 2026-11-20.

| ID | Feature | Acceptance |
|---|---|---|
| F13 | **Clear session with a choice** (A1): the header's Clear session button opens one alert "Clear session?" with a radio group — **Players and scores** (default) or **Scores only** (every player stays with 0) — and under it Cancel + a red confirm whose one-word label names the result ("Clear" / "Reset"). The Leaderboard card's Clear session and the Reset scores buttons (card and dialog) open the same alert; Reset scores opens it with Scores only checked. The separate "Reset all scores?" alert is gone | AC13: default clears everything (AC6 unchanged); Scores only → same players, all 0, empty histories; reopening shows the opener's default again; Cancel/Escape change nothing |
| F14 | **A player's delete button with a choice** (A2): the same alert pattern, "Remove player or score?" — **Player and score** (default, removes the player) or **Score only** (score 0, history emptied, the player stays); confirm "Remove" / "Reset" | AC14: default removes the player (AC2 unchanged); Score only keeps the card at 0; other players unchanged |
| F15 | **Score history** (A3, data): every score change (+1, −1, custom amount) is saved as an entry `{ id, delta, at }`; changes of the same player in the same direction ≤ 3 s apart (no other player in between) merge into one entry; up to 50 entries per player, older ones fold into the score; F13/F14 resets empty the history; saved with the game and in the export file | AC15: +1 ×3 quickly = one entry +3; a pause > 3 s starts a new one; score always = base + sum of the entries; a 1.0.0 game and a 1.0.0 export load/import with the same players and scores (empty histories); a damaged history in an import is refused with a reason |
| F16 | **Last changes and history sheet** (B): each card shows a one-line, dimmed "last changes" line above the score (newest at the right end, e.g. "+5 −2 +12", true minus sign; no history = the line's space stays empty); tapping it opens a sheet titled with the player's name: the total, the changes newest first (amount, clock time, an × that removes it at once and takes its points off the score) and one "Earlier points" line when older or pre-1.1 points exist; **Restore** (next to Close) puts the last removed change back in its place | AC16: × on a +5 entry lowers the score by 5 and the entry is gone after reload; Restore gives back the same history and score; removal that would pass a limit says why and changes nothing |
| F17 | **Last-scored highlight** (B): the card of the player with the newest history entry is tinted with the accent and its newest change is a pill (shape, not colour alone); the screen reader hears it in the line's name ("… (scored last): …"), no live region. The tint no longer marks the leader (the 🥇 does) | AC17: scoring Boris after Ana moves the mark to Boris; removing Boris's newest entry moves it back |
| F18 | **Rank badges and denser cards** (B): cards show places 1–3 as the leaderboard's medals 🥇🥈🥉 in their corner (ties share a place, "1224"; no medal while every score is equal); the leaderboard uses the same places for its medals and numbers (since 1.2 the share text uses the same places, F21). The cards never reorder (order added). From the 5th player the cards are compact: a short score (≤ 3 characters) sits beside − and +, and the grid gains columns with the room (2 on phones, up to 5 on desktop) | AC18: 34, 27, 27 → badges 1, 2, 2; the phone shows more cards per screen than 1.0.0 without targets < 44 px; a 6-digit score fits a 320 px card |

- Interfaces for part B (core, `gg-counter-core`): `Player.history: readonly ScoreEntry[]`; `removeScoreEntry`,
  `lastScoredPlayerId`, `rank(…).places` (ties share a place), `scoreBase`, `MAX_HISTORY_ENTRIES`, `MERGE_WINDOW_MS`; the
  app hook `useGameState()` gives `removeScoreEntry(playerId, entryId)`, `lastScoredId` and `ranking.places`. No storage change.
  Added in part B: `restoreScoreEntry(game, playerId, entry, index)` (Restore) and `podiumPlaces(ranking)` (medals).
- Data (§5 update): the saved game is version 2 (each player has `history`); `score` stays the total, so an older cached
  1.0.0 app still reads the scores (it drops the history). Key stays `gg-counter:v1:state`; export `schemaVersion` stays 1.
- Not in 1.1: undo toast after a clear (the alert asks first); history of renames or of removed players.

## 11. Version 1.2 (Moni 2026-11-20; PLAN T-17)
> Approved by Moni's request of 2026-11-20 (three items, translated in DECISIONS; F22 = his feedback on the live 1.1.0). The share text change is a deliberate
> change of the public format of §4 (AC5 updated on purpose).

| ID | Feature | Acceptance |
|---|---|---|
| F19 | **The field you type in stays on screen** (C1): while the Add player name field has focus, the field and its Add button are inside the visible area — below the header and above the on-screen keyboard (visual viewport) — on focus, after every Add (focus stays in the field, also after a tap on Add) and when the visual viewport is resized (keyboard opens, closes, changes height). Smooth scroll, instant with reduced motion; the page never scrolls on its own otherwise (the user's own scrolling wins). The same for a player's name field on a card (rename). Sheets keep their keyboard behaviour (DECISIONS 2026-11-20) | AC19: phone with a simulated 340 px keyboard: 8 players added in a row (Enter and the Add button) → after each Add the field has focus and the field and Add are within the visible height; a card's name field focused near the bottom is moved above the keyboard; the Adjust score sheet test stays green |
| F20 | **Short, quiet motion** (C2): a new card pops in; a removed card fades out in its place, then the others slide into the gap; the score rolls up or down by the direction of the change; a new change slides into the last-changes line; a medal pops when it appears or changes; the last-scored tint fades from card to card; leaderboard rows slide to their new place; history rows slide when one is removed, a restored one fades in; presses scale (0.97) on every control that lacked it. Only `transform`/`opacity`, durations and curves from `design/tokens.css`, nothing blocks input, rapid taps never queue; reduced motion → fades or nothing (accessibility §8). List in DECISIONS 2026-11-20 | AC20: e2e end states with motion on (`--repeat-each 5` green); 10 quick +1 taps end at 10 with no running animation left; with `prefers-reduced-motion: reduce` no running animation moves or scales anything; csp spec green; CLS 0; first-load JS ≤ 125 KB gzip |
| F21 | **A nicer shared leaderboard with the app link** (C3): the text of §4 (title with the app name, date and time, medals with shared places, aligned score column, true minus, winner or tie line, player count and total, attribution line with the canonical app URL) in English and Bulgarian. Every leaderboard Share (card, dialog; the header button was removed in 1.2.1) sends it with Web Share `{ title, text }` (no `url`, so no app prints the link twice); without Web Share the same text is copied and a toast says so (no browser alert); a cancelled share sheet does nothing. Share app keeps `{ title, text: tagline, url }` and copies the link without Web Share | AC21 (= AC5 updated): a fixed game of 4 players with a tie and a negative score gives the exact text in EN and BG (unit + e2e); every leaderboard entry point ends with the app URL once |
| F22 | **Calmer last-scored mark, bigger score** (C4, Moni on the live 1.1.0): no pill or other shape on the last-changes line — the newest change is the same grey, a little heavier, on every card; the last-scored card keeps its tint, and its non-colour cue is a slightly raised shadow (accessibility: status never colour alone), the screen-reader text stays (replaces F17's pill). The score is a notch larger (`--text-score`, 32–40 px, capped by the card width) and its button 52 px tall instead of 44; the last-changes line gives up the same 8 px (its button keeps a 44 px target by reaching into the gaps), so cards keep their 1.1 height | AC22: no element with a border on the line; 320 and 390 px, comfortable and compact: card heights equal to 1.1.0 (220/212/160 px), score button 52 px tall, "-999999" fits its card; a11y-check 0 FAIL |

- Not in 1.2: an image of the leaderboard (app-shell §8 covers sharing files only where the app produces them; Moni decides
  after the estimate in DECISIONS); the WhatsApp + Copy sheet of app-shell §8 for desktops without Web Share (follow-up, §4 of PLAN).
