// The app menu (app-shell §3): a button in the header that opens the groups of app.config.ts
// `shell.menu`. Radix DropdownMenu gives arrow keys, typeahead, Escape, outside click and focus return.
import { useRef } from "react";
import { Menu } from "lucide-react";
import { Button } from "../components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "../components/ui/dropdown-menu";
import { app, type ShellItemId } from "../config";
import { t } from "../i18n";
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

/** Items ≥ 44 px on touch screens, a little tighter with a mouse (ui-patterns §5). */
const ITEM_CLASS = "min-h-11 cursor-pointer px-3 text-base [@media(pointer:fine)]:min-h-9 [@media(pointer:fine)]:text-sm focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring";

/** One menu entry: a link for external pages, otherwise an item that runs the entry. */
function MenuEntry({ id, runItem, isInstalled, opensDialog, trigger, onOpensDialog }: { id: ShellItemId; runItem: RunShellItem; isInstalled: boolean; opensDialog: boolean; trigger: React.RefObject<HTMLButtonElement | null>; onOpensDialog: () => void }): React.JSX.Element {
  const target = SHELL_ITEMS[id];
  const label = shellItemLabel(id, isInstalled);
  if (target.kind === "link") {
    return (
      <DropdownMenuItem asChild className={ITEM_CLASS}>
        <a href={target.href} target="_blank" rel="noopener noreferrer">{label}</a>
      </DropdownMenuItem>
    );
  }
  const isDone = id === "install" && isInstalled;
  return (
    <DropdownMenuItem
      className={ITEM_CLASS}
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

/** Renders the menu button and its grouped entries. */
export function AppMenu({ runItem, isInstalled, canInstall, variant }: AppMenuProps): React.JSX.Element {
  const trigger = useRef<HTMLButtonElement>(null);
  // True while an entry opens a dialog: the menu must not move focus back to its button then, because
  // focus leaving the new dialog would close it at once; the dialog returns focus there when it closes.
  const isOpeningDialog = useRef(false);
  return (
    <DropdownMenu onOpenChange={makePageInert}>
      <DropdownMenuTrigger asChild>
        <Button ref={trigger} variant={variant} size="icon" aria-label={t("shell.menu.open")} data-menu-open="" className="shrink-0">
          <Menu className="h-5 w-5" aria-hidden />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        sideOffset={8}
        collisionPadding={16}
        className="max-h-[calc(100dvh-5rem)] w-64 overflow-y-auto"
        onCloseAutoFocus={(event) => {
          if (isOpeningDialog.current) event.preventDefault();
          isOpeningDialog.current = false;
        }}
      >
        {app.shell.menu.map((group, index) => (
          <DropdownMenuGroup key={group.id} aria-labelledby={`menu-group-${group.id}`}>
            {index > 0 && <DropdownMenuSeparator />}
            <DropdownMenuLabel id={`menu-group-${group.id}`} className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
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
