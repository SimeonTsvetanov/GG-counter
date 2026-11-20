// The player's score as a button that opens the "Adjust score" dialog for a custom amount. An amount
// that would take the score out of range keeps the dialog open with the reason under the field.
import { useId, useState } from "react";
import type { Player } from "gg-counter-core";
import { Button } from "../components/ui/button";
import {
  Dialog,
  DialogBody,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../components/ui/dialog";
import { Input } from "../components/ui/input";
import { t } from "../i18n";
import { limitMessage, type LimitCode } from "./limit-message";
import { isLongScore } from "./score-size";

/** Props of {@link ScoreDialog}. */
interface ScoreDialogProps {
  player: Player;
  /** Adds `delta` (non-zero, may be negative); returns the limit it was refused for, or null when applied. */
  onApply: (delta: number) => LimitCode | null;
}

/** Shows the score; tapping it asks for an amount to add or subtract. */
export function ScoreDialog({ player, onApply }: ScoreDialogProps): React.JSX.Element {
  const [customAmount, setCustomAmount] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState<LimitCode | null>(null);
  const errorId = useId();

  const handleApplyCustom = () => {
    const parsed = Number(customAmount);
    if (!Number.isFinite(parsed) || parsed === 0) {
      return;
    }

    const refused = onApply(parsed);
    setError(refused);
    if (refused !== null) {
      return;
    }
    setCustomAmount("");
    setIsOpen(false);
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        setIsOpen(open);
        if (open) {
          setCustomAmount("");
          setError(null);
        }
      }}
    >
      <DialogTrigger asChild>
        <button
          type="button"
          className="score"
          data-adjust-score=""
          data-long={isLongScore(player.score) ? "" : undefined}
          aria-label={t("app.score.adjust", { name: player.name, score: player.score })}
        >
          {player.score}
        </button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("app.score.title")}</DialogTitle>
          <DialogDescription>
            {t("app.score.description", { name: player.name })}
          </DialogDescription>
        </DialogHeader>
        <DialogBody>
          <Input
            type="number"
            inputMode="numeric"
            autoFocus
            value={customAmount}
            onChange={(event) => {
              setCustomAmount(event.target.value);
              setError(null);
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                handleApplyCustom();
              }
            }}
            autoComplete="off"
            enterKeyHint="done"
            aria-label={t("app.score.amount")}
            aria-invalid={error !== null}
            aria-describedby={errorId}
          />
          <p id={errorId} role="alert" className="field-error">{error && limitMessage(error)}</p>
        </DialogBody>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="secondary">{t("shell.cancel")}</Button>
          </DialogClose>
          <Button onClick={handleApplyCustom}>{t("app.score.apply")}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
