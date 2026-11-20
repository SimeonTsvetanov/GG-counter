// The leaderboard as share text (SPEC F5, §4; 1.2 F21). People paste it into WhatsApp, Viber, Messenger or an
// SMS, whose fonts are proportional: columns cannot line up with spaces, so every row starts with marks of one
// width (an emoji: medal or keycap number) and a score padded with figure spaces (as wide as a digit), and the
// name comes last. Core owns the layout and the emoji; the app passes the words in the UI language.
import type { Player } from "./game.ts";
import { podiumPlaces, rank, type PodiumPlace, type Ranking } from "./ranking.ts";

const MEDALS: Readonly<Record<PodiumPlace, string>> = { 1: "🥇", 2: "🥈", 3: "🥉" };
/** U+2007 FIGURE SPACE pads the score column; U+2212 is the true minus sign. */
const FIGURE_SPACE = " ";
const MINUS = "−";
/** Turns a digit into its keycap emoji ("4" → "4️⃣"). */
const KEYCAP = "️⃣";
const KEYCAP_TEN = "🔟";
const TEN = 10;

/** The words of the share text in one language; the emoji, the rows and the line order are fixed here. */
export interface LeaderboardTextLabels {
  /** The heading after 🏆, e.g. "GG Counter — Leaderboard". */
  readonly title: string;
  /** The line after 👑 for the player(s) in 1st place, e.g. "Winner: Ana — 34 points". */
  readonly winners: (names: readonly string[], score: number) => string;
  /** The line after 🤝 when every score is equal, e.g. "All tied — 1 point each". */
  readonly tie: (score: number) => string;
  /** The line after 👥, e.g. "4 players · 85 points in total". */
  readonly summary: (players: number, totalScore: number) => string;
  /** The last line with the app link — English in every language (app-shell → i18n §2, §8). */
  readonly attribution: string;
}

/** What {@link formatLeaderboard} needs. */
export interface LeaderboardTextInput {
  /** The players in any order; they are ranked here. */
  readonly players: readonly Player[];
  /** The date and time shown after 📅, already formatted for the reader. */
  readonly date: string;
  /** The words in the reader's language. */
  readonly labels: LeaderboardTextLabels;
}

/** Returns a score as plain digits with a true minus sign ("−3"), the way the share text shows it. */
export function formatScore(score: number): string {
  return score < 0 ? `${MINUS}${String(-score)}` : String(score);
}

/** Returns the mark that starts a row: the medal of a podium place, else the place as keycap digits. */
export function placeMark(place: number, medal: PodiumPlace | null): string {
  if (medal !== null) return MEDALS[medal];
  if (place === TEN) return KEYCAP_TEN;
  return String(place).replace(/\d/g, (digit) => `${digit}${KEYCAP}`);
}

/** Returns the English words, with `appUrl` in the attribution line (tests; the app's dictionary must match). */
export function englishLeaderboardLabels(appUrl: string): LeaderboardTextLabels {
  const points = (score: number): string => `${formatScore(score)} ${Math.abs(score) === 1 ? "point" : "points"}`;
  const list = (names: readonly string[]): string =>
    names.length < 2 ? names.join("") : `${names.slice(0, -1).join(", ")}${names.length > 2 ? "," : ""} and ${names.at(-1) ?? ""}`;
  return {
    title: "GG Counter — Leaderboard",
    winners: (names, score) => (names.length === 1 ? `Winner: ${list(names)} — ${points(score)}` : `Winners: ${list(names)} — ${points(score)} each`),
    tie: (score) => `All tied — ${points(score)} each`,
    summary: (count, total) => `${String(count)} ${count === 1 ? "player" : "players"} · ${points(total)} in total`,
    attribution: `— Made with GG Counter · ${appUrl}`,
  };
}

/** Returns the rows of the ranking: mark, score padded to the widest score, name. */
function rankRows(players: readonly Player[]): { rows: string[]; ranking: Ranking } {
  const ranking = rank(players);
  const podium = podiumPlaces(ranking);
  const scores = ranking.players.map((player) => formatScore(player.score));
  const width = Math.max(0, ...scores.map((score) => score.length));
  const rows = ranking.players.map((player, index) => {
    const mark = placeMark(ranking.places.get(player.id) ?? index + 1, podium.get(player.id) ?? null);
    return `${mark} ${(scores[index] ?? "").padStart(width, FIGURE_SPACE)} · ${player.name}`;
  });
  return { rows, ranking };
}

/** Returns the 👑 winner line, the 🤝 tie line (two or more players, all equal) or null without players. */
function resultLine(ranking: Ranking, labels: LeaderboardTextLabels): string | null {
  const leader = ranking.leader;
  if (leader === null) return null;
  const winners = ranking.players.filter((player) => player.score === leader.score);
  if (winners.length > 1 && winners.length === ranking.players.length) return `🤝 ${labels.tie(leader.score)}`;
  return `👑 ${labels.winners(winners.map((player) => player.name), leader.score)}`;
}

/** Returns the share text: title, date, the ranked rows, the result, players and total, and the app link. */
export function formatLeaderboard({ players, date, labels }: LeaderboardTextInput): string {
  const { rows, ranking } = rankRows(players);
  const result = resultLine(ranking, labels);
  return [
    `🏆 ${labels.title}`,
    `📅 ${date}`,
    "",
    ...(rows.length > 0 ? [...rows, ""] : []),
    ...(result === null ? [] : [result]),
    `👥 ${labels.summary(players.length, ranking.totalScore)}`,
    "",
    labels.attribution,
  ].join("\n");
}
