// Every user-visible text of the game screen in English — the source of truth that bg.ts translates key
// for key. The keys are the ones the screen always used (`app.*` for the score keeper, `shell.cancel` and
// `shell.close` for the dialog buttons it shares with the standalone shell); the standalone shell's own
// dictionary (app/src/i18n/en.ts) includes these texts, so each text is written once. `{{name}}` marks a
// value filled in by t() (./index.ts); `key_one` / `key_other` are the plural forms i18next picks with `count`.

/** The game screen's English dictionary: the source of truth for every language of the screen. */
export const en = {
  shell: {
    cancel: "Cancel",
    close: "Close",
  },
  app: {
    shareTitle: "{{name}} session",
    shareFailed: "Sharing and copying are blocked in this browser. Try another browser.",
    copiedSummary: "Leaderboard copied ✓",
    header: {
      leaderboard: "Open leaderboard",
      addPlayer: "Add player",
      clear: "Clear session",
    },
    players: {
      addTitle: "Add Player",
      count_one: "{{count}} player",
      count_other: "{{count}} players",
      namePlaceholder: "Player Name",
      nameLabel: "Player name",
      add: "Add",
      nameFor: "Player name for {{name}}",
      decrease: "Decrease score for {{name}}",
      increase: "Increase score for {{name}}",
      remove: "Remove {{name}}",
      // The delete alert with a choice (SPEC 1.1 F14): remove the player (default) or only reset the score.
      removeTitle: "Remove player or score?",
      removeMessage: "Choose what to remove for {{name}}. You cannot undo this action.",
      removeLegend: "What to remove",
      removePlayer: "Player and score",
      removePlayerHint: "{{name}} leaves the game.",
      removePlayerConfirm: "Remove",
      removeScore: "Score only",
      removeScoreHint: "{{name}} stays, with 0 points.",
      removeScoreConfirm: "Reset",
      // The medal on a card (SPEC 1.1 F18): the place it shows, for screen readers.
      medal1: "1st place",
      medal2: "2nd place",
      medal3: "3rd place",
    },
    // The "last changes" line on a card and the history sheet behind it (SPEC 1.1 F16–F17).
    history: {
      open: "Score history for {{name}}: {{changes}}",
      openLast: "Score history for {{name}} (scored last): {{changes}}",
      total_one: "Total: {{count}} point",
      total_other: "Total: {{count}} points",
      list: "Changes, newest first",
      remove: "Remove {{change}} from {{name}}'s score",
      earlier: "Earlier points",
      empty: "No changes yet. Every + and − for {{name}} shows up here.",
      removed: "Removed {{change}}. Total now {{total}}.",
      restored: "Restored {{change}}. Total now {{total}}.",
      restore: "Restore {{change}}",
    },
    score: {
      // The visible score is part of the name (WCAG 2.5.3 label in name, PLAN T-12).
      adjust: "Adjust score for {{name}}: {{score}}",
      title: "Adjust score",
      description: "Add or subtract points for {{name}}. Use negative values to subtract.",
      amount: "Custom score adjustment",
      apply: "Apply",
    },
    leaderboard: {
      title: "Leaderboard",
      highlights: "Highlights from the current session",
      noPlayers: "No players yet",
      emptyCard: "Add players to populate the leaderboard.",
      emptyDialog: "No players yet. Add someone to get started.",
      points_one: "{{count}} pts",
      points_other: "{{count}} pts",
      rankRow: "{{rank}}. {{name}}",
      rankRowDialog: "🎲 {{rank}} — {{name}}",
      share: "Share",
      reset: "Reset scores",
      ok: "OK",
    },
    session: {
      // One alert for Clear session and Reset scores (SPEC 1.1 F13): players and scores (default) or scores only.
      clearTitle: "Clear session?",
      clearMessage: "Choose what to clear. You cannot undo this action.",
      clearLegend: "What to clear",
      clearAll: "Players and scores",
      clearAllHint: "Removes every player, for a new group.",
      clearAllConfirm: "Clear",
      clearScores: "Scores only",
      clearScoresHint: "Every player stays, with 0 points, for a new game.",
      clearScoresConfirm: "Reset",
    },
    limits: {
      PLAYERS_TOO_MANY: "A game can have up to {{max}} players. Remove a player to add another.",
      NAME_TOO_LONG: "Names can be up to {{max}} characters. Shorten the name and try again.",
      SCORE_OUT_OF_RANGE: "Scores go from {{min}} to {{max}}. This change would go past the limit.",
    },
    // The share text (SPEC §4, 1.2 F21): the English words must give core's englishLeaderboardLabels exactly
    // (unit test in packages/miniapp/test/ui/share-text.test.ts); scores are plain digits with a true minus sign.
    share: {
      title: "{{name}} — Leaderboard",
      points_one: "{{score}} point",
      points_other: "{{score}} points",
      winner_one: "Winner: {{names}} — {{points}}",
      winner_other: "Winners: {{names}} — {{points}} each",
      tie: "All tied — {{points}} each",
      players_one: "{{count}} player",
      players_other: "{{count}} players",
      summary: "{{players}} · {{points}} in total",
    },
  },
} as const;
