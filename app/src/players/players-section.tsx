// The players part of the main screen: the grid of player cards and the Add player card (alone
// while there are no players, below the grid afterwards). The grid gets denser from the fifth player
// (SPEC 1.1 F18): `data-density` picks the card layout and the column count in player-card.css.
import { useRef, useState } from "react";
import { podiumPlaces, type Player, type Ranking } from "gg-counter-core";
import type { GameStateApi } from "../hooks/use-game-state";
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
  /** Attached to the Add player card's wrapper. */
  addCardRef: React.Ref<HTMLDivElement>;
  /** Attached to the Add player name field (also the focus target once the last player is removed). */
  addInputRef: React.RefObject<HTMLInputElement | null>;
}

/** Renders the player cards and the Add player card; keeps the name being typed. */
export function PlayersSection({
  players,
  ranking,
  lastScoredId,
  onAddPlayer,
  onRename,
  onRemove,
  onResetScore,
  onAdjust,
  onRemoveEntry,
  onRestoreEntry,
  addCardRef,
  addInputRef,
}: PlayersSectionProps): React.JSX.Element {
  const [newPlayerName, setNewPlayerName] = useState("");
  const [addError, setAddError] = useState<LimitCode | null>(null);
  const gridRef = useRef<HTMLElement>(null);

  /** After a player is removed, focuses the delete button now at `index` (the next player), else the last one, else the Add field (accessibility §3). */
  const focusAfterRemove = (index: number) => {
    const buttons = Array.from(gridRef.current?.querySelectorAll<HTMLElement>("[data-remove-player]") ?? []);
    const next = buttons.at(Math.min(index, buttons.length - 1));
    if (next === undefined) addInputRef.current?.focus();
    else next.focus();
  };

  const handleAddPlayer = () => {
    // Core trims the name and rejects a blank or over-limit one; rejected text stays in the field.
    const added = onAddPlayer(newPlayerName);
    if (added.ok) {
      setNewPlayerName("");
      setAddError(null);
      return;
    }
    setAddError(limitCode(added.error.code));
  };

  const addPlayerCard = (
    <AddPlayerCard
      ref={addCardRef}
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

  if (players.length === 0) {
    return addPlayerCard;
  }

  const podium = podiumPlaces(ranking);
  return (
    <>
      <section ref={gridRef} className="player-grid" data-density={players.length > COMFORTABLE_MAX_PLAYERS ? "compact" : "comfortable"}>
        {players.map((player, index) => (
          <PlayerCard
            key={player.id}
            player={player}
            medal={podium.get(player.id) ?? null}
            isLastScored={lastScoredId === player.id}
            onRename={onRename}
            onRemove={onRemove}
            onResetScore={onResetScore}
            onAdjust={onAdjust}
            onRemoveEntry={onRemoveEntry}
            onRestoreEntry={onRestoreEntry}
            focusAfterRemove={() => { focusAfterRemove(index); }}
          />
        ))}
      </section>
      {addPlayerCard}
    </>
  );
}
