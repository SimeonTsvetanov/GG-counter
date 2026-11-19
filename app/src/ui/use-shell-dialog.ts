// Which shell dialog is open (Help, Settings, What's new, About, Report a problem), who opened it (focus
// returns there, accessibility §4) and deep links: `#help`, `#settings`… open the dialog (app-shell §3,
// §10) and the hash is removed again so closing it leaves a clean address.
import { useCallback, useEffect, useState } from "react";

/** The dialogs of the app shell. PLAN T-10 adds the policy pages here. */
export const SHELL_DIALOGS = ["help", "settings", "whats-new", "about", "report"] as const;

/** One of {@link SHELL_DIALOGS}. */
export type ShellDialogId = (typeof SHELL_DIALOGS)[number];

/** An open shell dialog. */
export interface OpenShellDialog {
  readonly id: ShellDialogId;
  /** Help only: the section to open and scroll to (e.g. "install"). */
  readonly section?: string;
  /** Gets the focus back when the dialog closes; null = the menu button. */
  readonly opener: HTMLElement | null;
}

/** Options of {@link ShellDialogState.openDialog}. */
export interface OpenDialogOptions {
  readonly section?: string;
  readonly opener?: HTMLElement | null;
}

/** What {@link useShellDialog} returns. */
export interface ShellDialogState {
  readonly dialog: OpenShellDialog | null;
  readonly openDialog: (id: ShellDialogId, options?: OpenDialogOptions) => void;
  readonly closeDialog: () => void;
}

/** Returns the dialog named by a `#id` or `#help/section` hash, or null. */
export function dialogFromHash(hash: string): { id: ShellDialogId; section?: string } | null {
  const [id = "", section] = hash.replace(/^#/, "").split("/");
  const known = SHELL_DIALOGS.find((name) => name === id);
  if (known === undefined) return null;
  return section ? { id: known, section } : { id: known };
}

/** Holds the open shell dialog and opens the one named in the address's hash. */
export function useShellDialog(): ShellDialogState {
  const [dialog, setDialog] = useState<OpenShellDialog | null>(null);

  const openDialog = useCallback((id: ShellDialogId, options: OpenDialogOptions = {}) => {
    setDialog({ id, opener: options.opener ?? null, ...(options.section ? { section: options.section } : {}) });
  }, []);

  const closeDialog = useCallback(() => { setDialog(null); }, []);

  useEffect(() => {
    const openFromHash = (): void => {
      const linked = dialogFromHash(location.hash);
      if (linked === null) return;
      history.replaceState(history.state, "", location.pathname + location.search);
      openDialog(linked.id, linked.section ? { section: linked.section } : {});
    };
    openFromHash();
    window.addEventListener("hashchange", openFromHash);
    return () => { window.removeEventListener("hashchange", openFromHash); };
  }, [openDialog]);

  return { dialog, openDialog, closeDialog };
}
