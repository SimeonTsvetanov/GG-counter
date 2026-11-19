// The Add player card: a name field and the Add button (Enter adds too).
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { CARD_WIDTH_CLASS } from "../lib/layout";

/** Props of {@link AddPlayerCard}. */
interface AddPlayerCardProps {
  /** Attached to the card's wrapper (the header's Add player button scrolls to it). */
  ref: React.Ref<HTMLDivElement>;
  /** Attached to the name field (the header's Add player button focuses it). */
  inputRef: React.Ref<HTMLInputElement>;
  /** The name typed so far; kept by the parent so it survives the card moving. */
  name: string;
  onNameChange: (name: string) => void;
  /** Adds a player with the typed name. */
  onAdd: () => void;
  playerCount: number;
}

/** Lets the user type a name and add the player. */
export function AddPlayerCard({
  ref,
  inputRef,
  name,
  onNameChange,
  onAdd,
  playerCount,
}: AddPlayerCardProps): React.JSX.Element {
  return (
    <div ref={ref} className={CARD_WIDTH_CLASS}>
      <Card className="border-0 shadow-md">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base font-semibold">
            Add Player
          </CardTitle>
          <span className="text-xs text-muted-foreground">
            {playerCount} players
          </span>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <Input
              ref={inputRef}
              value={name}
              onChange={(event) => { onNameChange(event.target.value); }}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  onAdd();
                }
              }}
              placeholder="Player Name"
              aria-label="Player name"
              className="flex-1 min-w-0"
            />
            <Button onClick={onAdd} className="w-full sm:w-auto">
              Add
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">Player name</p>
          <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
            {playerCount} players
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
