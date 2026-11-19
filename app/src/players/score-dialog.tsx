// The player's score as a button that opens the "Adjust score" dialog for a custom amount.
import { useState } from "react";
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

/** Props of {@link ScoreDialog}. */
interface ScoreDialogProps {
  player: Player;
  /** Adds `delta` (non-zero, may be negative) to the player's score. */
  onApply: (delta: number) => void;
}

/** Shows the score; tapping it asks for an amount to add or subtract. */
export function ScoreDialog({ player, onApply }: ScoreDialogProps): React.JSX.Element {
  const [customAmount, setCustomAmount] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  const handleApplyCustom = () => {
    const parsed = Number(customAmount);
    if (!Number.isFinite(parsed) || parsed === 0) {
      return;
    }

    onApply(parsed);
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
        }
      }}
    >
      <DialogTrigger asChild>
        <button
          type="button"
          className="flex min-w-[min(4rem,30vw)] justify-center rounded-md bg-card px-3 py-2 text-4xl font-bold shadow-inner focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          aria-label={`Adjust score for ${player.name}`}
        >
          {player.score}
        </button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Adjust score</DialogTitle>
          <DialogDescription>
            Add or subtract points for {player.name}. Use negative values
            to subtract.
          </DialogDescription>
        </DialogHeader>
        <Input
          type="number"
          inputMode="numeric"
          autoFocus
          value={customAmount}
          onChange={(event) => { setCustomAmount(event.target.value); }}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              handleApplyCustom();
            }
          }}
          aria-label="Custom score adjustment"
        />
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="ghost">Cancel</Button>
          </DialogClose>
          <Button onClick={handleApplyCustom}>Apply</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
