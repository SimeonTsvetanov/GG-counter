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

/** Buttons that read as links, 44 px tall (target size, accessibility §1). */
const TEXT_BUTTON_CLASS = "min-h-11 text-primary underline-offset-4 hover:underline";

/** Wide screens show every section open (help-docs §3: tabs on desktop, accordion on phones). */
const WIDE_QUERY = "(min-width: 900px)";

/** One Help category. */
function Section({ id, title, isOpen, children }: { id: string; title: string; isOpen: boolean; children: ReactNode }): React.JSX.Element {
  return (
    <details id={`help-${id}`} open={isOpen} className="group rounded-lg bg-muted/50 px-3 py-2">
      <summary className="min-h-11 cursor-pointer content-center font-medium">{title}</summary>
      <div className="space-y-2 pb-2 pt-1 text-sm text-muted-foreground">{children}</div>
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
      <div ref={body} className="space-y-2">
        <Section id="about" title={t("shell.help.whatItDoes")} isOpen={isOpen("about", true)}>
          <p>{text.answer}</p>
        </Section>
        <Section id="start" title={t("shell.help.quickStart")} isOpen={isOpen("start")}>
          <ol className="list-decimal space-y-1 pl-5">{text.steps.map((step) => <li key={step}>{step}</li>)}</ol>
        </Section>
        <Section id="features" title={t("shell.help.features")} isOpen={isOpen("features")}>
          <ul className="list-disc space-y-1 pl-5">{text.features.map((feature) => <li key={feature}>{feature}</li>)}</ul>
        </Section>
        <Section id="install" title={t("shell.help.install")} isOpen={isOpen("install")}>
          <ul className="list-disc space-y-1 pl-5">
            <li>{t("shell.help.installAndroid")}</li>
            <li>{t("shell.help.installIOS")}</li>
            <li>{t("shell.help.installDesktop")}</li>
          </ul>
        </Section>
        <Section id="privacy" title={t("shell.help.privacy")} isOpen={isOpen("privacy")}>
          <p>{t("shell.help.privacyText", { name: app.name })}</p>
          <p>{t("shell.help.privacyData")}</p>
          <button type="button" className={TEXT_BUTTON_CLASS} onClick={() => { openDialog("privacy"); }}>{t("shell.help.privacyLink")}</button>
        </Section>
        <Section id="limits" title={t("shell.help.limits")} isOpen={isOpen("limits")}>
          <ul className="list-disc space-y-1 pl-5">
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
              <p className="font-medium text-foreground">{item.q}</p>
              <p>{item.a}</p>
            </div>
          ))}
        </Section>
        <Section id="contact" title={t("shell.help.contact")} isOpen={isOpen("contact")}>
          <p className="flex flex-wrap gap-x-4 gap-y-2">
            <button type="button" className={TEXT_BUTTON_CLASS} onClick={() => { openDialog("report"); }}>
              {t("shell.menu.items.report")}
            </button>
            <button type="button" className={TEXT_BUTTON_CLASS} onClick={() => { openDialog("support"); }}>
              {t("shell.help.contactLink")}
            </button>
            <a className="inline-flex min-h-11 items-center text-primary underline-offset-4 hover:underline" href={app.shell.buyMeACoffee} target="_blank" rel="noopener noreferrer">
              {t("shell.menu.items.support")}
            </a>
          </p>
        </Section>
      </div>
    </ShellDialog>
  );
}
