import { useCallback, useEffect, useState } from "react";

type BeforeInstallPromptEvent = Event & {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
  prompt: () => Promise<void>;
};

/** What {@link usePwaInstall} returns. */
export interface PwaInstall {
  /** True while the browser offers an install prompt. */
  canInstall: boolean;
  isInstalled: boolean;
  /** Shows the browser's install prompt; resolves to true when the user accepted. */
  promptInstall: () => Promise<boolean>;
  dismiss: () => void;
}

/** Captures the browser's install prompt (`beforeinstallprompt`) so the app can offer it later. */
export function usePwaInstall(): PwaInstall {
  const [promptEvent, setPromptEvent] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setPromptEvent(event as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setPromptEvent(null);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt
      );
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const promptInstall = useCallback(async () => {
    if (!promptEvent) {
      return false;
    }

    try {
      await promptEvent.prompt();
      const choice = await promptEvent.userChoice;
      setPromptEvent(null);
      return choice.outcome === "accepted";
    } catch (error) {
      console.error("Unable to show install prompt", error);
      return false;
    }
  }, [promptEvent]);

  const dismiss = useCallback(() => {
    setPromptEvent(null);
  }, []);

  return {
    canInstall: !!promptEvent,
    isInstalled,
    promptInstall,
    dismiss,
  };
}
