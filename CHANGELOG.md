# Changelog

All notable user-facing changes. Format: Keep a Changelog · SemVer.

## [Unreleased]
The app is being migrated into the forge (`docs/PLAN.md`): the URL, saved games and installed
copies keep working.

### Added
- How it works and FAQ on the page: below the leaderboard, five steps and seven common questions
  with answers (free, offline, where scores are saved, how many players, sharing, installing).
- Search and share preview: a page title and description, a preview image for links shared in
  chats and social apps, and a real "Page not found" page for wrong addresses.

### Changed
- Your saved game and theme are kept: on the first start they are copied once to new storage names
  (`gg-counter:v1:…`, the format of every forge app) and the copy is checked; the old entries stay
  untouched for now and are removed in a later release. Other apps' data on the same site is never
  read or changed. If the browser does not allow saving, the game still works until the page closes.
- A dark theme is applied before the page appears, so it no longer flashes light while loading.

### Changed (repository only)
- Tests that lock today's behaviour, pnpm, the licence file, lint rules and CI that deploys only
  after the checks pass.
- One storage module for the app with tested export, import and clear functions (used by Settings later).
