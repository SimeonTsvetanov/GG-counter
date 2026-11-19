// The player's score as a button that opens the "Adjust score" dialog for a custom amount. An amount
// that would take the score out of range keeps the dialog open with the reason under the field.
import { useId, useState } from "react";
import type { Player } from "gg-counter-core";
import { Button } from "../components/ui/button";
import {
  Dialog,
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

/** Props of {@link ScoreDialog}. */
interface ScoreDialogProps {
  player: Player;
  /** Adds `delta` (non-zero, may be negative); returns why it was refused, or null when applied. */
  onApply: (delta: number) => string | null;
}

/** Shows the score; tapping it asks for an amount to add or subtract. */
export function ScoreDialog({ player, onApply }: ScoreDialogProps): React.JSX.Element {
  const [customAmount, setCustomAmount] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
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
          className="flex min-w-[min(4rem,30vw)] justify-center rounded-md bg-card px-3 py-2 text-4xl font-bold shadow-inner focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          aria-label={t("app.score.adjust", { name: player.name })}
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
        <div>
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
            aria-label={t("app.score.amount")}
            aria-invalid={error !== null}
            aria-describedby={errorId}
          />
          <p id={errorId} role="alert" className="mt-2 text-sm font-medium text-destructive empty:mt-0">{error}</p>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="ghost">{t("shell.cancel")}</Button>
          </DialogClose>
          <Button onClick={handleApplyCustom}>{t("app.score.apply")}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
