// React side of app/src/i18n: a component that calls useLanguage() re-renders when the language
// changes, and with it everything it renders. The composition roots (App, the toast provider) call it,
// so every t() on screen follows a switch in Settings without a reload (no react-i18next needed).
import { useSyncExternalStore } from "react";
import { getLanguage, onLanguageChange, type LanguageCode } from "./index";

/** Returns the active UI language and re-renders the caller when it changes. */
export function useLanguage(): LanguageCode {
  return useSyncExternalStore(onLanguageChange, getLanguage);
}
