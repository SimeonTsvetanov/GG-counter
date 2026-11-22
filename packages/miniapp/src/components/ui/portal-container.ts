// Where the vendored Radix overlays (dialog.tsx, alert-dialog.tsx; the page's dropdown-menu.tsx) portal
// their content. The host provider sets it (providers/host-provider.tsx, `Host.portalContainer`); without
// one, Radix uses `<body>`. Inside Quizzard it is an element in the mount element (PLAN §1.1 item 5).
import { createContext, useContext } from "react";

/** The overlay container of the subtree; `undefined` = Radix's default (`<body>`). */
export const PortalContainerContext = createContext<HTMLElement | undefined>(undefined);

/** Returns the element overlays of this subtree portal into. */
export function usePortalContainer(): HTMLElement | undefined {
  return useContext(PortalContainerContext);
}
