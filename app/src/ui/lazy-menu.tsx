// The header's menus load after the first paint (PLAN T-12, performance §1): Radix DropdownMenu with
// floating-ui is ~13 KB gzip that the first screen does not need. Until the chunk arrives, a plain button
// with the same look stands in; what the user did with it (focus, or open by mouse or keyboard) is handed
// to the real menu, so nothing is lost when someone is quicker than the network.
import { useState, type ReactNode } from "react";
import { Button, type ButtonProps } from "gg-counter-miniapp/components/ui/button";

/** What happened to the stand-in button before the menu code arrived. */
export type MenuIntent = "focus" | "pointer" | "keyboard";

/** Props every lazily loaded header menu takes. */
export interface LazyMenuProps {
  /** Hands over the stand-in button's state: focus it, or open the menu as the user asked; null = nothing. */
  readonly initialIntent: MenuIntent | null;
}

/** Keys that open a menu from its button (as Radix's trigger does). */
const OPEN_KEYS = new Set(["Enter", " ", "ArrowDown"]);

/**
 * Returns the latest intent and the handlers that record it on the stand-in button.
 *
 * @remarks Like Radix's trigger, a menu opens on pointer-down and key-down, not on click: React may swap
 * the stand-in for the real menu between pointer-down and click (it holds a loaded Suspense boundary
 * back briefly), and the click is then lost. Pointer-down keeps the focus off the stand-in, so a focus
 * hand-over cannot race the open.
 */
export function useMenuIntent(): { intent: MenuIntent | null; handlers: Pick<ButtonProps, "onFocus" | "onBlur" | "onPointerDown" | "onKeyDown" | "onClick"> } {
  const [intent, setIntent] = useState<MenuIntent | null>(null);
  return {
    intent,
    handlers: {
      onFocus: () => { setIntent((current) => current ?? "focus"); },
      onBlur: () => { setIntent((current) => (current === "focus" ? null : current)); },
      onPointerDown: (event) => {
        if (event.button !== 0 || event.ctrlKey) return;
        event.preventDefault();
        setIntent("pointer");
      },
      onKeyDown: (event) => {
        if (!OPEN_KEYS.has(event.key)) return;
        event.preventDefault();
        setIntent("keyboard");
      },
      // Assistive technology may click without pointer or key events; detail 0 = not a mouse click.
      onClick: (event) => { setIntent(event.detail === 0 ? "keyboard" : "pointer"); },
    },
  };
}

/** Props of {@link MenuStandIn}. */
interface MenuStandInProps extends Omit<ButtonProps, "children"> {
  readonly icon: ReactNode;
}

/** The menu button shown until the menu code is loaded: same look, same name, `aria-haspopup`. */
export function MenuStandIn({ icon, ...props }: MenuStandInProps): React.JSX.Element {
  return (
    <Button size="icon" aria-haspopup="menu" aria-expanded={false} {...props}>
      {icon}
    </Button>
  );
}
