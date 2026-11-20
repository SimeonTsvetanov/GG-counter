// Player transitions: add, remove, rename (SPEC F1, F2). Pure — the caller supplies id and time.
import type { GameState, Player } from "./game.ts";
import { MAX_PLAYERS } from "./limits.ts";
import { checkPlayerName, type NameErrorCode } from "./player-name.ts";
import { fail, ok, type Result } from "./result.ts";

/** What {@link addPlayer} needs besides the game: the typed name and the new player's identity. */
export interface NewPlayer {
  readonly name: string;
  readonly id: string;
  /** ISO 8601 time the player is added. */
  readonly createdAt: string;
}

/** Why {@link addPlayer} rejected the input. */
export type AddPlayerErrorCode = NameErrorCode | "PLAYERS_TOO_MANY";

/** Why {@link renamePlayer} rejected the input. */
export type RenamePlayerErrorCode = NameErrorCode | "PLAYER_NOT_FOUND";

/** Returns `players` with player `id` replaced by `update(player)`, or null when no player has that id. */
function updatePlayer(players: readonly Player[], id: string, update: (player: Player) => Player): Player[] | null {
  if (!players.some((player) => player.id === id)) return null;
  return players.map((player) => (player.id === id ? update(player) : player));
}

/** Returns the game with a new player (trimmed name, score 0) added at the end. */
export function addPlayer(game: GameState, input: NewPlayer): Result<GameState, AddPlayerErrorCode> {
  const name = checkPlayerName(input.name);
  if (!name.ok) return name;
  if (game.players.length >= MAX_PLAYERS) {
    return fail("PLAYERS_TOO_MANY", `A game can have at most ${String(MAX_PLAYERS)} players.`);
  }
  const player: Player = { id: input.id, name: name.value, score: 0, createdAt: input.createdAt, history: [] };
  return ok({ ...game, players: [...game.players, player] });
}

/** Returns the game without player `id`; an unknown id leaves the players as they are. */
export function removePlayer(game: GameState, id: string): GameState {
  return { ...game, players: game.players.filter((player) => player.id !== id) };
}

/** Returns the game with player `id` renamed to the trimmed `name`. */
export function renamePlayer(game: GameState, id: string, name: string): Result<GameState, RenamePlayerErrorCode> {
  const checked = checkPlayerName(name);
  if (!checked.ok) return checked;
  const players = updatePlayer(game.players, id, (player) => ({ ...player, name: checked.value }));
  if (players === null) return fail("PLAYER_NOT_FOUND", "This player is no longer in the game.");
  return ok({ ...game, players });
}
