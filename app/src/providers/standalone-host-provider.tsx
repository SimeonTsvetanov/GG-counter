// The standalone page as the game screen's host (host.ts): builds the `Host` once from the page's own
// toasts, i18n, theme and share modules and provides it. main.tsx places it inside ToastProvider.
import { useState, type ReactNode } from "react";
import { createStandaloneHost } from "../host";
import { useToast } from "../ui/toast";
import { HostProvider } from "./host-provider";

/** Provides the standalone page's host to `children`; must sit inside ToastProvider. */
export function StandaloneHostProvider({ children }: { readonly children: ReactNode }): React.JSX.Element {
  const toast = useToast();
  // Once: the header slot element and the signals must keep their identity (useToast's function is stable).
  const [host] = useState(() => createStandaloneHost({ toast }));
  return <HostProvider host={host}>{children}</HostProvider>;
}
