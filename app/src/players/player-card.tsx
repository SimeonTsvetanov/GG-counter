// One player's card in the players grid: editable name, remove, and the score controls. A rename or
// score change that core refuses (name over 40 characters, score out of range) says why on the card.
import { useEffect, useId, useState } from "react";
import type { Player } from "gg-counter-core";
import { Minus, Plus } from "lucide-react";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { Input } from "../components/ui/input";
import type { GameStateApi } from "../hooks/use-game-state";
import { t } from "../i18n";
import { cn } from "../lib/utils";
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
  className?: string;
}

/** One player's card: editable name, remove (with confirmation) and score controls. */
export function PlayerCard({
  player,
  isLeader,
  onRename,
  onRemove,
  onAdjust,
  className,
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
    <Card
      className={cn(
        "w-full border-0 shadow-md",
        className,
        isLeader && "ring-2 ring-primary/50 shadow-lg"
      )}
    >
      <CardContent className="space-y-4 p-4">
        <div>
          <div className="flex items-center gap-2">
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
              aria-label={t("app.players.nameFor", { name: player.name })}
              aria-invalid={nameError !== null}
              aria-describedby={ids.name}
            />
            <RemovePlayerButton
              playerName={player.name}
              onConfirm={() => { onRemove(player.id); }}
            />
          </div>
          <p id={ids.name} role="alert" className="text-sm font-medium text-destructive">{nameError && limitMessage(nameError)}</p>
        </div>

        <div>
          <div className="flex items-center justify-center gap-2 text-3xl font-semibold">
            <Button
              variant="ghost"
              size="icon"
              aria-label={t("app.players.decrease", { name: player.name })}
              aria-describedby={ids.score}
              onClick={() => { setScoreError(adjust(-1)); }}
            >
              <Minus className="h-6 w-6" />
            </Button>
            {/* The dialog shows its own refusal message; the card keeps showing the last +/− one. */}
            <ScoreDialog player={player} onApply={adjust} />
            <Button
              variant="ghost"
              size="icon"
              aria-label={t("app.players.increase", { name: player.name })}
              aria-describedby={ids.score}
              onClick={() => { setScoreError(adjust(1)); }}
            >
              <Plus className="h-6 w-6" />
            </Button>
          </div>
          <p id={ids.score} role="alert" className="text-center text-sm font-medium text-destructive">{scoreError && limitMessage(scoreError)}</p>
        </div>
      </CardContent>
    </Card>
  );
}
