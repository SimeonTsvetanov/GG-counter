// The footer (app-shell §7): the links of app.config.ts `shell.footer` — the policy pages (PLAN T-10)
// and the support line —, the version (opens What's new), "More free tools" and the copyright with the
// current year read at run time — never a year written into the code (app-shell rule 3).
import type { ShellItemId } from "../config";
import { app } from "../config";
import { t } from "../i18n";
import { CONTAINER_CLASS } from "../lib/layout";
import { isPolicyPage } from "./legal-document";
import { isPlainClick, policyPageHref } from "./legal-links";
import { SHELL_ITEMS, shellItemLabel, type RunShellItem } from "./shell-items";

/** Props of {@link AppFooter}. */
export interface AppFooterProps {
  readonly runItem: RunShellItem;
}

const LINK_CLASS = "inline-flex min-h-6 items-center hover:text-foreground transition-colors";

/** Returns the footer label of an entry: the support entry keeps Moni's own line. */
function footerLabel(id: ShellItemId): string {
  return id === "support" ? t("app.footer.support") : shellItemLabel(id, false);
}

/**
 * One footer entry: a link for external pages; a policy page is a real link to its standalone page
 * (new tab, copy link, no JavaScript) that a plain click opens as a dialog; otherwise a link-styled button.
 */
function FooterEntry({ id, runItem }: { id: ShellItemId; runItem: RunShellItem }): React.JSX.Element {
  const target = SHELL_ITEMS[id];
  if (target.kind === "link") {
    return <a className={LINK_CLASS} href={target.href} target="_blank" rel="noopener noreferrer">{footerLabel(id)}</a>;
  }
  if (target.kind === "dialog" && isPolicyPage(target.dialog)) {
    const onClick = (event: React.MouseEvent<HTMLAnchorElement>): void => {
      if (!isPlainClick(event)) return;
      event.preventDefault();
      runItem(id, event.currentTarget);
    };
    return <a className={LINK_CLASS} href={policyPageHref(target.dialog)} onClick={onClick}>{footerLabel(id)}</a>;
  }
  return <button type="button" className={LINK_CLASS} onClick={(event) => { runItem(id, event.currentTarget); }}>{footerLabel(id)}</button>;
}

/** Renders the page footer. */
export function AppFooter({ runItem }: AppFooterProps): React.JSX.Element {
  return (
    <footer className="mt-auto border-t bg-background/80">
      <div className={`${CONTAINER_CLASS} flex flex-col items-center gap-2 px-4 py-4 text-center text-xs text-muted-foreground`}>
        <nav aria-label={t("shell.footer")} className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
          {app.shell.footer.map((id) => <FooterEntry key={id} id={id} runItem={runItem} />)}
        </nav>
        <p className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
          <button type="button" className={LINK_CLASS} onClick={(event) => { runItem("whats-new", event.currentTarget); }}>
            {t("shell.version", { version: app.version })}
          </button>
          <a className={LINK_CLASS} href={app.shell.moreTools} target="_blank" rel="noopener noreferrer">{t("shell.moreTools")}</a>
          <span>{t("shell.rights", { year: new Date().getFullYear(), author: app.author.name })}</span>
        </p>
      </div>
    </footer>
  );
}
