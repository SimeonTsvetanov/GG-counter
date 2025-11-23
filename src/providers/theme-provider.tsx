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

export type Theme = "light" | "dark" | "system";

interface ThemeProviderProps {
  children: ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
}

interface ThemeContextValue {
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

export function ThemeProvider({
  children,
  defaultTheme = "system",
  storageKey = "theme",
}: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window === "undefined") {
      return defaultTheme;
    }

    const stored = window.localStorage.getItem(storageKey) as Theme | null;
    return stored ?? defaultTheme;
  });
  const [resolvedTheme, setResolvedTheme] = useState<Theme>(() =>
    resolveTheme(theme)
  );

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const element = window.document.documentElement;
    const next = resolveTheme(theme);

    element.classList.remove("light", "dark");
    element.classList.add(next);
    setResolvedTheme(next);

    if (theme === "system") {
      window.localStorage.removeItem(storageKey);
    } else {
      window.localStorage.setItem(storageKey, theme);
    }
  }, [theme, storageKey]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const mediaQuery = window.matchMedia(prefersDarkQuery);

    const handler = () => {
      setResolvedTheme(resolveTheme(theme));
      if (theme === "system") {
        const element = window.document.documentElement;
        const next = resolveTheme("system");
        element.classList.remove("light", "dark");
        element.classList.add(next);
      }
    };

    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
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

export function useTheme() {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }

  return context;
}
