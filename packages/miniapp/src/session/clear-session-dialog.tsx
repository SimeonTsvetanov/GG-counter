// "Clear session?" (SPEC F6, 1.1 F13): the one alert behind the header's Clear session button, the Leaderboard
// card's Clear session and Reset scores buttons and the Leaderboard dialog's Reset scores. What to clear is
// chosen inside: players and scores (the default of Clear session) or scores only (the default of Reset scores).
import { t } from "../i18n";
import { ChoiceConfirmDialog } from "../components/choice-confirm-dialog";

/** What Clear session removes: everything, or only the scores and their history (players stay at 0). */
export type ClearScope = "all" | "scores";

/** Props of {@link ClearSessionDialog}. */
interface ClearSessionDialogProps {
  /** The option checked when the alert opens; null = closed. */
  request: ClearScope | null;
  /** Called with null when the alert closes (Cancel, Escape or after the confirm). */
  onRequestChange: (request: ClearScope | null) => void;
  /** Runs the chosen scope. */
  onConfirm: (scope: ClearScope) => void;
}

/** Asks what to clear of the session and runs it on confirm. */
export function ClearSessionDialog({ request, onRequestChange, onConfirm }: ClearSessionDialogProps): React.JSX.Element {
  return (
    <ChoiceConfirmDialog<ClearScope>
      open={request !== null}
      onOpenChange={(isOpen) => { if (!isOpen) onRequestChange(null); }}
      title={t("app.session.clearTitle")}
      description={t("app.session.clearMessage")}
      legend={t("app.session.clearLegend")}
      options={[
        { value: "all", label: t("app.session.clearAll"), hint: t("app.session.clearAllHint"), confirm: t("app.session.clearAllConfirm") },
        { value: "scores", label: t("app.session.clearScores"), hint: t("app.session.clearScoresHint"), confirm: t("app.session.clearScoresConfirm") },
      ]}
      initialValue={request ?? "all"}
      onConfirm={onConfirm}
    />
  );
}
