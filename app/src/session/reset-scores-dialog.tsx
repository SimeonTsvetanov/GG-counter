// "Reset all scores?" confirmation, opened from the leaderboard dialog and the leaderboard card.
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../components/ui/alert-dialog";
import { t } from "../i18n";

/** Props of {@link ResetScoresDialog}. */
interface ResetScoresDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Sets every score to zero. */
  onConfirm: () => void;
}

/** Asks before setting every player's score to zero; players stay. */
export function ResetScoresDialog({ open, onOpenChange, onConfirm }: ResetScoresDialogProps): React.JSX.Element {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t("app.session.resetTitle")}</AlertDialogTitle>
          <AlertDialogDescription>
            {t("app.session.resetMessage")}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{t("shell.cancel")}</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>
            {t("app.session.resetConfirm")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
