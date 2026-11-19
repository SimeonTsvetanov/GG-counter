// Banner under the header: the offline notice and the "Install GG Counter" offer (PWA install prompt).
import { useState } from "react";
import { Download } from "lucide-react";
import { app } from "../config";
import { useOnlineStatus } from "../hooks/use-online-status";
import type { PwaInstall } from "../hooks/use-pwa-install";
import { t } from "../i18n";
import { CONTAINER_CLASS } from "../lib/layout";
import { Button } from "./ui/button";

/**
 * Shows the offline notice and/or the install offer; renders nothing when neither applies.
 *
 * @param install - the browser's install prompt, shared with Menu → Install app.
 */
export function StatusBanner({ install }: { install: PwaInstall }): React.JSX.Element | null {
  const isOnline = useOnlineStatus();
  const { canInstall, promptInstall, isInstalled } = install;
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
                {t("shell.status.offline")}
              </p>
            )}
            {showInstallBanner && (
              <p className="font-medium">
                {t("shell.status.installOffer", { name: app.name })}
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
                <Download className="mr-2 h-4 w-4" /> {t("shell.status.install")}
              </Button>
            )}
            {showInstallBanner && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => { setInstallDismissed(true); }}
                className="w-full sm:w-auto"
              >
                {t("shell.dismiss")}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
