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
      <Card>
        <CardHeader>
          <CardTitle>{t("app.players.addTitle")}</CardTitle>
          <span className="card-meta">{t("app.players.count", { count: playerCount })}</span>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Input
              ref={inputRef}
              value={name}
              onChange={(event) => { onNameChange(event.target.value); }}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  onAdd();
                }
              }}
              autoComplete="off"
              autoCapitalize="words"
              enterKeyHint="done"
              placeholder={t("app.players.namePlaceholder")}
              aria-label={t("app.players.nameLabel")}
              aria-invalid={error !== null}
              aria-describedby={errorId}
            />
            <Button onClick={onAdd} className="sm:min-w-28">
              {t("app.players.add")}
            </Button>
          </div>
          {/* Always in the page, so screen readers announce what appears in it (ui-patterns §2). */}
          <p id={errorId} role="alert" className="field-error">{error}</p>
        </CardContent>
      </Card>
    </div>
  );
}
