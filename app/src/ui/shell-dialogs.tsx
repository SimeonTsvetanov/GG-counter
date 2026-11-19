// Renders the open shell dialog. Each dialog is its own chunk (React.lazy), loaded when first opened,
// so Help, Settings, What's new, About, Report and the policy pages cost nothing at first load
// (performance §1); the service worker precaches the chunks, so they open offline too.
import { lazy, Suspense } from "react";
import type { AppData } from "../storage";
import type { OpenShellDialog, ShellDialogId } from "./use-shell-dialog";

const HelpDialog = lazy(() => import("./help-dialog").then((module) => ({ default: module.HelpDialog })));
const SettingsDialog = lazy(() => import("./settings-dialog").then((module) => ({ default: module.SettingsDialog })));
const WhatsNewDialog = lazy(() => import("./whats-new-dialog").then((module) => ({ default: module.WhatsNewDialog })));
const AboutDialog = lazy(() => import("./about-dialog").then((module) => ({ default: module.AboutDialog })));
const ReportDialog = lazy(() => import("./report-dialog").then((module) => ({ default: module.ReportDialog })));
const LegalDialog = lazy(() => import("./legal-dialog").then((module) => ({ default: module.LegalDialog })));

/** Props of {@link ShellDialogs}. */
export interface ShellDialogsProps {
  readonly dialog: OpenShellDialog | null;
  readonly openDialog: (id: ShellDialogId) => void;
  readonly onClose: () => void;
  readonly onImported: (data: AppData) => void;
  readonly onCleared: () => void;
}

/** Returns the open dialog's element, or null when none is open. */
function OpenDialog({ dialog, openDialog, onClose, onImported, onCleared }: ShellDialogsProps & { dialog: OpenShellDialog }): React.JSX.Element {
  const common = { onClose, opener: dialog.opener };
  switch (dialog.id) {
    case "help":
      return <HelpDialog {...common} openDialog={openDialog} {...(dialog.section ? { section: dialog.section } : {})} />;
    case "settings":
      return <SettingsDialog {...common} onImported={onImported} onCleared={onCleared} />;
    case "whats-new":
      return <WhatsNewDialog {...common} />;
    case "about":
      return <AboutDialog {...common} openDialog={openDialog} />;
    case "report":
      return <ReportDialog {...common} />;
    case "terms":
    case "privacy":
    case "ai-notice":
    case "legal-notice":
    case "support":
      return <LegalDialog {...common} page={dialog.id} openDialog={openDialog} />;
    default:
      return dialog.id satisfies never;
  }
}

/** Renders the shell dialog that is open, if any. */
export function ShellDialogs(props: ShellDialogsProps): React.JSX.Element | null {
  if (props.dialog === null) return null;
  return (
    <Suspense fallback={null}>
      {/* key: opening another dialog from inside one (Help → Report) mounts it fresh */}
      <OpenDialog key={props.dialog.id} {...props} dialog={props.dialog} />
    </Suspense>
  );
}
