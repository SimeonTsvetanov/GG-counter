// "Clear session?" confirmation — opened from the header (controlled) and from the leaderboard card
// (with its own trigger); the two places have always used slightly different descriptions.
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "../components/ui/alert-dialog";

/** Props of {@link ClearSessionDialog}. */
interface ClearSessionDialogProps {
  /** Controlled open state; leave out (with `children`) to let the trigger open it. */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  description: string;
  /** Deletes all players and scores. */
  onConfirm: () => void;
  /** Optional trigger button. */
  children?: React.ReactNode;
}

/** Asks before deleting all players and scores; Clear runs `onConfirm`. */
export function ClearSessionDialog({
  open,
  onOpenChange,
  description,
  onConfirm,
  children,
}: ClearSessionDialogProps): React.JSX.Element {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      {children !== undefined && <AlertDialogTrigger asChild>{children}</AlertDialogTrigger>}
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Clear session?</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            onClick={onConfirm}
          >
            Clear
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
