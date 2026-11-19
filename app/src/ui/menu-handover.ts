// Takes over from the stand-in button of app/src/ui/lazy-menu.tsx once a menu's chunk has loaded: focus
// moves to the real button, or the menu opens as the user asked (keyboard → first item focused, like
// Radix does for a keyboard open; it cannot know about a key pressed before it was loaded).
import { useEffect, useRef, useState, type RefObject } from "react";
import type { MenuIntent } from "./lazy-menu";

/** What {@link useMenuHandover} returns: the controlled open state and the menu content's focus handler. */
export interface MenuHandover {
  readonly open: boolean;
  readonly setOpen: (open: boolean) => void;
  /** For the menu content's `onFocus`: Radix focuses the content on open; a keyboard open moves on to the first item. */
  readonly onContentFocus: (event: React.FocusEvent<HTMLElement>) => void;
}

/**
 * Applies `initialIntent` once the real menu is mounted.
 *
 * @param initialIntent - what happened to the stand-in (null = nothing).
 * @param trigger - the real menu button.
 */
export function useMenuHandover(initialIntent: MenuIntent | null, trigger: RefObject<HTMLButtonElement | null>): MenuHandover {
  const [open, setOpen] = useState(initialIntent === "pointer" || initialIntent === "keyboard");
  const focusFirstItem = useRef(initialIntent === "keyboard");

  useEffect(() => {
    if (initialIntent === "focus") trigger.current?.focus();
  }, [initialIntent, trigger]);

  const onContentFocus = (event: React.FocusEvent<HTMLElement>): void => {
    if (!focusFirstItem.current || event.target !== event.currentTarget) return;
    focusFirstItem.current = false;
    event.currentTarget.querySelector<HTMLElement>('[role="menuitem"]:not([data-disabled]), [role="menuitemradio"]')?.focus();
  };

  return { open, setOpen, onContentFocus };
}
