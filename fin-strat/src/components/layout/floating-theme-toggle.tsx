import { ThemeToggle } from "@/components/layout/theme-toggle";

export function FloatingThemeToggle() {
  return (
    <div className="fixed bottom-4 right-4 z-50 rounded-full border border-border bg-background/95 p-1 shadow-lg backdrop-blur supports-backdrop-filter:bg-background/75">
      <ThemeToggle className="rounded-full" />
    </div>
  );
}
