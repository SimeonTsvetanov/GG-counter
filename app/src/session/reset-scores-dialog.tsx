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
          <AlertDialogTitle>Reset all scores?</AlertDialogTitle>
          <AlertDialogDescription>
            This will set every player's score to zero without removing
            players.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>
            Reset
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
