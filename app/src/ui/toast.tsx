// Toasts for the whole app (design → ui-patterns §6, accessibility §5): one polite live region, one
// toast at a time, info toasts hide after a few seconds (paused while hovered or focused), pinned ones
// (the update offer) stay until used and come back after a later info toast. While a modal is open
// the toast renders inside the top dialog, because Radix makes everything outside it inert.
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { Button } from "../components/ui/button";
import { t } from "../i18n";
import { cn } from "../lib/utils";

/** How long an info toast stays (ui-patterns §6: 4–6 s). */
export const TOAST_DURATION_MS = 5000;

/** One toast: a message and an optional action button. */
export interface Toast {
  readonly message: string;
  readonly action?: { readonly label: string; readonly run: () => void };
  /** Stays until its action runs or it is dismissed (the update offer). */
  readonly pinned?: boolean;
}

/** Shows a toast; replaces the current info toast. */
export type ShowToast = (toast: Toast) => void;

const ToastContext = createContext<ShowToast | null>(null);

const OPEN_DIALOG = '[role="dialog"][data-state="open"], [role="alertdialog"][data-state="open"]';

/** Returns the top open modal dialog, or null; Radix portals each dialog as a later body child. */
function topDialog(): HTMLElement | null {
  const open = document.querySelectorAll<HTMLElement>(OPEN_DIALOG);
  return open.item(open.length - 1);
}

/**
 * Returns a slot at the start of the top open dialog, or null when none is open. At the start, so the
 * dialog's own buttons keep their order (the last one stays the dialog's main action).
 */
function useTopDialogSlot(): HTMLElement | null {
  const [dialog, setDialog] = useState<HTMLElement | null>(null);
  const [slot, setSlot] = useState<HTMLElement | null>(null);
  useEffect(() => {
    const update = (): void => { setDialog(topDialog()); };
    const observer = new MutationObserver(update);
    observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ["data-state"] });
    update();
    return () => { observer.disconnect(); };
  }, []);
  useEffect(() => {
    if (dialog === null) {
      setSlot(null);
      return;
    }
    const element = document.createElement("div");
    dialog.prepend(element);
    setSlot(element);
    return () => { element.remove(); };
  }, [dialog]);
  return slot;
}

/** The visible toast with its buttons; `inDialog` lays it out inside a dialog instead of fixed at the bottom. */
function ToastView({ toast, inDialog, onDismiss, onHold }: { toast: Toast; inDialog: boolean; onDismiss: () => void; onHold: (held: boolean) => void }): React.JSX.Element {
  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-lg bg-foreground px-4 py-3 text-sm text-background shadow-lg",
        inDialog ? "mb-2" : "pointer-events-auto mx-auto w-full max-w-md"
      )}
      onMouseEnter={() => { onHold(true); }}
      onMouseLeave={() => { onHold(false); }}
      onFocus={() => { onHold(true); }}
      onBlur={() => { onHold(false); }}
    >
      <p className="flex-1">{toast.message}</p>
      {toast.action && (
        <Button size="sm" variant="secondary" onClick={() => { toast.action?.run(); onDismiss(); }}>
          {toast.action.label}
        </Button>
      )}
      <Button size="sm" variant="ghost" className="text-background hover:bg-background/15 hover:text-background" onClick={onDismiss}>
        {t("shell.dismiss")}
      </Button>
    </div>
  );
}

/** Provides {@link useToast} and renders the live region. */
export function ToastProvider({ children }: { children: ReactNode }): React.JSX.Element {
  const [info, setInfo] = useState<Toast | null>(null);
  const [pinned, setPinned] = useState<Toast | null>(null);
  const [isHeld, setIsHeld] = useState(false);
  const dialog = useTopDialogSlot();
  const visible = info ?? pinned;

  useEffect(() => {
    if (info === null || isHeld) return;
    const timer = window.setTimeout(() => { setInfo(null); }, TOAST_DURATION_MS);
    return () => { window.clearTimeout(timer); };
  }, [info, isHeld]);

  const show = useCallback<ShowToast>((toast) => {
    if (toast.pinned) setPinned(toast);
    else setInfo(toast);
  }, []);

  const dismiss = (): void => {
    setIsHeld(false);
    if (info !== null) setInfo(null);
    else setPinned(null);
  };

  const view = visible && <ToastView toast={visible} inDialog={dialog !== null} onDismiss={dismiss} onHold={setIsHeld} />;
  const value = useMemo(() => show, [show]);
  return (
    <ToastContext.Provider value={value}>
      {children}
      {/* The region is always there, so screen readers announce what appears in it. */}
      <div role="status" aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-0 z-[60] px-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
        {dialog === null && view}
      </div>
      {dialog !== null && view && createPortal(<div role="status" aria-live="polite">{view}</div>, dialog)}
    </ToastContext.Provider>
  );
}

/** Returns the function that shows a toast; throws outside {@link ToastProvider}. */
export function useToast(): ShowToast {
  const show = useContext(ToastContext);
  if (show === null) throw new Error("useToast must be used within ToastProvider");
  return show;
}
