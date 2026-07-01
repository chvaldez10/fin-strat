"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from "react";

type Theme = "light" | "dark";

type ThemeContextValue = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
};

const THEME_CHANGE_EVENT = "personal-dashboard:theme-change";
const ThemeContext = createContext<ThemeContextValue | null>(null);

function getThemeSnapshot(): Theme {
  const storedTheme = window.localStorage.getItem("theme");

  if (storedTheme === "light" || storedTheme === "dark") {
    return storedTheme;
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function getServerThemeSnapshot(): Theme {
  return "light";
}

function subscribeToTheme(onStoreChange: () => void) {
  const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
  const handleStorage = (event: StorageEvent) => {
    if (event.key === "theme") {
      onStoreChange();
    }
  };

  window.addEventListener(THEME_CHANGE_EVENT, onStoreChange);
  window.addEventListener("storage", handleStorage);
  mediaQuery.addEventListener("change", onStoreChange);

  return () => {
    window.removeEventListener(THEME_CHANGE_EVENT, onStoreChange);
    window.removeEventListener("storage", handleStorage);
    mediaQuery.removeEventListener("change", onStoreChange);
  };
}

function applyTheme(theme: Theme) {
  document.documentElement.classList.toggle("dark", theme === "dark");
  document.documentElement.style.colorScheme = theme;
}

function setStoredTheme(theme: Theme) {
  window.localStorage.setItem("theme", theme);
  applyTheme(theme);
  window.dispatchEvent(new Event(THEME_CHANGE_EVENT));
}

export function Providers({ children }: { children: ReactNode }) {
  const theme = useSyncExternalStore(
    subscribeToTheme,
    getThemeSnapshot,
    getServerThemeSnapshot
  );

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme,
      setTheme: setStoredTheme,
    }),
    [theme]
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useDashboardTheme() {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error("useDashboardTheme must be used inside Providers.");
  }

  return context;
}
