// The frame every shell dialog shares (app-shell §10): title, scrolling body, a Close button, Escape
// closes, focus is trapped inside and returns to the button that opened it (accessibility §4). The
// first focus goes to the title, as for every long sheet, so reading starts at the top.
import { useRef, type ReactNode } from "react";
import { Button } from "../components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../components/ui/dialog";
import { t } from "../i18n";
import { cn } from "../lib/utils";

/** Props of {@link ShellDialog}. */
export interface ShellDialogProps {
  readonly title: string;
  /** One sentence under the title (also the dialog's accessible description); omit for none. */
  readonly description?: string;
  /** Called when the dialog closes (Close, Escape, outside click). */
  readonly onClose: () => void;
  /** Gets the focus back on close; null = the menu button. */
  readonly opener: HTMLElement | null;
  readonly children: ReactNode;
  /** Extra buttons before Close. */
  readonly actions?: ReactNode;
  readonly className?: string;
}

/** Returns the element that gets the focus back when a shell dialog closes. */
function returnTarget(opener: HTMLElement | null): HTMLElement | null {
  if (opener?.isConnected) return opener;
  // because a menu item that opened the dialog is gone by now: the menu button is the logical place
  return document.querySelector<HTMLElement>("[data-menu-open]");
}

/** Renders an open shell dialog. */
export function ShellDialog({ title, description, onClose, opener, children, actions, className }: ShellDialogProps): React.JSX.Element {
  const heading = useRef<HTMLHeadingElement>(null);
  return (
    <Dialog open onOpenChange={(isOpen) => { if (!isOpen) onClose(); }}>
      <DialogContent
        className={cn("max-h-[90dvh] max-w-lg overflow-y-auto", className)}
        onOpenAutoFocus={(event) => {
          event.preventDefault();
          heading.current?.focus();
        }}
        onCloseAutoFocus={(event) => {
          event.preventDefault();
          returnTarget(opener)?.focus();
        }}
        {...(description === undefined ? { "aria-describedby": undefined } : {})}
      >
        <DialogHeader>
          {/* Focused by script only (tabIndex -1, never a tab stop), so it needs no focus ring. */}
          <DialogTitle ref={heading} tabIndex={-1} className="focus-visible:outline-none">{title}</DialogTitle>
          {description !== undefined && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        {children}
        <DialogFooter className="gap-2">
          {actions}
          <DialogClose asChild>
            <Button variant="secondary">{t("shell.close")}</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
