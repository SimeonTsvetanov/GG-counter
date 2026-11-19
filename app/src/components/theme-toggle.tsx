// The header's theme button (from 600 px up): a menu of Light / Dark / System. The icon shows the theme
// in use (sun in light, moon in dark). Loaded after the first paint like the app menu (ui/header-menus.tsx).
import { useRef } from "react";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Moon, Sun } from "lucide-react";
import { t } from "../i18n";
import { useTheme } from "../providers/theme-provider";
import type { LazyMenuProps } from "../ui/lazy-menu";
import { useMenuHandover } from "../ui/menu-handover";

/** Menu button that switches between light, dark and system theme. */
export function ThemeToggle({ className, initialIntent }: { className?: string } & LazyMenuProps): React.JSX.Element {
  const { theme, setTheme } = useTheme();
  const trigger = useRef<HTMLButtonElement>(null);
  const { open, setOpen, onContentFocus } = useMenuHandover(initialIntent, trigger);

  const handleChange = (value: string) => {
    if (value === "light" || value === "dark" || value === "system") {
      setTheme(value);
    }
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          ref={trigger}
          size="icon"
          aria-label={t("shell.theme.toggle")}
          variant="ghost"
          className={className}
        >
          <Sun className="dark:hidden" aria-hidden />
          <Moon className="hidden dark:block" aria-hidden />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        sideOffset={8}
        collisionPadding={16}
        onFocus={onContentFocus}
      >
        <DropdownMenuLabel>{t("shell.theme.label")}</DropdownMenuLabel>
        <DropdownMenuRadioGroup
          value={theme}
          onValueChange={handleChange}
          aria-label={t("shell.theme.selection")}
        >
          <DropdownMenuRadioItem value="light">{t("shell.theme.light")}</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="dark">{t("shell.theme.dark")}</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="system">{t("shell.theme.system")}</DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
