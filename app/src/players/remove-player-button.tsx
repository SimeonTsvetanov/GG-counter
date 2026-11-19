// The trash button on a player card and its "Remove player?" confirmation.
import { Trash2 } from "lucide-react";
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
import { Button } from "../components/ui/button";
import { t } from "../i18n";

/** Props of {@link RemovePlayerButton}. */
interface RemovePlayerButtonProps {
  playerName: string;
  /** Removes the player (after the confirmation). */
  onConfirm: () => void;
}

/** Asks before removing one player and their score. */
export function RemovePlayerButton({ playerName, onConfirm }: RemovePlayerButtonProps): React.JSX.Element {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label={t("app.players.remove", { name: playerName })}
          className="text-destructive hover:text-destructive"
        >
          <Trash2 className="h-5 w-5" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t("app.players.removeTitle")}</AlertDialogTitle>
          <AlertDialogDescription>
            {t("app.players.removeMessage", { name: playerName })}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{t("shell.cancel")}</AlertDialogCancel>
          <AlertDialogAction
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            onClick={onConfirm}
          >
            {t("app.players.removeConfirm")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
