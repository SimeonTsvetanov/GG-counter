import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./app";
import "./styles/global.css";
import { ThemeProvider } from "./providers/theme-provider";
import { migrateLegacyStorage } from "./storage/migrate";

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("Root element with id 'root' not found");
}

// Before the first render, so the game and theme are read from the namespaced keys (PLAN T-07).
migrateLegacyStorage();

createRoot(rootElement).render(
  <StrictMode>
    <ThemeProvider defaultTheme="system">
      <App />
    </ThemeProvider>
  </StrictMode>
);
