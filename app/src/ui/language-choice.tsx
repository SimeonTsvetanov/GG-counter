// The language picker in Settings (PLAN T-09, app-shell → i18n): a segmented control like the theme
// picker — a radio group in a fieldset, so arrow keys move and select. Each option is written in its
// own language and marked with `lang`, so people and screen readers recognise it in any UI language.
import { useState } from "react";
import { LANGUAGE_NAMES, setLanguage, t } from "../i18n";
import { useLanguage } from "../i18n/use-language";
import { app, type LanguageCode } from "../config";

/** Renders the language radio group; a choice applies at once, without a reload, and is saved on this device. */
export function LanguageChoice(): React.JSX.Element {
  const active = useLanguage();
  // The picked option is checked at once, also while its language is still loading.
  const [picked, setPicked] = useState<LanguageCode | null>(null);
  const checked = picked ?? active;
  return (
    <fieldset className="grid grid-cols-2 gap-1 rounded-lg bg-muted p-1">
      <legend className="sr-only">{t("shell.language.label")}</legend>
      {app.languages.map((lang) => (
        <label
          key={lang}
          lang={lang}
          className="flex min-h-11 cursor-pointer items-center justify-center rounded-md text-sm font-medium text-foreground has-[:checked]:bg-background has-[:checked]:shadow-sm has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-ring"
        >
          <input
            type="radio"
            name="lang"
            value={lang}
            checked={checked === lang}
            onChange={() => {
              setPicked(lang);
              void setLanguage(lang).then(() => { setPicked(null); });
            }}
            className="sr-only"
          />
          {LANGUAGE_NAMES[lang]}
        </label>
      ))}
    </fieldset>
  );
}
