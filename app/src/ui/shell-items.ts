// What each menu/footer entry of app.config.ts `shell` does (app-shell §3): open a shell dialog, share
// the app, install it, or follow a link. Record<ShellItemId, …> makes the compiler ask for every new
// id, so PLAN T-10 adds a legal page as one config id + one entry here + its dialog.
import { useCallback } from "react";
import { app, type ShellItemId } from "../config";
import type { PwaInstall } from "../hooks/use-pwa-install";
import { t } from "../i18n";
import { shareApp } from "./share-app";
import type { ShowToast } from "./toast";
import type { OpenDialogOptions, ShellDialogId } from "./use-shell-dialog";

/** What an entry does. */
export type ShellItemTarget =
  | { readonly kind: "dialog"; readonly dialog: ShellDialogId }
  | { readonly kind: "share-app" }
  | { readonly kind: "install" }
  | { readonly kind: "link"; readonly href: string };

/** Every entry the shell knows. */
export const SHELL_ITEMS: Readonly<Record<ShellItemId, ShellItemTarget>> = {
  help: { kind: "dialog", dialog: "help" },
  settings: { kind: "dialog", dialog: "settings" },
  "whats-new": { kind: "dialog", dialog: "whats-new" },
  about: { kind: "dialog", dialog: "about" },
  report: { kind: "dialog", dialog: "report" },
  "share-app": { kind: "share-app" },
  install: { kind: "install" },
  support: { kind: "link", href: app.shell.buyMeACoffee },
  source: { kind: "link", href: app.repo },
};

/** Returns the label of an entry; Install says "Installed ✓" once the app is installed. */
export function shellItemLabel(id: ShellItemId, isInstalled: boolean): string {
  if (id === "install" && isInstalled) return t("shell.menu.installed");
  return t(`shell.menu.items.${id}`);
}

/** What {@link useShellItemRunner} needs from the app. */
export interface ShellItemContext {
  readonly openDialog: (id: ShellDialogId, options?: OpenDialogOptions) => void;
  readonly showToast: ShowToast;
  readonly install: PwaInstall;
}

/** Runs an entry that is not a link (links are rendered as `<a>` and need no code). */
export type RunShellItem = (id: ShellItemId, opener: HTMLElement | null) => void;

/** Returns the function that runs a menu or footer entry. */
export function useShellItemRunner({ openDialog, showToast, install }: ShellItemContext): RunShellItem {
  return useCallback<RunShellItem>(
    (id, opener) => {
      const target = SHELL_ITEMS[id];
      switch (target.kind) {
        case "dialog":
          openDialog(target.dialog, { opener });
          return;
        case "share-app":
          void shareApp().then((outcome) => {
            if (outcome === "copied") showToast({ message: t("shell.linkCopied") });
            if (outcome === "failed") showToast({ message: t("shell.shareFailed", { url: app.url }) });
          });
          return;
        case "install":
          // Without the browser's install prompt (iPhone, Firefox, already dismissed) Help shows the steps.
          if (install.canInstall) void install.promptInstall();
          else openDialog("help", { section: "install", opener });
          return;
        case "link":
          return;
        default:
          return;
      }
    },
    [install, openDialog, showToast]
  );
}
