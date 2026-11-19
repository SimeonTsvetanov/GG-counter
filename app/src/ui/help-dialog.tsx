// Help (app-shell → help-docs §1): only the categories that apply to GG Counter — what it does, quick
// start, features, install, privacy (→ the Privacy page), limits, FAQ, contact (→ Report, Support page).
// Texts come from app.config.ts (in the UI language, PLAN T-09) and the dictionary, and are precached,
// so Help works offline. Sections are <details>; all open on wide screens.
import { useEffect, useRef, type ReactNode } from "react";
import { MAX_NAME_LENGTH, MAX_PLAYERS, MAX_SCORE, MIN_SCORE } from "gg-counter-core";
import { app } from "../config";
import { appText, formatNumber, t } from "../i18n";
import { ShellDialog } from "./shell-dialog";
import type { ShellDialogId } from "./use-shell-dialog";

/** Props of {@link HelpDialog}. */
export interface HelpDialogProps {
  readonly onClose: () => void;
  readonly opener: HTMLElement | null;
  /** Section id to open and scroll to (e.g. "install" from Menu → Install app). */
  readonly section?: string;
  /** Opens another shell dialog (Report a problem and Support from Contact & support, Privacy). */
  readonly openDialog: (id: ShellDialogId) => void;
}

/** Wide screens show every section open (help-docs §3: tabs on desktop, accordion on phones). */
const WIDE_QUERY = "(min-width: 900px)";

/** One Help category. */
function Section({ id, title, isOpen, children }: { id: string; title: string; isOpen: boolean; children: ReactNode }): React.JSX.Element {
  return (
    <details id={`help-${id}`} open={isOpen}>
      <summary>{title}</summary>
      <div className="prose">{children}</div>
    </details>
  );
}

/** Renders the open Help dialog. */
export function HelpDialog({ onClose, opener, section, openDialog }: HelpDialogProps): React.JSX.Element {
  const body = useRef<HTMLDivElement>(null);
  const isWide = window.matchMedia(WIDE_QUERY).matches;
  const isOpen = (id: string, first = false): boolean => isWide || id === section || (section === undefined && first);
  const text = appText();

  useEffect(() => {
    if (section !== undefined) body.current?.querySelector(`#help-${section}`)?.scrollIntoView({ block: "start" });
  }, [section]);

  return (
    <ShellDialog title={t("shell.help.title")} onClose={onClose} opener={opener}>
      <div ref={body} className="disclosures">
        <Section id="about" title={t("shell.help.whatItDoes")} isOpen={isOpen("about", true)}>
          <p>{text.answer}</p>
        </Section>
        <Section id="start" title={t("shell.help.quickStart")} isOpen={isOpen("start")}>
          <ol>{text.steps.map((step) => <li key={step}>{step}</li>)}</ol>
        </Section>
        <Section id="features" title={t("shell.help.features")} isOpen={isOpen("features")}>
          <ul>{text.features.map((feature) => <li key={feature}>{feature}</li>)}</ul>
        </Section>
        <Section id="install" title={t("shell.help.install")} isOpen={isOpen("install")}>
          <ul>
            <li>{t("shell.help.installAndroid")}</li>
            <li>{t("shell.help.installIOS")}</li>
            <li>{t("shell.help.installDesktop")}</li>
          </ul>
        </Section>
        <Section id="privacy" title={t("shell.help.privacy")} isOpen={isOpen("privacy")}>
          <p>{t("shell.help.privacyText", { name: app.name })}</p>
          <p>{t("shell.help.privacyData")}</p>
          <button type="button" className="text-button" onClick={() => { openDialog("privacy"); }}>{t("shell.help.privacyLink")}</button>
        </Section>
        <Section id="limits" title={t("shell.help.limits")} isOpen={isOpen("limits")}>
          <ul>
            <li>{t("shell.help.limitPlayers", { max: MAX_PLAYERS })}</li>
            <li>{t("shell.help.limitName", { max: MAX_NAME_LENGTH })}</li>
            <li>{t("shell.help.limitScore", { min: formatNumber(MIN_SCORE), max: formatNumber(MAX_SCORE) })}</li>
            <li>{t("shell.help.offline")}</li>
            <li>{t("shell.help.problem")}</li>
          </ul>
        </Section>
        <Section id="faq" title={t("shell.help.faq")} isOpen={isOpen("faq")}>
          {text.faq.map((item) => (
            <div key={item.q}>
              <p><strong>{item.q}</strong></p>
              <p>{item.a}</p>
            </div>
          ))}
        </Section>
        <Section id="contact" title={t("shell.help.contact")} isOpen={isOpen("contact")}>
          <p className="link-row">
            <button type="button" className="text-button" onClick={() => { openDialog("report"); }}>
              {t("shell.menu.items.report")}
            </button>
            <button type="button" className="text-button" onClick={() => { openDialog("support"); }}>
              {t("shell.help.contactLink")}
            </button>
            <a className="text-button" href={app.shell.buyMeACoffee} target="_blank" rel="noopener noreferrer">
              {t("shell.menu.items.support")}
            </a>
          </p>
        </Section>
      </div>
    </ShellDialog>
  );
}
