// The players part of the main screen: the grid of player cards and the Add player card (alone
// while there are no players, below the grid afterwards).
import { useState } from "react";
import type { Player } from "gg-counter-core";
import type { GameStateApi } from "../hooks/use-game-state";
import { AddPlayerCard } from "./add-player-card";
import { limitCode, limitMessage, type LimitCode } from "./limit-message";
import { PlayerCard } from "./player-card";

/** Props of {@link PlayersSection}. */
interface PlayersSectionProps {
  /** The players in the order they were added. */
  players: readonly Player[];
  /** Id of the current leader (highlighted), or null. */
  leaderId: string | null;
  onAddPlayer: GameStateApi["addPlayer"];
  onRename: GameStateApi["renamePlayer"];
  onRemove: GameStateApi["removePlayer"];
  onAdjust: GameStateApi["adjustScore"];
  /** Attached to the Add player card's wrapper. */
  addCardRef: React.Ref<HTMLDivElement>;
  /** Attached to the Add player name field. */
  addInputRef: React.Ref<HTMLInputElement>;
}

/** Renders the player cards and the Add player card; keeps the name being typed. */
export function PlayersSection({
  players,
  leaderId,
  onAddPlayer,
  onRename,
  onRemove,
  onAdjust,
  addCardRef,
  addInputRef,
}: PlayersSectionProps): React.JSX.Element {
  const [newPlayerName, setNewPlayerName] = useState("");
  const [addError, setAddError] = useState<LimitCode | null>(null);

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

  return (
    <>
      <div className="mx-auto w-full max-w-lg sm:max-w-none">
        <section className="grid grid-cols-2 justify-items-center gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {players.map((player) => (
            <PlayerCard
              key={player.id}
              player={player}
              isLeader={leaderId === player.id}
              onRename={onRename}
              onRemove={onRemove}
              onAdjust={onAdjust}
              className="w-full"
            />
          ))}
        </section>
      </div>
      <div className="mt-2 w-full">{addPlayerCard}</div>
    </>
  );
}
