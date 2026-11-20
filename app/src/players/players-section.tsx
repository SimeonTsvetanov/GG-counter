// The players part of the main screen: the grid of player cards and the Add player card (alone
// while there are no players, below the grid afterwards). The grid gets denser from the fifth player
// (SPEC 1.1 F18): `data-density` picks the card layout and the column count in player-card.css.
// Motion (SPEC 1.2 F20): a new card pops in; a removed one fades out in its slot, then the cards, the Add card
// and the blocks below slide into place (use-leaving.ts, use-flip.ts on `<main>`).
import { useRef, useState } from "react";
import { podiumPlaces, type Player, type Ranking } from "gg-counter-core";
import type { GameStateApi } from "../hooks/use-game-state";
import { useFlip } from "../hooks/use-flip";
import { useLeaving } from "../hooks/use-leaving";
import { withLeaving } from "../lib/flip";
import { AddPlayerCard } from "./add-player-card";
import { limitCode, limitMessage, type LimitCode } from "./limit-message";
import type { HistoryActions } from "./history-sheet-content";
import { PlayerCard } from "./player-card";

/** Most players shown on roomy cards; from one more on, the cards get compact so more fit on a screen. */
export const COMFORTABLE_MAX_PLAYERS = 4;

/** Props of {@link PlayersSection}. */
interface PlayersSectionProps extends HistoryActions {
  /** The players in the order they were added (the cards never reorder; the medals show the ranking). */
  players: readonly Player[];
  /** The ranking, for the medals on the cards. */
  ranking: Ranking;
  /** The player with the newest change (their card is marked), or null. */
  lastScoredId: string | null;
  onAddPlayer: GameStateApi["addPlayer"];
  onRename: GameStateApi["renamePlayer"];
  onRemove: GameStateApi["removePlayer"];
  onResetScore: GameStateApi["resetPlayerScore"];
  onAdjust: GameStateApi["adjustScore"];
  /** Attached to the Add player name field (also the focus target once the last player is removed). */
  addInputRef: React.RefObject<HTMLInputElement | null>;
  /** The positioned `<main>` whose `data-flip="main:…"` blocks slide when a card comes or goes. */
  flipRootRef: React.RefObject<HTMLElement | null>;
}

/** Returns how a card moves: out when its player was removed, in when the player was added after the page opened. */
function cardMotion(player: Player, gone: ReadonlySet<Player>, firstIds: ReadonlySet<string>): "entering" | "leaving" | null {
  if (gone.has(player)) return "leaving";
  return firstIds.has(player.id) ? null : "entering";
}

/** Renders the player cards and the Add player card; keeps the name being typed. */
export function PlayersSection({ players, ranking, lastScoredId, onAddPlayer, onRemove, addInputRef, flipRootRef, ...cardActions }: PlayersSectionProps): React.JSX.Element {
  const [newPlayerName, setNewPlayerName] = useState("");
  const [addError, setAddError] = useState<LimitCode | null>(null);
  const gridRef = useRef<HTMLElement>(null);
  // Cards on screen when the page opened appear without motion; only players added later pop in.
  const [firstIds] = useState(() => new Set(players.map((player) => player.id)));
  const { leaving, leave } = useLeaving<Player>();
  useFlip(flipRootRef, "main");

  /** After a player is removed, focuses the delete button now at `index` (the next player), else the last one, else the Add field (accessibility §3). */
  const focusAfterRemove = (index: number) => {
    const buttons = Array.from(gridRef.current?.querySelectorAll<HTMLElement>('.player-card:not([data-motion="leaving"]) [data-remove-player]') ?? []);
    const next = buttons.at(Math.min(index, buttons.length - 1));
    if (next === undefined) addInputRef.current?.focus();
    else next.focus();
  };

  const removePlayer = (id: string) => {
    const player = players.find((candidate) => candidate.id === id);
    onRemove(id);
    if (player !== undefined) leave(player, players.indexOf(player));
  };

  const handleAddPlayer = () => {
    // Core trims the name and rejects a blank or over-limit one; rejected text stays in the field.
    const added = onAddPlayer(newPlayerName);
    if (added.ok) {
      setNewPlayerName("");
      setAddError(null);
      // The next name goes in the same field (also after Add was pressed with the keyboard); the card scrolls itself.
      addInputRef.current?.focus({ preventScroll: true });
      return;
    }
    setAddError(limitCode(added.error.code));
  };

  const addPlayerCard = (
    <AddPlayerCard
      inputRef={addInputRef}
      name={newPlayerName}
      onNameChange={(name) => {
        setNewPlayerName(name);
        setAddError(null);
      }}
      onAdd={handleAddPlayer}
      playerCount={players.length}
      error={addError && limitMessage(addError)}
    />
  );

  const shown = withLeaving(players, leaving);
  const podium = podiumPlaces(ranking);
  const gone = new Set(leaving.map(({ item }) => item));
  // The Add card keeps its place in the tree with or without the grid, so its field (and its focus) survives
  // the first player being added and the last one being removed.
  return (
    <>
      {shown.length > 0 && (
        <section ref={gridRef} className="player-grid" data-density={players.length > COMFORTABLE_MAX_PLAYERS ? "compact" : "comfortable"}>
          {shown.map((player, position) => (
            <PlayerCard
              key={player.id}
              player={player}
              medal={podium.get(player.id) ?? null}
              isLastScored={lastScoredId === player.id}
              motion={cardMotion(player, gone, firstIds)}
              onRemove={removePlayer}
              {...cardActions}
              // The index among the cards that stay: where the next player's card is once this one is gone.
              focusAfterRemove={() => { focusAfterRemove(shown.slice(0, position).filter((other) => !gone.has(other)).length); }}
            />
          ))}
        </section>
      )}
      {addPlayerCard}
    </>
  );
}
