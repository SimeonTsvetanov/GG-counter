// A player's history sheet (SPEC 1.1 F16): the name, the total, every change with an × that removes it at
// once (ui-patterns §4: one small, reversible item → no alert), and a Restore button for the last removal next
// to Close. Restore lives in the sheet's own button row instead of a toast: a toast at the top of a sheet
// pushes the rows down under the finger (DECISIONS 2026-11-20). Focus never drops to the page (accessibility §3).
import { useEffect, useRef, useState } from "react";
import type { Player, ScoreEntry } from "gg-counter-core";
import { Undo2 } from "lucide-react";
import { Button } from "../components/ui/button";
import { DialogBody, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../components/ui/dialog";
import type { GameStateApi } from "../hooks/use-game-state";
import { t } from "../i18n";
import { formatDelta } from "./history-format";
import { HistoryList } from "./history-list";
import { limitMessage } from "./limit-message";

/** The game actions the history sheet uses. */
export interface HistoryActions {
  onRemoveEntry: GameStateApi["removeScoreEntry"];
  onRestoreEntry: GameStateApi["restoreScoreEntry"];
}

/** Props of {@link HistorySheetContent}. */
interface HistorySheetContentProps extends HistoryActions {
  player: Player;
  /** Radix's close focus handler: lets the sheet send focus somewhere else when its opener is gone. */
  onCloseAutoFocus: (event: Event) => void;
}

/** The last removed change and where it was, for Restore. */
interface Removed {
  readonly entry: ScoreEntry;
  readonly index: number;
}

/** Where focus goes after the next render: a row by its place in the list, or the × of one change. */
type FocusRequest = { readonly position: number } | { readonly entryId: string };

/** Focuses the × asked for (or the nearest row's, else Close) once the list has re-rendered. */
function useFocusAfterRender(list: React.RefObject<HTMLOListElement | null>, close: React.RefObject<HTMLButtonElement | null>): React.RefObject<FocusRequest | null> {
  const request = useRef<FocusRequest | null>(null);
  useEffect(() => {
    const wanted = request.current;
    if (wanted === null) return;
    request.current = null;
    const buttons = Array.from(list.current?.querySelectorAll<HTMLElement>("[data-remove-entry]") ?? []);
    const target = "entryId" in wanted
      ? buttons.find((button) => button.dataset.removeEntry === wanted.entryId)
      : buttons.at(Math.min(wanted.position, buttons.length - 1));
    (target ?? close.current)?.focus();
  });
  return request;
}

/** The open history sheet of one player. */
export function HistorySheetContent({ player, onRemoveEntry, onRestoreEntry, onCloseAutoFocus }: HistorySheetContentProps): React.JSX.Element {
  const titleRef = useRef<HTMLHeadingElement>(null);
  const listRef = useRef<HTMLOListElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const focusRequest = useFocusAfterRender(listRef, closeRef);
  const [removed, setRemoved] = useState<Removed | null>(null);
  const [restoredId, setRestoredId] = useState<string | null>(null);
  const [refusedId, setRefusedId] = useState<string | null>(null);
  const [restoreRefused, setRestoreRefused] = useState(false);
  // Read out politely after each removal or restore: the total changed although focus did not move to it.
  const [announcement, setAnnouncement] = useState("");

  const remove = (entry: ScoreEntry, index: number, position: number) => {
    const result = onRemoveEntry(player.id, entry.id);
    if (!result.ok) {
      setRefusedId(entry.id);
      return;
    }
    setRefusedId(null);
    setRestoreRefused(false);
    setRestoredId(null);
    setRemoved({ entry, index });
    setAnnouncement(t("app.history.removed", { change: formatDelta(entry.delta), total: player.score - entry.delta }));
    focusRequest.current = { position };
  };

  const restore = () => {
    if (removed === null) return;
    const result = onRestoreEntry(player.id, removed.entry, removed.index);
    setRestoreRefused(!result.ok);
    if (!result.ok) return;
    setRemoved(null);
    setRestoredId(removed.entry.id);
    setAnnouncement(t("app.history.restored", { change: formatDelta(removed.entry.delta), total: player.score + removed.entry.delta }));
    focusRequest.current = { entryId: removed.entry.id };
  };

  return (
    <DialogContent
      className="history-sheet"
      onOpenAutoFocus={(event) => {
        // A long sheet starts reading at its title (accessibility §4) — never on an × that removes at once.
        event.preventDefault();
        titleRef.current?.focus();
      }}
      onCloseAutoFocus={onCloseAutoFocus}
    >
      <DialogHeader>
        <DialogTitle ref={titleRef} tabIndex={-1}>{player.name}</DialogTitle>
        <DialogDescription className="history-total">{t("app.history.total", { count: player.score })}</DialogDescription>
      </DialogHeader>
      <DialogBody>
        <HistoryList player={player} listRef={listRef} restoredId={restoredId} refusedId={refusedId} onRemove={remove} />
        <p role="status" className="sr-only">{announcement}</p>
        <p role="alert" className="field-error">{restoreRefused && limitMessage("SCORE_OUT_OF_RANGE")}</p>
      </DialogBody>
      <DialogFooter className="history-actions">
        {removed !== null && (
          <Button variant="secondary" onClick={restore}>
            <Undo2 aria-hidden /> {t("app.history.restore", { change: formatDelta(removed.entry.delta) })}
          </Button>
        )}
        <DialogClose asChild>
          <Button ref={closeRef} variant="secondary">{t("shell.close")}</Button>
        </DialogClose>
      </DialogFooter>
    </DialogContent>
  );
}
