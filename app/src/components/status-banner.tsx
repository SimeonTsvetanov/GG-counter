// Banner under the header: the offline notice and the "Install GG Counter" offer (PWA install prompt).
import { useState } from "react";
import { Download } from "lucide-react";
import { app } from "../config";
import { useOnlineStatus } from "../hooks/use-online-status";
import type { PwaInstall } from "../hooks/use-pwa-install";
import { t } from "../i18n";
import { CONTAINER_CLASS } from "gg-counter-miniapp/lib/layout";
import { Button } from "gg-counter-miniapp/components/ui/button";

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
    <div className={`${CONTAINER_CLASS} pt-3`}>
      <div className="card narrow-column flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-2 text-md">
          {/* Not colour alone: the words say "offline" (WCAG 1.4.1); warning text passes on a card. */}
          {!isOnline && (
            <p className="font-semibold text-warning-text">
              {t("shell.status.offline")}
            </p>
          )}
          {showInstallBanner && (
            <p className="font-semibold">
              {t("shell.status.installOffer", { name: app.name })}
            </p>
          )}
        </div>
        {showInstallBanner && (
          <div className="button-stack sm:shrink-0">
            <Button variant="secondary" onClick={handleInstallRequest}>
              <Download aria-hidden /> {t("shell.status.install")}
            </Button>
            <Button variant="ghost" onClick={() => { setInstallDismissed(true); }}>
              {t("shell.dismiss")}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
