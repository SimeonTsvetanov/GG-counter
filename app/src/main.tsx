import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./app";
import "./styles/global.css";
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

createRoot(rootElement).render(
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
