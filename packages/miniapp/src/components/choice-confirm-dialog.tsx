// The confirmation with a choice (SPEC 1.1 F13, F14; DECISIONS 2026-11-20): one alert asks what to delete —
// a radio list of options (the default checked again every time the alert opens), then Cancel and the red
// confirm button whose label names the chosen result. Used by Clear session and each player's delete button.
import { lazy, Suspense } from "react";
import { AlertDialog, AlertDialogTrigger } from "@radix-ui/react-alert-dialog";

// Only the root and the trigger are in the first load; rendering the lazy content (closed: nothing to draw)
// starts its chunk right after the first render, so the alert is there by the first tap. A tap before that
// still opens it: the open state lives in the root, the content follows when its chunk has arrived.
const ChoiceConfirmContent = lazy(() => import("./choice-confirm-content").then((module) => ({ default: module.ChoiceConfirmContent })));

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
export interface ChoiceContent<V extends string> {
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

/**
 * Asks what to delete with a radio list and runs the chosen option on confirm (focus rules: the content's
 * {@link ChoiceConfirmContent} remarks).
 */
export function ChoiceConfirmDialog<V extends string>({ open, onOpenChange, trigger, focusFallback, options, onConfirm, ...content }: ChoiceConfirmDialogProps<V>): React.JSX.Element {
  // The lazy content takes plain strings; the chosen value is always one of `options`.
  const confirm = (value: string): void => {
    const option = options.find((candidate) => candidate.value === value);
    if (option !== undefined) onConfirm(option.value);
  };
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      {trigger !== undefined && <AlertDialogTrigger asChild>{trigger}</AlertDialogTrigger>}
      <Suspense fallback={null}>
        <ChoiceConfirmContent {...content} options={options} onConfirm={confirm} focusFallback={focusFallback} />
      </Suspense>
    </AlertDialog>
  );
}
