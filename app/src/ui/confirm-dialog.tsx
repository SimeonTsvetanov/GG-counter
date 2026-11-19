// The confirmation before a bulk or irreversible change (design rule 7: replace the game on import,
// delete all data): a blurred modal whose first focus is Cancel, the least destructive button (a11y §4).
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "../components/ui/alert-dialog";
import { t } from "../i18n";

/** A confirmation to show; null = none. */
export interface Confirmation {
  readonly title: string;
  readonly message: string;
  /** 1–2 words naming the result ("Replace", "Delete"). */
  readonly confirm: string;
  readonly onConfirm: () => void;
}

/** Shows `confirmation` until it is confirmed or cancelled; `onDone` clears it either way. */
export function ConfirmDialog({ confirmation, onDone }: { confirmation: Confirmation | null; onDone: () => void }): React.JSX.Element {
  return (
    <AlertDialog open={confirmation !== null} onOpenChange={(isOpen) => { if (!isOpen) onDone(); }}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{confirmation?.title}</AlertDialogTitle>
          <AlertDialogDescription>{confirmation?.message}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{t("shell.cancel")}</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => { confirmation?.onConfirm(); }}
          >
            {confirmation?.confirm}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
