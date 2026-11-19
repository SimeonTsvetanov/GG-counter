// The Add player card: a name field and the Add button (Enter adds too). A name over the limit or a
// full game shows why under the field (role="alert", linked with aria-describedby).
import { useId } from "react";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { t } from "../i18n";
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
  /** Why the last Add was refused (limits), or null. */
  error: string | null;
}

/** Lets the user type a name and add the player. */
export function AddPlayerCard({
  ref,
  inputRef,
  name,
  onNameChange,
  onAdd,
  playerCount,
  error,
}: AddPlayerCardProps): React.JSX.Element {
  const errorId = useId();
  return (
    <div ref={ref} className={CARD_WIDTH_CLASS}>
      <Card className="border-0 shadow-md">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base font-semibold">
            {t("app.players.addTitle")}
          </CardTitle>
          <span className="text-xs text-muted-foreground">
            {t("app.players.count", { count: playerCount })}
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
              placeholder={t("app.players.namePlaceholder")}
              aria-label={t("app.players.nameLabel")}
              aria-invalid={error !== null}
              aria-describedby={errorId}
              className="flex-1 min-w-0"
            />
            <Button onClick={onAdd} className="w-full sm:w-auto">
              {t("app.players.add")}
            </Button>
          </div>
          {/* The error replaces the helper text while there is one (ui-patterns §2); the alert
              element is always there, so screen readers announce what appears in it. */}
          <div>
            {error === null && <p className="text-xs text-muted-foreground">{t("app.players.nameLabel")}</p>}
            <p id={errorId} role="alert" className="text-sm font-medium text-destructive">{error}</p>
          </div>
          <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
            {t("app.players.count", { count: playerCount })}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
