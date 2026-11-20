# LEARNINGS — GG Counter

Corrections captured for `/learn` (format: forge:flow → learn §1). Newest last.

<!-- Entry format:
## L-YYYY-MM-DD-NN · open
- Trigger: Moni disliked | corrected | misfire | repeated question | gate failed | /report-skill-bug
- Where: design/chapters/ui-patterns.md § Buttons   (or agent/hook/command name)
- What happened: (facts, 1–3 lines, Moni's exact words)
- Expected: (what Moni wanted)
- Evidence: commit / file / screenshot path
- Scope guess: general (plugin) | this project only
-->
- 2026-11-20 · Moni: secondary information on a card (the last-changes line) must stay in the background, the newest value included — no filled accent shapes for it. Applied in history.css.
- 2026-11-20 · Moni: "when you add a player, sometimes the field itself moves down under the keyboard" — a field the user
  types into must stay between the header and the keyboard on focus, after each submit that grows the page above it, and on
  keyboard resize (visual viewport), with its submit button. Applied in `lib/reveal.ts` + `hooks/use-reveal-while-focused.ts`
  (SPEC F19). Scope guess: general (forge responsive-layout §5 covers sheets only, not in-page fields).
- 2026-11-20 · Moni on the live 1.1.0: the outlined pill around the newest change on the last-scored card — "the accent is a
  bit misplaced". No shapes on secondary lines; the non-colour cue for the card is a raised shadow. Applied in history.css /
  player-card.css (SPEC F22). Scope guess: general (moni-taste: secondary marks stay shapeless).
- 2026-11-20 · Moni: the score (the number you tap to enter an amount) should be a notch larger with "more room to press it" —
  the main number of a card is also its main target: bigger type and a taller target, without taller cards. Applied in
  player-card.css (`--text-score`, 52 px target; SPEC F22). Scope guess: this project, maybe general for counters.
- 2026-11-20 · Moni: shared results should be "even more beautiful and again have a link to the app" — share texts are
  marketing: readable in proportional chat fonts (emoji marks, figure-space padding), result line, attribution with the app URL.
  Applied in core `formatLeaderboard` (SPEC F21). Scope guess: general (app-shell §8 could show a model share text).
- 2026-11-20 · Moni on the live 1.2.0 (Android, installed): the header Share button with 0 players showed "Sharing and copying
  are blocked in this browser" — "nothing to share" was reported as a failure; an action that cannot work must be disabled or
  say the real reason. He also wants no duplicate of a menu action in the header. Removed in 1.2.1. Scope guess: general.
- 2026-11-20 · Moni: the Android navigation bar of the installed app was blue — the installed WebAPK still had the pre-forge
  manifest colours (#1F4ED8); Chrome updates them on its own schedule. Open: which colour the bar gets in dark theme with the
  new manifest (#F5F5F7) — needs his screenshot after the update. Scope guess: general (pwa: manifest colours vs dark theme).
