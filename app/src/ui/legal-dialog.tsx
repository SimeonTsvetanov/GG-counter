// A policy page as a dialog (app-shell → legal-pages §1, PLAN T-10): Terms, Privacy, AI notice, Legal
// notice or Support, from the same content/legal data as the standalone pages (__LEGAL__, scripts/legal.ts),
// so both always say the same. The text is English in every UI language (i18n §4) and carries lang="en"
// there; the title, date line and buttons are translated. Lazy chunk: costs nothing at first load.
// Links look like every link (base.css: accent + semibold, no underline — the weight is the WCAG 1.4.1
// cue; PLAN T-12 replaced the T-10 underline, DECISIONS 2026-11-19).
import { Button } from "../components/ui/button";
import { app } from "../config";
import { getLanguage, t } from "../i18n";
import type { LegalBlock, LegalInline, PolicyPageId } from "./legal-document";
import { isPlainClick, legalLinkTarget, policyPageHref } from "./legal-links";
import { ShellDialog } from "./shell-dialog";
import type { ShellDialogId } from "./use-shell-dialog";

/** Props of {@link LegalDialog}. */
export interface LegalDialogProps {
  readonly page: PolicyPageId;
  readonly onClose: () => void;
  readonly opener: HTMLElement | null;
  /** Opens another dialog from a link in the text (another policy page, Help, Report a problem). */
  readonly openDialog: (id: ShellDialogId) => void;
}

/** Returns an ISO date (YYYY-MM-DD) in the UI language's long style. */
function formatDate(isoDate: string): string {
  return new Intl.DateTimeFormat(getLanguage(), { dateStyle: "long", timeZone: "UTC" }).format(new Date(`${isoDate}T00:00:00Z`));
}

/** One link of the text: opens a dialog in place, or goes to its address. */
function LegalLink({ text, href, openDialog }: { text: string; href: string; openDialog: LegalDialogProps["openDialog"] }): React.JSX.Element {
  const target = legalLinkTarget(href, app.basePath);
  if (target.kind === "new-tab") return <a href={target.href} target="_blank" rel="noopener noreferrer">{text}</a>;
  if (target.kind === "same-tab") return <a href={target.href}>{text}</a>;
  const onClick = (event: React.MouseEvent): void => {
    if (!isPlainClick(event)) return;
    event.preventDefault();
    openDialog(target.dialog);
  };
  return <a href={href} onClick={onClick}>{text}</a>;
}

/** Renders the runs of a paragraph, heading or list item. */
function Inlines({ inlines, openDialog }: { inlines: readonly LegalInline[]; openDialog: LegalDialogProps["openDialog"] }): React.JSX.Element {
  return (
    <>
      {inlines.map((inline, index) => {
        // because runs have no id of their own and the list never reorders, the position is a stable key
        const key = String(index);
        switch (inline.kind) {
          case "text":
            return <span key={key}>{inline.text}</span>;
          case "strong":
            return <strong key={key}>{inline.text}</strong>;
          case "code":
            return <code key={key}>{inline.text}</code>;
          case "link":
            return <LegalLink key={key} text={inline.text} href={inline.href} openDialog={openDialog} />;
          case "email":
            return <a key={key} href={`mailto:${app.contact.email}`}>{app.contact.email}</a>;
          default:
            return inline satisfies never;
        }
      })}
    </>
  );
}

/** Renders one block of a policy page. */
function Block({ block, openDialog }: { block: LegalBlock; openDialog: LegalDialogProps["openDialog"] }): React.JSX.Element {
  switch (block.kind) {
    case "heading":
      return <h3><Inlines inlines={block.inlines} openDialog={openDialog} /></h3>;
    case "paragraph":
      return <p><Inlines inlines={block.inlines} openDialog={openDialog} /></p>;
    case "list": {
      const items = block.items.map((item, index) => <li key={String(index)}><Inlines inlines={item} openDialog={openDialog} /></li>);
      return block.isOrdered ? <ol>{items}</ol> : <ul>{items}</ul>;
    }
    default:
      return block satisfies never;
  }
}

/** Renders the open policy dialog of `page`. */
export function LegalDialog({ page, onClose, opener, openDialog }: LegalDialogProps): React.JSX.Element {
  const doc = __LEGAL__.find((candidate) => candidate.id === page);
  // because scripts/legal.ts builds __LEGAL__ from every POLICY_PAGES id or fails the build
  if (doc === undefined) throw new Error(`No policy text for "${page}" in this build`);
  const actions = (
    <Button asChild variant="secondary">
      <a href={policyPageHref(page)}>{t("shell.legal.openPage")}</a>
    </Button>
  );
  return (
    <ShellDialog title={t(`shell.legal.titles.${page}`)} description={t("shell.legal.updated", { date: formatDate(doc.updated) })} onClose={onClose} opener={opener} actions={actions}>
      <div lang={getLanguage() === "en" ? undefined : "en"} className="prose">
        {doc.blocks.map((block, index) => <Block key={String(index)} block={block} openDialog={openDialog} />)}
      </div>
    </ShellDialog>
  );
}
