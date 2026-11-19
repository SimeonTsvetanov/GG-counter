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
import { cn } from "../lib/utils";
import { useTheme } from "../providers/theme-provider";

/** Menu button that switches between light, dark and system theme. */
export function ThemeToggle({ className }: { className?: string }): React.JSX.Element {
  const { theme, setTheme } = useTheme();

  const handleChange = (value: string) => {
    if (value === "light" || value === "dark" || value === "system") {
      setTheme(value);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          aria-label={t("shell.theme.toggle")}
          className={cn("relative", className)}
        >
          <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">{t("shell.theme.toggle")}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        sideOffset={8}
        collisionPadding={16}
        className="w-40"
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
