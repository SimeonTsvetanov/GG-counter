// The theme choice (light / dark / system) for the whole app: the class on <html> (the resolved theme),
// `data-theme` for a forced choice (design/tokens.css → color-scheme; System removes it), the browser bar
// colour, and the saved choice (app/src/storage/theme.ts). public/theme-init.js does the same before the
// first paint.
import {
  createContext,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { readTheme, writeTheme, type Theme } from "../storage/theme";

interface ThemeProviderProps {
  children: ReactNode;
  defaultTheme?: Theme;
}

/** What {@link useTheme} returns. */
export interface ThemeContextValue {
  theme: Theme;
  resolvedTheme: Theme;
  setTheme: Dispatch<SetStateAction<Theme>>;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

const prefersDarkQuery = "(prefers-color-scheme: dark)";

function resolveTheme(theme: Theme): Theme {
  if (typeof window === "undefined") {
    return theme === "system" ? "light" : theme;
  }

  if (theme === "system") {
    const isDark = window.matchMedia(prefersDarkQuery).matches;
    return isDark ? "dark" : "light";
  }

  return theme;
}

/** The two `theme-color` metas (light / dark, scripts/tokens.ts) and the colours they were written with. */
const themeColorMetas = (): HTMLMetaElement[] => [...document.querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]')];
const originalThemeColors = new WeakMap<HTMLMetaElement, string>();

/**
 * Puts `theme` on `<html>`: the resolved class, `data-theme` when forced, and the browser bar colour —
 * a forced theme paints both metas with the page background the browser now resolves; System restores
 * the per-scheme values of the HTML (design-system §4).
 */
function applyTheme(theme: Theme): Theme {
  const element = document.documentElement;
  const next = resolveTheme(theme);
  element.classList.remove("light", "dark");
  element.classList.add(next);
  if (theme === "system") element.removeAttribute("data-theme");
  else element.setAttribute("data-theme", theme);
  const background = getComputedStyle(element).backgroundColor;
  for (const meta of themeColorMetas()) {
    if (!originalThemeColors.has(meta)) originalThemeColors.set(meta, meta.content);
    meta.content = theme === "system" ? (originalThemeColors.get(meta) ?? meta.content) : background;
  }
  return next;
}

/** Applies the chosen theme to `<html>`, saves it in this browser and shares it via {@link useTheme}. */
export function ThemeProvider({
  children,
  defaultTheme = "system",
}: ThemeProviderProps): React.JSX.Element {
  const [theme, setTheme] = useState<Theme>(() => readTheme() ?? defaultTheme);
  const [resolvedTheme, setResolvedTheme] = useState<Theme>(() =>
    resolveTheme(theme)
  );

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    setResolvedTheme(applyTheme(theme));

    // "system" removes the saved value (writeTheme), as before; a refused save keeps the theme for this session.
    writeTheme(theme);
  }, [theme]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const mediaQuery = window.matchMedia(prefersDarkQuery);

    const handler = () => {
      setResolvedTheme(theme === "system" ? applyTheme(theme) : resolveTheme(theme));
    };

    mediaQuery.addEventListener("change", handler);
    return () => { mediaQuery.removeEventListener("change", handler); };
  }, [theme]);

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme,
      resolvedTheme,
      setTheme,
    }),
    [resolvedTheme, theme]
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

/** Returns the current theme and its setter; throws when used outside {@link ThemeProvider}. */
export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }

  return context;
}
