// One player's card in the players grid: editable name, remove, the score (opens "Adjust score") and −/+
// as two equal buttons under it (player-card.css). A rename or score change that core refuses (name over
// 40 characters, score out of range) says why on the card.
import { useEffect, useId, useState } from "react";
import type { Player } from "gg-counter-core";
import { Minus, Plus } from "lucide-react";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Input } from "../components/ui/input";
import type { GameStateApi } from "../hooks/use-game-state";
import { t } from "../i18n";
import { limitCode, limitMessage, type LimitCode } from "./limit-message";
import { RemovePlayerButton } from "./remove-player-button";
import { ScoreDialog } from "./score-dialog";

/** Props of {@link PlayerCard}. */
interface PlayerCardProps {
  player: Player;
  /** Highlights the card as the leader. */
  isLeader: boolean;
  onRename: GameStateApi["renamePlayer"];
  onRemove: (id: string) => void;
  onAdjust: GameStateApi["adjustScore"];
}

/** One player's card: editable name, remove (with confirmation) and score controls. */
export function PlayerCard({
  player,
  isLeader,
  onRename,
  onRemove,
  onAdjust,
}: PlayerCardProps): React.JSX.Element {
  const [name, setName] = useState(player.name);
  const [nameError, setNameError] = useState<LimitCode | null>(null);
  const [scoreError, setScoreError] = useState<LimitCode | null>(null);
  const ids = { name: useId(), score: useId() };

  useEffect(() => {
    setName(player.name);
  }, [player.name]);

  const handleNameCommit = () => {
    const trimmed = name.trim();
    if (trimmed.length === 0) {
      setName(player.name);
      setNameError(null);
      return;
    }

    if (trimmed !== player.name) {
      // Like the Add field: a refused name stays in the field with the reason under it.
      const renamed = onRename(player.id, trimmed);
      setNameError(renamed.ok ? null : limitCode(renamed.error.code));
    }
  };

  /** Changes the score by `delta`; returns the limit core refused it for, or null when applied (or silently refused). */
  const adjust = (delta: number): LimitCode | null => {
    const adjusted = onAdjust(player.id, delta);
    if (adjusted.ok) setScoreError(null);
    return adjusted.ok ? null : limitCode(adjusted.error.code);
  };

  return (
    <Card className="player-card" data-leader={isLeader ? "" : undefined}>
      <div>
        <div className="player-card-head">
          <Input
            value={name}
            onChange={(event) => {
              setName(event.target.value);
              setNameError(null);
            }}
            onBlur={handleNameCommit}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                handleNameCommit();
                event.currentTarget.blur();
              }
            }}
            autoComplete="off"
            enterKeyHint="done"
            aria-label={t("app.players.nameFor", { name: player.name })}
            aria-invalid={nameError !== null}
            aria-describedby={ids.name}
          />
          <RemovePlayerButton
            playerName={player.name}
            onConfirm={() => { onRemove(player.id); }}
          />
        </div>
        <p id={ids.name} role="alert" className="field-error">{nameError && limitMessage(nameError)}</p>
      </div>

      {/* The dialog shows its own refusal message; the card keeps showing the last +/− one. */}
      <ScoreDialog player={player} onApply={adjust} />
      <div className="score-steps">
        <Button
          variant="secondary"
          aria-label={t("app.players.decrease", { name: player.name })}
          aria-describedby={ids.score}
          onClick={() => { setScoreError(adjust(-1)); }}
        >
          <Minus aria-hidden />
        </Button>
        <Button
          variant="secondary"
          aria-label={t("app.players.increase", { name: player.name })}
          aria-describedby={ids.score}
          onClick={() => { setScoreError(adjust(1)); }}
        >
          <Plus aria-hidden />
        </Button>
      </div>
      <p id={ids.score} role="alert" className="field-error">{scoreError && limitMessage(scoreError)}</p>
    </Card>
  );
}
