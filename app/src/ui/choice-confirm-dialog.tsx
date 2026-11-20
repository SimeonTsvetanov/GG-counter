// The confirmation with a choice (SPEC 1.1 F13, F14; DECISIONS 2026-11-20): one alert asks what to delete —
// a radio list of options (the default checked again every time the alert opens), then Cancel and the red
// confirm button whose label names the chosen result. Used by Clear session and each player's delete button.
import { useId, useRef, useState } from "react";
import { Circle, CircleCheck } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "../components/ui/alert-dialog";
import { t } from "../i18n";

/** One answer to "what to delete?". */
export interface ChoiceOption<V extends string> {
  readonly value: V;
  /** Short noun phrase ("Players and scores"). */
  readonly label: string;
  /** One sentence on the result ("Everyone stays with 0 points."). */
  readonly hint: string;
  /** The confirm button's label while this option is chosen: one short verb naming the result ("Clear", "Reset" — ui-patterns §4). */
  readonly confirm: string;
}

/** What the alert shows and does; the first option is the default. */
interface ChoiceContent<V extends string> {
  readonly title: string;
  readonly description: string;
  /** Name of the radio group for screen readers ("What to clear"). */
  readonly legend: string;
  readonly options: readonly [ChoiceOption<V>, ...ChoiceOption<V>[]];
  /** The option checked when the alert opens; the first one when left out. */
  readonly initialValue?: V;
  /** Runs the chosen option (the alert then closes). */
  readonly onConfirm: (value: V) => void;
}

/** Props of {@link ChoiceConfirmDialog}. */
export interface ChoiceConfirmDialogProps<V extends string> extends ChoiceContent<V> {
  /** Controlled open state; leave out (with `trigger`) to let the trigger open it. */
  readonly open?: boolean;
  readonly onOpenChange?: (open: boolean) => void;
  /** Optional button that opens the alert. */
  readonly trigger?: React.ReactNode;
  /** Moves focus to a logical next element when the opener is gone after closing (e.g. its player was removed). */
  readonly focusFallback?: () => void;
}

/** One option row: the whole row is the hit target; its name is the label, the hint its description. */
function ChoiceRow<V extends string>({ option, name, isChecked, onCheck }: { option: ChoiceOption<V>; name: string; isChecked: boolean; onCheck: (value: V) => void }): React.JSX.Element {
  const ids = { label: useId(), hint: useId() };
  const Mark = isChecked ? CircleCheck : Circle;
  return (
    <label className="choice">
      <input
        type="radio"
        name={name}
        value={option.value}
        checked={isChecked}
        onChange={() => { onCheck(option.value); }}
        aria-labelledby={ids.label}
        aria-describedby={ids.hint}
        className="sr-only"
      />
      <Mark aria-hidden className="choice-mark" />
      <span className="choice-text">
        <span id={ids.label} className="choice-label">{option.label}</span>
        <span id={ids.hint} className="choice-hint">{option.hint}</span>
      </span>
    </label>
  );
}

/** The alert's content; mounted on every open (Radix unmounts closed content), so the choice starts at the default. */
function ChoiceBody<V extends string>({ title, description, legend, options, initialValue, onConfirm }: ChoiceContent<V>): React.JSX.Element {
  const [value, setValue] = useState<V>(initialValue ?? options[0].value);
  const name = useId();
  const chosen = options.find((option) => option.value === value) ?? options[0];
  return (
    <>
      <AlertDialogHeader>
        <AlertDialogTitle>{title}</AlertDialogTitle>
        <AlertDialogDescription>{description}</AlertDialogDescription>
      </AlertDialogHeader>
      <fieldset className="choice-list">
        <legend className="sr-only">{legend}</legend>
        {options.map((option) => (
          <ChoiceRow key={option.value} option={option} name={name} isChecked={option.value === value} onCheck={setValue} />
        ))}
      </fieldset>
      <AlertDialogFooter>
        <AlertDialogCancel>{t("shell.cancel")}</AlertDialogCancel>
        <AlertDialogAction onClick={() => { onConfirm(chosen.value); }}>{chosen.confirm}</AlertDialogAction>
      </AlertDialogFooter>
    </>
  );
}

/**
 * Asks what to delete with a radio list and runs the chosen option on confirm.
 *
 * @remarks Cancel gets the first focus (the least destructive button, accessibility §4); Shift+Tab reaches
 * the options, arrow keys change them; Escape or Cancel close without a change. On close, focus goes back
 * to the control that opened the alert — also when it is not the trigger (Radix would focus only its own
 * trigger, else nothing) — or to `focusFallback` when that control is gone (accessibility §3).
 */
export function ChoiceConfirmDialog<V extends string>({ open, onOpenChange, trigger, focusFallback, ...content }: ChoiceConfirmDialogProps<V>): React.JSX.Element {
  const openerRef = useRef<Element | null>(null);
  const returnFocus = (event: Event) => {
    const opener = openerRef.current;
    // An opener inside an inert subtree (a removed card still fading out, SPEC 1.2 F20) cannot take focus.
    if (opener instanceof HTMLElement && opener.isConnected && opener.closest("[inert]") === null) {
      event.preventDefault();
      opener.focus();
    } else if (focusFallback !== undefined) {
      event.preventDefault();
      focusFallback();
    }
  };
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      {trigger !== undefined && <AlertDialogTrigger asChild>{trigger}</AlertDialogTrigger>}
      {/* onOpenAutoFocus runs before Radix moves focus into the alert, so the opener still has it. */}
      <AlertDialogContent onOpenAutoFocus={() => { openerRef.current = document.activeElement; }} onCloseAutoFocus={returnFocus}>
        <ChoiceBody {...content} />
      </AlertDialogContent>
    </AlertDialog>
  );
}
