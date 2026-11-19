// The theme picker in Settings: a segmented control of System / Light / Dark (design → ui-patterns
// §3, accessibility §6) — a radio group in a fieldset, so arrow keys move and select.
import { t } from "../i18n";
import { useTheme } from "../providers/theme-provider";
import type { Theme } from "../storage/theme";

const THEMES: readonly Theme[] = ["system", "light", "dark"];

/** Renders the theme radio group; a choice applies at once and is saved on this device. */
export function ThemeChoice(): React.JSX.Element {
  const { theme, setTheme } = useTheme();
  return (
    <fieldset className="grid grid-cols-3 gap-1 rounded-lg bg-muted p-1">
      <legend className="sr-only">{t("shell.theme.label")}</legend>
      {THEMES.map((value) => (
        <label
          key={value}
          className="flex min-h-11 cursor-pointer items-center justify-center rounded-md text-sm font-medium text-foreground has-[:checked]:bg-background has-[:checked]:shadow-sm has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-ring"
        >
          <input
            type="radio"
            name="theme"
            value={value}
            checked={theme === value}
            onChange={() => { setTheme(value); }}
            className="sr-only"
          />
          {t(`shell.theme.${value}`)}
        </label>
      ))}
    </fieldset>
  );
}
