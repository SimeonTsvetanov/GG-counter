// Vendored shadcn/ui Input, restyled to the forge tokens (PLAN T-12): fill, no border, 44 px, 17 px text —
// styles/components/field.css.
import { cn } from "../../lib/utils";
import { forwardRef } from "react";

/** Props of {@link Input}: every native `<input>` attribute. */
export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

/** A text field with the forge look; the focus ring comes from base.css. */
export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return <input type={type} className={cn("field", className)} ref={ref} {...props} />;
  }
);

Input.displayName = "Input";
