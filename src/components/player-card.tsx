import { useEffect, useState } from "react";
import type { Player } from "../types";
import { Card, CardContent } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { cn } from "../lib/utils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "./ui/alert-dialog";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import { Minus, Plus, Trash2 } from "lucide-react";

interface PlayerCardProps {
  player: Player;
  isLeader: boolean;
  onRename: (id: string, name: string) => void;
  onRemove: (id: string) => void;
  onAdjust: (id: string, delta: number) => void;
  className?: string;
}

export function PlayerCard({
  player,
  isLeader,
  onRename,
  onRemove,
  onAdjust,
  className,
}: PlayerCardProps) {
  const [name, setName] = useState(player.name);
  const [customAmount, setCustomAmount] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    setName(player.name);
  }, [player.name]);

  const handleNameCommit = () => {
    const trimmed = name.trim();
    if (trimmed.length === 0) {
      setName(player.name);
      return;
    }

    if (trimmed !== player.name) {
      onRename(player.id, trimmed);
    }
  };

  const handleApplyCustom = () => {
    const parsed = Number(customAmount);
    if (!Number.isFinite(parsed) || parsed === 0) {
      return;
    }

    onAdjust(player.id, parsed);
    setCustomAmount("");
    setIsDialogOpen(false);
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
        <div className="flex items-center gap-2">
          <Input
            value={name}
            onChange={(event) => setName(event.target.value)}
            onBlur={handleNameCommit}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                handleNameCommit();
                (event.target as HTMLInputElement).blur();
              }
            }}
            aria-label={`Player name for ${player.name}`}
            maxLength={32}
          />
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                aria-label={`Remove ${player.name}`}
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="h-5 w-5" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Remove player?</AlertDialogTitle>
                <AlertDialogDescription>
                  This removes {player.name} and their score.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  onClick={() => onRemove(player.id)}
                >
                  Remove
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>

        <div className="flex items-center justify-center gap-2 text-3xl font-semibold">
          <Button
            variant="ghost"
            size="icon"
            aria-label={`Decrease score for ${player.name}`}
            onClick={() => onAdjust(player.id, -1)}
          >
            <Minus className="h-6 w-6" />
          </Button>
          <Dialog
            open={isDialogOpen}
            onOpenChange={(open) => {
              setIsDialogOpen(open);
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
                onChange={(event) => setCustomAmount(event.target.value)}
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
          <Button
            variant="ghost"
            size="icon"
            aria-label={`Increase score for ${player.name}`}
            onClick={() => onAdjust(player.id, 1)}
          >
            <Plus className="h-6 w-6" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
