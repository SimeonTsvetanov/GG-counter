// One player's card in the players grid: editable name, remove, the "last changes" line (opens the history
// sheet), the score (opens "Adjust score") and − / + (player-card.css). The card carries the medal of its
// place and the last-scored mark (SPEC 1.1 F16–F18). A rename or score change that core refuses (name over
// 40 characters, score out of range) says why on the card.
import { useEffect, useId, useState } from "react";
import type { Player, PodiumPlace } from "gg-counter-core";
import { Minus, Plus } from "lucide-react";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Input } from "../components/ui/input";
import type { GameStateApi } from "../hooks/use-game-state";
import { t } from "../i18n";
import { MEDALS } from "../leaderboard/medals";
import { HistorySheet } from "./history-sheet";
import type { HistoryActions } from "./history-sheet-content";
import { limitCode, limitMessage, type LimitCode } from "./limit-message";
import { RemovePlayerButton } from "./remove-player-button";
import { ScoreDialog } from "./score-dialog";
import { isShortScore } from "./score-size";

/** Props of {@link PlayerCard}. */
interface PlayerCardProps extends HistoryActions {
  player: Player;
  /** The medal place (1–3) to show, or null (SPEC 1.1 F18). */
  medal: PodiumPlace | null;
  /** This player's change is the newest of the game: the card is marked (SPEC 1.1 F17). */
  isLastScored: boolean;
  onRename: GameStateApi["renamePlayer"];
  onRemove: (id: string) => void;
  /** Sets this player's score to 0 (the "Score only" option of the delete alert). */
  onResetScore: (id: string) => void;
  onAdjust: GameStateApi["adjustScore"];
  /** Moves focus to a logical next element once this card is gone (its player was removed). */
  focusAfterRemove: () => void;
}

/** The words for each medal place, read out instead of the emoji. */
const MEDAL_LABELS = { 1: "app.players.medal1", 2: "app.players.medal2", 3: "app.players.medal3" } as const satisfies Record<PodiumPlace, string>;

/** The medal in the card's corner; its place is read out, the emoji itself is not. */
function PlaceMedal({ place }: { place: PodiumPlace }): React.JSX.Element {
  return <span className="place-medal" role="img" aria-label={t(MEDAL_LABELS[place])}>{MEDALS[place]}</span>;
}

/** The card's head: the name field (renames on Enter or blur) and `children` (the remove button) beside it. */
function NameField({ player, onRename, children }: Pick<PlayerCardProps, "player" | "onRename"> & { children: React.ReactNode }): React.JSX.Element {
  const errorId = useId();
  const [name, setName] = useState(player.name);
  const [nameError, setNameError] = useState<LimitCode | null>(null);

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

  return (
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
          aria-describedby={errorId}
        />
        {children}
      </div>
      <p id={errorId} role="alert" className="field-error">{nameError && limitMessage(nameError)}</p>
    </div>
  );
}

/** One player's card: name, remove or reset (one alert with a choice), last changes, score and − / +. */
export function PlayerCard({ player, medal, isLastScored, onRename, onRemove, onResetScore, onAdjust, onRemoveEntry, onRestoreEntry, focusAfterRemove }: PlayerCardProps): React.JSX.Element {
  const [scoreError, setScoreError] = useState<LimitCode | null>(null);
  const scoreErrorId = useId();

  /** Changes the score by `delta`; returns the limit core refused it for, or null when applied (or silently refused). */
  const adjust = (delta: number): LimitCode | null => {
    const adjusted = onAdjust(player.id, delta);
    if (adjusted.ok) setScoreError(null);
    return adjusted.ok ? null : limitCode(adjusted.error.code);
  };

  return (
    <Card
      className="player-card"
      data-last-scored={isLastScored ? "" : undefined}
      data-short-score={isShortScore(player.score) ? "" : undefined}
    >
      {medal !== null && <PlaceMedal place={medal} />}
      <NameField player={player} onRename={onRename}>
        <RemovePlayerButton
          playerName={player.name}
          onRemove={() => { onRemove(player.id); }}
          onResetScore={() => { onResetScore(player.id); }}
          focusAfterRemove={focusAfterRemove}
        />
      </NameField>
      <HistorySheet player={player} isLastScored={isLastScored} onRemoveEntry={onRemoveEntry} onRestoreEntry={onRestoreEntry} />
      {/* The dialog shows its own refusal message; the card keeps showing the last +/− one. */}
      <div className="score-row">
        <ScoreDialog player={player} onApply={adjust} />
        <Button
          variant="secondary"
          className="score-step score-step--minus"
          aria-label={t("app.players.decrease", { name: player.name })}
          aria-describedby={scoreErrorId}
          onClick={() => { setScoreError(adjust(-1)); }}
        >
          <Minus aria-hidden />
        </Button>
        <Button
          variant="secondary"
          className="score-step score-step--plus"
          aria-label={t("app.players.increase", { name: player.name })}
          aria-describedby={scoreErrorId}
          onClick={() => { setScoreError(adjust(1)); }}
        >
          <Plus aria-hidden />
        </Button>
      </div>
      <p id={scoreErrorId} role="alert" className="field-error">{scoreError && limitMessage(scoreError)}</p>
    </Card>
  );
}
