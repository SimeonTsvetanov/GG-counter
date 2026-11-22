// Watches whether an element is on screen; the main screen uses it to switch the header layout
// while the leaderboard card is scrolled away.
import { useEffect, useState, type RefObject } from "react";

/**
 * Returns whether at least `threshold` of the element in `ref` is on screen (true until measured).
 *
 * @param ref - a stable ref whose element is attached on mount (the observer is set up once).
 * @param threshold - share of the element (0 to 1) on screen that counts as "in view"; pass a constant.
 */
export function useInView(ref: RefObject<HTMLElement | null>, threshold: number): boolean {
  const [isInView, setIsInView] = useState(true);

  useEffect(() => {
    if (!ref.current) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        setIsInView(entries.at(0)?.isIntersecting ?? true);
      },
      { threshold }
    );

    observer.observe(ref.current);
    return () => { observer.disconnect(); };
  }, [ref, threshold]);

  return isInView;
}
