"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ThemeToggleProps = {
  className?: string;
};

export function ThemeToggle({ className }: Readonly<ThemeToggleProps>) {
  const { setTheme } = useTheme();

  return (
    <Button
      variant="ghost"
      size="icon"
      className={cn("size-11 md:size-9", className)}
      aria-label="Toggle color theme"
      data-testid="theme-toggle"
      onClick={() =>
        setTheme(
          document.documentElement.classList.contains("dark") ? "light" : "dark"
        )
      }
    >
      <Sun className="hidden size-4 dark:block" aria-hidden="true" />
      <Moon className="size-4 dark:hidden" aria-hidden="true" />
    </Button>
  );
}
