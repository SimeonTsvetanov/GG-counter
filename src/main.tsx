import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./app";
import "./styles/global.css";
import { ThemeProvider } from "./providers/theme-provider";

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("Root element with id 'root' not found");
}

createRoot(rootElement).render(
  <StrictMode>
    <ThemeProvider defaultTheme="system" storageKey="gg-counter-theme">
      <App />
    </ThemeProvider>
  </StrictMode>
);
