// The app menu (app-shell §3): a button in the header that opens the groups of app.config.ts
// `shell.menu`. Radix DropdownMenu gives arrow keys, typeahead, Escape, outside click and focus return.
// Loaded after the first paint (header-menus.tsx, PLAN T-12); a stand-in button takes its place until then.
import { useLayoutEffect, useRef, useState } from "react";
import { Menu } from "lucide-react";
import { Button } from "../components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "../components/ui/dropdown-menu";
import { app, type ShellItemId } from "../config";
import { t } from "../i18n";
import type { LazyMenuProps } from "./lazy-menu";
import { useMenuHandover } from "./menu-handover";
import { SHELL_ITEMS, shellItemLabel, type RunShellItem } from "./shell-items";

/** Props of {@link AppMenu}. */
export interface AppMenuProps {
  readonly runItem: RunShellItem;
  readonly isInstalled: boolean;
  /** Whether the browser offers its install prompt (else Install app opens Help → Install). */
  readonly canInstall: boolean;
  /** Button style, matching the header layout. */
  readonly variant: "ghost" | "outline";
}

/** One menu entry: a link for external pages, otherwise an item that runs the entry. */
function MenuEntry({ id, runItem, isInstalled, opensDialog, trigger, onOpensDialog }: { id: ShellItemId; runItem: RunShellItem; isInstalled: boolean; opensDialog: boolean; trigger: React.RefObject<HTMLButtonElement | null>; onOpensDialog: () => void }): React.JSX.Element {
  const target = SHELL_ITEMS[id];
  const label = shellItemLabel(id, isInstalled);
  if (target.kind === "link") {
    return (
      <DropdownMenuItem asChild>
        <a href={target.href} target="_blank" rel="noopener noreferrer">{label}</a>
      </DropdownMenuItem>
    );
  }
  const isDone = id === "install" && isInstalled;
  return (
    <DropdownMenuItem
      disabled={isDone}
      data-action={id}
      onSelect={() => {
        if (opensDialog) onOpensDialog();
        runItem(id, trigger.current);
      }}
    >
      {label}
    </DropdownMenuItem>
  );
}

/**
 * Makes the page under the open menu inert. Radix hides it with aria-hidden but leaves it focusable
 * (axe aria-hidden-focus); the menu itself is portaled outside #root, so it stays usable. Removed before
 * the menu returns focus to its button.
 */
function makePageInert(isOpen: boolean): void {
  document.getElementById("root")?.toggleAttribute("inert", isOpen);
}

/**
 * Enter activates the item that has the focus after Radix's pending focus move. Radix moves focus for
 * arrow keys and typeahead in a `setTimeout`, but clicks the item under Enter at once; browsers run
 * input before timers, so a quick ArrowDown + Enter opened the previous item (Help instead of
 * Settings). Cancelling Radix's click (it skips handlers after preventDefault) and clicking in a timer
 * queued after Radix's one picks the right item.
 */
function activateFocusedItemOnEnter(event: React.KeyboardEvent<HTMLDivElement>): void {
  if (event.key !== "Enter" || event.defaultPrevented) return;
  event.preventDefault();
  const menu = event.currentTarget;
  window.setTimeout(() => {
    const item = document.activeElement;
    if (item instanceof HTMLElement && menu.contains(item) && item.getAttribute("role") === "menuitem") item.click();
  });
}

/** Renders the menu button and its grouped entries. */
export function AppMenu({ runItem, isInstalled, canInstall, variant, initialIntent }: AppMenuProps & LazyMenuProps): React.JSX.Element {
  const trigger = useRef<HTMLButtonElement>(null);
  const { open, setOpen, onContentFocus } = useMenuHandover(initialIntent, trigger);
  // A menu opened from the stand-in is open on mount: make the page inert then too (no onOpenChange).
  const [isOpenOnMount] = useState(open);
  useLayoutEffect(() => {
    if (isOpenOnMount) makePageInert(true);
  }, [isOpenOnMount]);
  // True while an entry opens a dialog: the menu must not move focus back to its button then, because
  // focus leaving the new dialog would close it at once; the dialog returns focus there when it closes.
  const isOpeningDialog = useRef(false);
  return (
    <DropdownMenu
      open={open}
      onOpenChange={(isOpen) => {
        makePageInert(isOpen);
        setOpen(isOpen);
      }}
    >
      <DropdownMenuTrigger asChild>
        <Button ref={trigger} variant={variant} size="icon" aria-label={t("shell.menu.open")} data-menu-open="">
          <Menu aria-hidden />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        sideOffset={8}
        collisionPadding={16}
        onKeyDownCapture={activateFocusedItemOnEnter}
        onFocus={onContentFocus}
        onCloseAutoFocus={(event) => {
          if (isOpeningDialog.current) event.preventDefault();
          isOpeningDialog.current = false;
        }}
      >
        {app.shell.menu.map((group, index) => (
          <DropdownMenuGroup key={group.id} aria-labelledby={`menu-group-${group.id}`}>
            {index > 0 && <DropdownMenuSeparator />}
            <DropdownMenuLabel id={`menu-group-${group.id}`}>
              {t(`shell.menu.${group.id}`)}
            </DropdownMenuLabel>
            {group.items.map((id) => (
              <MenuEntry
                key={id}
                id={id}
                runItem={runItem}
                isInstalled={isInstalled}
                opensDialog={SHELL_ITEMS[id].kind === "dialog" || (id === "install" && !canInstall)}
                trigger={trigger}
                onOpensDialog={() => { isOpeningDialog.current = true; }}
              />
            ))}
          </DropdownMenuGroup>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
