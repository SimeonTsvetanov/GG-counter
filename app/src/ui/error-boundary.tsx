// The app-level error boundary (engineering → react §2, app-shell → error-pages §2): an unexpected
// error while rendering shows the error screen instead of a blank page. Expected problems (limits,
// bad import files) never get here — they are inline messages. A class, because React has no hook
// for this.
import { Component, useEffect, useState, type ErrorInfo, type ReactNode } from "react";
import { ErrorScreen } from "./error-screen";

/**
 * Document event that makes the app throw while rendering — the e2e test's way to reach the error
 * screen (error-pages §5 "throw in a test hook"). Harmless: anything able to dispatch it already
 * runs on the page.
 */
export const TEST_CRASH_EVENT = "app:test-crash";

/** Props of {@link ErrorBoundary}. */
interface ErrorBoundaryProps {
  readonly children: ReactNode;
}

/** Shows {@link ErrorScreen} when a child throws while rendering. */
export class ErrorBoundary extends Component<ErrorBoundaryProps, { error: Error | null }> {
  override state: { error: Error | null } = { error: null };

  /** Returns the state that shows the error screen for `error`. */
  static getDerivedStateFromError(error: unknown): { error: Error } {
    return { error: error instanceof Error ? error : new Error(String(error)) };
  }

  /** Logs the error for the browser console (the screen shows it too). */
  override componentDidCatch(error: unknown, info: ErrorInfo): void {
    console.error("GG Counter crashed", error, info.componentStack);
  }

  /** Renders the children, or the error screen after an error. */
  override render(): ReactNode {
    return this.state.error === null ? this.props.children : <ErrorScreen error={this.state.error} />;
  }
}

/** Throws during render after {@link TEST_CRASH_EVENT}; renders nothing otherwise. */
export function CrashTestHook(): null {
  const [isCrashing, setIsCrashing] = useState(false);
  useEffect(() => {
    const crash = (): void => { setIsCrashing(true); };
    document.addEventListener(TEST_CRASH_EVENT, crash);
    return () => { document.removeEventListener(TEST_CRASH_EVENT, crash); };
  }, []);
  if (isCrashing) throw new Error("Test crash requested by the app:test-crash event");
  return null;
}
