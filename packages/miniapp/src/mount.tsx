// `mount` of the Scores mini-app (contract `MiniAppModule`, Quizzard PLAN §1.5): runs the storage
// migration, starts the screen's own i18next instance in the host's language, places the screen for the
// host (placement.ts) and renders it into its own React root. The returned unmount takes away everything
// it added: the React root (and with it every effect's listener, observer and timer), the language and
// theme subscriptions, the i18next instance and the elements placement.ts created.
import { StrictMode } from "react";
import { createRoot, type RootOptions } from "react-dom/client";
import type { MiniAppContext, MiniAppModule, Unmount } from "./contract.ts";
import { createHost } from "./host.ts";
import { standaloneOptions } from "./host-api.ts";
import { screenLanguage, startTexts, type ScreenTexts } from "./i18n";
import type { PlaceScreen } from "./placement.ts";
import { HostProvider } from "./providers/host-provider";
import { ScoresScreen } from "./screen";
import { migrateLegacyStorage } from "./storage/migrate";
import { parseAttribution, setAttribution } from "./share/attribution";

/** Root options: a render error goes to the standalone page's error screen when it asked for it. */
function rootOptions(onCrash: ((error: unknown) => void) | undefined): RootOptions {
  return onCrash === undefined ? {} : { onUncaughtError: (error) => { onCrash(error); } };
}

/** Renders the screen into `element` now; the texts are already in the host's language. */
function render(element: HTMLElement, context: MiniAppContext, texts: ScreenTexts, place: PlaceScreen): Unmount {
  const placement = place(element, context);
  setAttribution(parseAttribution(context.query)); // a host (Quizzard) names itself in shared text
  const options = standaloneOptions(element);
  const stopLanguage = context.language.subscribe((lang) => { void texts.setLanguage(lang); });
  const host = createHost(context, { language: screenLanguage, portalContainer: placement.overlays, root: placement.root });
  const root = createRoot(placement.screen, rootOptions(options.onCrash));
  root.render(
    <StrictMode>
      <HostProvider host={host}>
        <ScoresScreen screen={placement.screen} element={element} options={options} />
      </HostProvider>
    </StrictMode>
  );
  return () => {
    setAttribution(null);
    root.unmount();
    stopLanguage();
    placement.remove();
    texts.stop();
  };
}

/**
 * Returns the screen's `mount` (contract `MiniAppModule.mount`) with a placement: the package entry
 * (index.ts) decides per host, the standalone page's entry (module.ts) places on the page only, so its
 * first load carries no Quizzard placement.
 * @remarks The returned mount gives back the unmount at once when the host's language is loaded
 * (English, or a dictionary loaded before — the standalone site loads it with its own), else a promise
 * that settles once it is, so the first frame is never English for a Bulgarian user.
 */
export function createMount(place: PlaceScreen): MiniAppModule["mount"] {
  return (element, context) => {
    // Before the first render, so the game is read from the namespaced keys (PLAN T-07); idempotent.
    migrateLegacyStorage();
    const texts = startTexts();
    const loading = texts.setLanguage(context.language.get());
    if (loading === null) return render(element, context, texts, place);
    return loading.then(() => render(element, context, texts, place));
  };
}
