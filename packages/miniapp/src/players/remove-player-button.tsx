// The trash button on a player card and its alert (SPEC F2, 1.1 F14): remove the player (the default) or reset
// only their score — the same choice alert as Clear session (components/choice-confirm-dialog.tsx).
import { Trash2 } from "lucide-react";
import { Button } from "../components/ui/button";
import { t } from "../i18n";
import { ChoiceConfirmDialog } from "../components/choice-confirm-dialog";

/** What the trash button removes: the player, or only the score and its history. */
type RemoveScope = "player" | "score";

/** Props of {@link RemovePlayerButton}. */
interface RemovePlayerButtonProps {
  playerName: string;
  /** Removes the player (after the alert). */
  onRemove: () => void;
  /** Sets the player's score to 0 and empties their history (after the alert). */
  onResetScore: () => void;
  /** Moves focus on once the player (and so this button) is gone. */
  focusAfterRemove: () => void;
}

/** Asks whether to remove one player or only their score, then does it. */
export function RemovePlayerButton({ playerName, onRemove, onResetScore, focusAfterRemove }: RemovePlayerButtonProps): React.JSX.Element {
  const name = { name: playerName };
  return (
    <ChoiceConfirmDialog<RemoveScope>
      trigger={
        <Button variant="ghost" size="icon" aria-label={t("app.players.remove", name)} className="text-text-secondary" data-remove-player="">
          <Trash2 aria-hidden />
        </Button>
      }
      title={t("app.players.removeTitle")}
      description={t("app.players.removeMessage", name)}
      legend={t("app.players.removeLegend")}
      options={[
        { value: "player", label: t("app.players.removePlayer"), hint: t("app.players.removePlayerHint", name), confirm: t("app.players.removePlayerConfirm") },
        { value: "score", label: t("app.players.removeScore"), hint: t("app.players.removeScoreHint", name), confirm: t("app.players.removeScoreConfirm") },
      ]}
      focusFallback={focusAfterRemove}
      onConfirm={(scope) => {
        if (scope === "player") onRemove();
        else onResetScore();
      }}
    />
  );
}
