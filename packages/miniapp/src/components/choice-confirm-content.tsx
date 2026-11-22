// The inside of the choice alert (components/choice-confirm-dialog.tsx): the radio list, Cancel and the red
// confirm button, and where focus goes on close. Its own chunk (performance §1, DECISIONS 2026-11-22): the
// alert's root and trigger stay in the first load, this part loads right after the first render.
import { useId, useRef, useState } from "react";
import { Circle, CircleCheck } from "lucide-react";
import {
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "./ui/alert-dialog";
import { t } from "../i18n";
import type { ChoiceContent, ChoiceOption } from "./choice-confirm-dialog";

/** Props of {@link ChoiceConfirmContent}. */
export interface ChoiceConfirmContentProps<V extends string> extends ChoiceContent<V> {
  /** Moves focus to a logical next element when the opener is gone after closing (e.g. its player was removed). */
  readonly focusFallback?: (() => void) | undefined;
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
 * The alert's portal content: the choice and its buttons.
 *
 * @remarks Cancel gets the first focus (the least destructive button, accessibility §4); Shift+Tab reaches
 * the options, arrow keys change them; Escape or Cancel close without a change. On close, focus goes back
 * to the control that opened the alert — also when it is not the trigger (Radix would focus only its own
 * trigger, else nothing) — or to `focusFallback` when that control is gone (accessibility §3).
 */
export function ChoiceConfirmContent<V extends string>({ focusFallback, ...content }: ChoiceConfirmContentProps<V>): React.JSX.Element {
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
    // onOpenAutoFocus runs before Radix moves focus into the alert, so the opener still has it.
    <AlertDialogContent onOpenAutoFocus={() => { openerRef.current = document.activeElement; }} onCloseAutoFocus={returnFocus}>
      <ChoiceBody {...content} />
    </AlertDialogContent>
  );
}
