// Vendored shadcn/ui Button, restyled to the forge tokens (PLAN T-12): the look lives in
// styles/components/button.css (.button + variants); cva only maps the props to those classes,
// and utilities passed in `className` place the button (width, order).
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/utils";
import { forwardRef } from "react";

type ButtonVariants = VariantProps<typeof buttonVariants>;

const buttonVariants = cva("button", {
  variants: {
    variant: {
      // Primary: the one main action of a view (ui-patterns §1).
      default: "button--primary",
      secondary: "",
      // The compact header's toolbar buttons: on the fill colour, like secondary.
      outline: "",
      ghost: "button--plain",
      // Filled red: the confirm button of a delete/clear alert only.
      danger: "button--danger",
      // Quiet red text (iOS Settings style) on card surfaces.
      destructive: "button--destructive",
    },
    size: {
      default: "",
      icon: "button--icon",
    },
  },
  defaultVariants: {
    variant: "default",
    size: "default",
  },
});

/** Props of {@link Button}: every native `<button>` attribute plus the variant, size and `asChild`. */
export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    ButtonVariants {
  /** Renders the single child (e.g. an `<a>`) with the button's look instead of a `<button>`. */
  asChild?: boolean;
}

/** A button with the forge look (44 px, token colours, soft lift on hover, press scale). */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, type, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";

    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        // A real <button> never submits by accident; asChild keeps the child's own semantics.
        {...(asChild ? {} : { type: type ?? "button" })}
        {...props}
      />
    );
  }
);

Button.displayName = "Button";
