import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./app";
import { initI18n } from "./i18n";
import { trackKeyboardInset } from "./lib/keyboard-inset";
import "./styles/app.css";
import { ThemeProvider } from "./providers/theme-provider";
import { migrateLegacyStorage } from "./storage/migrate";
import { ErrorBoundary } from "./ui/error-boundary";
import { ToastProvider } from "./ui/toast";

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("Root element with id 'root' not found");
}

// Before the first render, so the game and theme are read from the namespaced keys (PLAN T-07).
migrateLegacyStorage();
// Bottom sheets stay above the on-screen keyboard (iOS Safari needs the measured inset).
trackKeyboardInset();

/** Renders the app into #root. */
function render(root: HTMLElement): void {
  createRoot(root).render(
    <StrictMode>
      {/* Outermost, so even a crash in the providers shows the error screen, never a blank page. */}
      <ErrorBoundary>
        <ThemeProvider defaultTheme="system">
          <ToastProvider>
            <App />
          </ToastProvider>
        </ThemeProvider>
      </ErrorBoundary>
    </StrictMode>
  );
}

// The first render waits for the start language (PLAN T-09): a Bulgarian user's first frame is
// already Bulgarian — #root is empty until then, so no English text flips. initI18n never rejects
// (a language that cannot load falls back to English).
void initI18n().then(() => { render(rootElement); });
