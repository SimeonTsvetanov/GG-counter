// Banner under the header: the offline notice and the "Install GG Counter" offer (PWA install prompt).
import { useState } from "react";
import { Download } from "lucide-react";
import { useOnlineStatus } from "../hooks/use-online-status";
import { usePwaInstall } from "../hooks/use-pwa-install";
import { CONTAINER_CLASS } from "../lib/layout";
import { Button } from "./ui/button";

/** Shows the offline notice and/or the install offer; renders nothing when neither applies. */
export function StatusBanner(): React.JSX.Element | null {
  const isOnline = useOnlineStatus();
  const { canInstall, promptInstall, isInstalled } = usePwaInstall();
  const [installDismissed, setInstallDismissed] = useState(false);
  const showInstallBanner = canInstall && !isInstalled && !installDismissed;

  const handleInstallRequest = () => {
    void promptInstall().then((accepted) => {
      if (accepted) {
        setInstallDismissed(true);
      }
    });
  };

  if (isOnline && !showInstallBanner) {
    return null;
  }

  return (
    <div className={`${CONTAINER_CLASS} mt-3`}>
      <div className="rounded-lg bg-card p-4 text-card-foreground shadow-md">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-2 text-sm">
            {!isOnline && (
              <p className="font-medium text-destructive">
                You are offline. Changes are saved locally and will sync
                when you reconnect.
              </p>
            )}
            {showInstallBanner && (
              <p className="font-medium">
                Install GG Counter for quicker access and offline support.
              </p>
            )}
          </div>
          <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:flex-nowrap">
            {showInstallBanner && (
              <Button
                variant="secondary"
                size="sm"
                onClick={handleInstallRequest}
                className="w-full sm:w-auto"
              >
                <Download className="mr-2 h-4 w-4" /> Install app
              </Button>
            )}
            {showInstallBanner && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => { setInstallDismissed(true); }}
                className="w-full sm:w-auto"
              >
                Dismiss
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
