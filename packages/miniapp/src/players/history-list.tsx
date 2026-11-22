// The rows of a player's history sheet (SPEC 1.1 F16): newest first, each change with its amount, its time
// and an × that removes it at once; the points from before the history (older changes folded into the
// score, pre-1.1 points) close the list as one "Earlier points" line, so the rows add up to the total.
import { scoreBase, type Player, type ScoreEntry } from "gg-counter-core";
import { X } from "lucide-react";
import { Button } from "../components/ui/button";
import { useFlip } from "../hooks/use-flip";
import { getLanguage, t } from "../i18n";
import { formatDelta, formatEntryTime } from "./history-format";
import { limitMessage } from "./limit-message";

/** Props of {@link HistoryList}. */
interface HistoryListProps {
  player: Player;
  /** Attached to the list; the sheet looks up the × buttons in it to move focus after a removal. */
  listRef: React.RefObject<HTMLOListElement | null>;
  /** Id of the change Restore just put back (it fades in), or null. */
  restoredId: string | null;
  /** Id of the change whose removal core refused (its row says why), or null. */
  refusedId: string | null;
  /** Removes `entry`, found at `index` of the history (oldest first) and `position` of this list. */
  onRemove: (entry: ScoreEntry, index: number, position: number) => void;
}

/** Lists the player's changes with a remove button each, or says there are none yet. */
export function HistoryList({ player, listRef, restoredId, refusedId, onRemove }: HistoryListProps): React.JSX.Element {
  // The rows below a removed or restored change slide to their new place (SPEC 1.2 F20).
  useFlip(listRef, "entry");
  const base = scoreBase(player);
  const now = new Date();
  const lang = getLanguage();
  const rows = player.history.map((entry, index) => ({ entry, index })).reverse();
  if (rows.length === 0 && base === 0) return <p className="history-empty">{t("app.history.empty", { name: player.name })}</p>;

  return (
    <>
      {rows.length === 0 && <p className="history-empty">{t("app.history.empty", { name: player.name })}</p>}
      <ol ref={listRef} className="history-list" aria-label={t("app.history.list")}>
        {rows.map(({ entry, index }, position) => {
          const change = formatDelta(entry.delta);
          return (
            <li key={entry.id} className="history-row" data-flip={`entry:${entry.id}`} data-restored={entry.id === restoredId ? "" : undefined}>
              <span className="history-amount">{change}</span>
              <time className="history-time" dateTime={entry.at}>{formatEntryTime(entry.at, now, lang)}</time>
              <Button
                variant="ghost"
                size="icon"
                className="history-remove"
                data-remove-entry={entry.id}
                aria-label={t("app.history.remove", { change, name: player.name })}
                onClick={() => { onRemove(entry, index, position); }}
              >
                <X aria-hidden />
              </Button>
              {refusedId === entry.id && <p role="alert" className="field-error history-error">{limitMessage("SCORE_OUT_OF_RANGE")}</p>}
            </li>
          );
        })}
        {base !== 0 && (
          <li className="history-row history-row--earlier" data-flip="entry:earlier">
            <span className="history-amount">{formatDelta(base)}</span>
            <span className="history-time">{t("app.history.earlier")}</span>
          </li>
        )}
      </ol>
    </>
  );
}
