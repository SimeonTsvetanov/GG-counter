// React side of the host seam (host.ts): mount.tsx puts the `Host` here once, and the game screen reads
// language, toasts, sharing, its header slot and its root through these hooks only — never through the
// page's own i18n, toast or theme modules (Quizzard PLAN §1.5).
import { createContext, useContext, useSyncExternalStore, type ReactNode } from "react";
import { PortalContainerContext } from "../components/ui/portal-container";
import type { Lang } from "../contract.ts";
import type { Host } from "../host";

const HostContext = createContext<Host | null>(null);

/** Props of {@link HostProvider}. */
interface HostProviderProps {
  /** Must keep its identity for the provider's lifetime (signals are subscribed to once). */
  readonly host: Host;
  readonly children: ReactNode;
}

/** Gives `host` to the subtree; Radix overlays inside it portal into `host.portalContainer`. */
export function HostProvider({ host, children }: HostProviderProps): React.JSX.Element {
  return (
    <HostContext.Provider value={host}>
      <PortalContainerContext.Provider value={host.portalContainer}>{children}</PortalContainerContext.Provider>
    </HostContext.Provider>
  );
}

/** Returns the host; throws outside {@link HostProvider}. */
export function useHost(): Host {
  const host = useContext(HostContext);
  if (host === null) throw new Error("useHost must be used within HostProvider");
  return host;
}

/**
 * Returns the host's UI language and re-renders the caller when it changes, so every `t()` it renders
 * follows a switch without a reload.
 */
export function useHostLanguage(): Lang {
  const { language } = useHost();
  // The same snapshot off the client too (the provider's unit test renders to a string).
  return useSyncExternalStore(language.subscribe, language.get, language.get);
}
