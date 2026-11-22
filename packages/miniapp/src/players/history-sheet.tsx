// The "last changes" line of a player card (SPEC 1.1 F16): the newest score changes in one dimmed line, like
// a calculator's tape above the result, newest at the right end. It is the button that opens the player's
// history sheet (history-sheet-content.tsx). With no history the line stays as empty space, so every card
// keeps the same height and nothing jumps when the first change arrives.
// The sheet's content is its own chunk (performance §1, DECISIONS 2026-11-22): the line and the Dialog root
// stay in the first load, so a tap always opens the sheet (the open state is kept while the chunk arrives);
// the chunk starts loading as soon as a line is drawn, so the first tap rarely waits.
import { lazy, Suspense, useEffect, useRef, useState } from "react";
import type { Player } from "gg-counter-core";
import { Dialog, DialogTrigger } from "../components/ui/dialog";
import { useFreshKey } from "../hooks/use-change";
import { t } from "../i18n";
import { formatDelta } from "./history-format";
import type { HistoryActions } from "./history-sheet-content";

/** Most changes drawn on the line; more never fit a card, the overflow is cut at the left edge. */
const STRIP_ENTRIES = 8;
/** Changes read out in the button's name (the newest first), so the name stays short. */
const SPOKEN_ENTRIES = 3;

/** Loads the sheet's content chunk (the browser fetches it once; later calls share the same module). */
const loadContent = () => import("./history-sheet-content");
const HistorySheetContent = lazy(() => loadContent().then((module) => ({ default: module.HistorySheetContent })));

/** Props of {@link HistorySheet}. */
interface HistorySheetProps extends HistoryActions {
  player: Player;
  /** This player's change is the newest of the game (the last-scored card, SPEC 1.1 F17). */
  isLastScored: boolean;
}

/** Returns the accessible name of the line: whose history, whether scored last, and the newest changes. */
function stripLabel(player: Player, isLastScored: boolean): string {
  const changes = player.history.slice(-SPOKEN_ENTRIES).reverse().map((entry) => formatDelta(entry.delta)).join(", ");
  return t(isLastScored ? "app.history.openLast" : "app.history.open", { name: player.name, changes });
}

/** Shows the player's newest changes; tapping them opens the whole history with a remove button per change. */
export function HistorySheet({ player, isLastScored, onRemoveEntry, onRestoreEntry }: HistorySheetProps): React.JSX.Element {
  const [isOpen, setIsOpen] = useState(false);
  const slotRef = useRef<HTMLDivElement>(null);
  // Newest first in the markup: the row runs right to left (player-card.css), so the newest sits at the right end.
  const recent = player.history.slice(-STRIP_ENTRIES).reverse();
  // A change that arrived after the card appeared slides into the line (SPEC 1.2 F20); merged taps keep the same entry.
  const freshId = useFreshKey(recent[0]?.id ?? null);
  const hasLine = recent.length > 0;
  useEffect(() => {
    if (hasLine) void loadContent();
  }, [hasLine]);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <div ref={slotRef} className="history-slot">
        {hasLine && (
          <DialogTrigger asChild>
            <button type="button" className="history-strip" aria-label={stripLabel(player, isLastScored)}>
              <span className="history-strip-items" aria-hidden>
                {recent.map((entry, index) => (
                  <span
                    key={entry.id}
                    className="history-strip-item"
                    data-newest={index === 0 ? "" : undefined}
                    data-fresh={index === 0 && entry.id === freshId ? "" : undefined}
                  >
                    {formatDelta(entry.delta)}
                  </span>
                ))}
              </span>
            </button>
          </DialogTrigger>
        )}
      </div>
      {isOpen && (
        <Suspense fallback={null}>
          <HistorySheetContent
            player={player}
            onRemoveEntry={onRemoveEntry}
            onRestoreEntry={onRestoreEntry}
            onCloseAutoFocus={(event) => {
              const slot = slotRef.current;
              // Radix focuses the line again; once every change was removed the line is gone, and the score is next.
              if (slot?.querySelector("button")) return;
              event.preventDefault();
              slot?.closest(".player-card")?.querySelector<HTMLElement>("[data-adjust-score]")?.focus();
            }}
          />
        </Suspense>
      )}
    </Dialog>
  );
}
