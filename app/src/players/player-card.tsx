// One player's card in the players grid: editable name, remove, and the score controls.
import { useEffect, useState } from "react";
import type { Player } from "gg-counter-core";
import { Minus, Plus } from "lucide-react";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { cn } from "../lib/utils";
import { RemovePlayerButton } from "./remove-player-button";
import { ScoreDialog } from "./score-dialog";

/** Props of {@link PlayerCard}. */
interface PlayerCardProps {
  player: Player;
  /** Highlights the card as the leader. */
  isLeader: boolean;
  onRename: (id: string, name: string) => void;
  onRemove: (id: string) => void;
  onAdjust: (id: string, delta: number) => void;
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
            onChange={(event) => { setName(event.target.value); }}
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
          <RemovePlayerButton
            playerName={player.name}
            onConfirm={() => { onRemove(player.id); }}
          />
        </div>

        <div className="flex items-center justify-center gap-2 text-3xl font-semibold">
          <Button
            variant="ghost"
            size="icon"
            aria-label={`Decrease score for ${player.name}`}
            onClick={() => { onAdjust(player.id, -1); }}
          >
            <Minus className="h-6 w-6" />
          </Button>
          <ScoreDialog
            player={player}
            onApply={(delta) => { onAdjust(player.id, delta); }}
          />
          <Button
            variant="ghost"
            size="icon"
            aria-label={`Increase score for ${player.name}`}
            onClick={() => { onAdjust(player.id, 1); }}
          >
            <Plus className="h-6 w-6" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
