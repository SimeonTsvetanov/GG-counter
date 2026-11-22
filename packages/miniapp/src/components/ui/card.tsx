// Vendored shadcn/ui Card, restyled to the forge tokens (PLAN T-12): surface, large radius, resting
// shadow, no border — styles/components/card.css. `className` adds layout utilities.
import { cn } from "../../lib/utils";

/** A card surface. */
export function Card({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>): React.JSX.Element {
  return <div className={cn("card", className)} {...props} />;
}

/** The card's title row (title left, meta right). */
export function CardHeader({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>): React.JSX.Element {
  return <div className={cn("card-header", className)} {...props} />;
}

/** The card's title. */
export function CardTitle({
  className,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>): React.JSX.Element {
  // h2: card titles sit directly under the page's h1 in the header (no skipped level).
  return <h2 className={cn("card-title", className)} {...props} />;
}

/** One line of secondary text in a card. */
export function CardDescription({
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>): React.JSX.Element {
  return <p className={cn("card-meta", className)} {...props} />;
}

/** The card's body. */
export function CardContent({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>): React.JSX.Element {
  return <div className={cn("card-content", className)} {...props} />;
}

/** The card's actions row. */
export function CardFooter({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>): React.JSX.Element {
  return <div className={cn("card-footer", className)} {...props} />;
}
