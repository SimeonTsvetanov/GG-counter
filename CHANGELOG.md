# Changelog

All notable user-facing changes. Format: Keep a Changelog · SemVer.

## [Unreleased]

### Fixed
- The on-screen keyboard no longer covers the buttons of a window with a text field (for example Apply in Adjust score): the window now sits above the keyboard on Android and on iPhone.

## [1.0.0] - 2026-11-19
The first numbered release: GG Counter now follows the same standard as the other free tools by the
same author. The address, your saved games and installed copies keep working.

### Added
- Bulgarian: the whole app in Bulgarian (Settings → Language: English or Български). English stays
  the default; your choice is remembered on this device. The shared leaderboard
  text follows the language (the English text is unchanged).
- A menu in the header: Help, Settings, What's new, Share app, Install app, Report a problem, About
  and Support. It works with the keyboard too.
- Settings: choose the theme (System, Light, Dark), export your game to a file, import it again
  (on this or another device; you are asked before the current game is replaced) and Clear my
  data (asks first; other apps are not affected).
- Help inside the app, also offline: what it does, quick start, installing, privacy, limits and
  the FAQ. What's new shows the latest changes once after an update.
- Clear messages when a limit is reached: more than 50 players, a name longer than 40
  characters, or a score beyond −999,999…999,999.
- When a new version is ready, a "New version available — Reload" message appears; the app never
  reloads by itself in the middle of a game.
- If something unexpected breaks, an error screen offers Reload, Export my data and Report a
  problem instead of a blank page.
- How it works and FAQ on the page: below the leaderboard, five steps and seven common questions
  with answers (free, offline, where scores are saved, how many players, sharing, installing).
- Terms, Privacy, AI notice, Legal notice and a Support page: in the menu (About) and the footer, as
  dialogs inside the app and as pages of their own (`/GG-counter/privacy/` …) that work offline and
  print well. They say exactly what the app stores on your device and how to delete it. The texts
  are in English; in Bulgarian the labels are translated and say so.
- About links to the full licence texts of every open-source package the app includes.
- Search and share preview: a page title and description, a preview image for links shared in
  chats and social apps, and a real "Page not found" page for wrong addresses.

### Changed
- Your saved game and theme are kept: on the first start they are copied once to new storage names
  (`gg-counter:v1:…`, the format of every forge app) and the copy is checked; the old entries stay
  untouched for now and are removed in a later release. Other apps' data on the same site is never
  read or changed. If the browser does not allow saving, the game still works until the page closes.
- A dark theme is applied before the page appears, so it no longer flashes light while loading.
- A renamed player can have up to 40 characters, the same as a new one (was 32).
- On phones the theme is chosen in Menu → Settings; the theme button stays in the header on wider
  screens. The header title is no longer cut off on small phones.
- A clearer focus outline for keyboard users, larger text in input fields, and readable text on
  red buttons in the dark theme.
- A new look, the same as the other free tools by the same author: a calm light grey or black page,
  white or dark cards with soft shadows instead of lines, a see-through header that gets a shadow
  when you scroll, the Inter font where the system font is not available, and GG Counter's blue for
  the main button. Light, dark and system themes as before; the browser bar follows the theme.
- Player cards: the score has its own row, so six-digit scores fit on a phone; − and + are two
  equal buttons under it. The trash buttons are grey, not red.
- Buttons, fields and menu entries are at least 44 px tall; dialogs open as sheets from the bottom on
  phones; the leaderboard is one list with medals for the top three.
- Links are shown in blue and bold, without underlines, also in the policy pages; the policy pages
  and the "Page not found" page use the same colours as the app.
- The preview image for shared links has the new look.
- The app starts a little faster: the menus load right after the first screen (first download
  about 14 % smaller).

### Changed (repository only)
- Tests that lock today's behaviour, pnpm, the licence file, lint rules and CI that deploys only
  after the checks pass.
- One storage module for the app with tested export, import and clear functions (used by Settings later).
- The repo `LICENSE` and `third-party-licenses.txt` are generated (current year, full licence texts).
- All app texts in one English dictionary, ready for a second language; the menu and footer come
  from `app.config.ts`; the service worker and its tests follow the forge PWA rules.
- Design tokens (`design/tokens.css`) from the forge and Tailwind CSS 4 mapped to them; the accent
  colours are generated from `app.config.ts` and checked for contrast at every build.

### Fixed
- The offline banner no longer says changes "will sync" — nothing is synced; your game stays on this device.

### Security
- Every page (the app, the policy pages and "Page not found") has a strict content security policy:
  the browser loads only the app's own files and refuses scripts, styles and connections from
  anywhere else, which blocks most ways injected code could run.
