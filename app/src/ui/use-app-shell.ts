// Wires the app shell for the main screen: the open dialog (with deep links), the install prompt, the
// menu/footer entries, service-worker updates and What's new after an update. Keeps app.tsx about
// the game itself.
import { usePwaInstall, type PwaInstall } from "../hooks/use-pwa-install";
import { useShellItemRunner, type RunShellItem } from "./shell-items";
import { useToast, type ShowToast } from "./toast";
import { usePwaUpdates } from "./use-pwa-updates";
import { useShellDialog, type ShellDialogState } from "./use-shell-dialog";
import { useWhatsNewOnce } from "./use-whats-new-once";

/** What {@link useAppShell} returns. */
export interface AppShell extends ShellDialogState {
  readonly install: PwaInstall;
  readonly runItem: RunShellItem;
  readonly showToast: ShowToast;
}

/** Sets up the shell once for the main screen (must be inside ToastProvider). */
export function useAppShell(): AppShell {
  const showToast = useToast();
  const install = usePwaInstall();
  const dialogs = useShellDialog();
  const runItem = useShellItemRunner({ openDialog: dialogs.openDialog, showToast, install });
  usePwaUpdates(showToast);
  useWhatsNewOnce(dialogs.openDialog);
  return { ...dialogs, install, runItem, showToast };
}
