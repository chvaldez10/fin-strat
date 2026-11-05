"use client";
import { useCallback, useSyncExternalStore } from "react";
import { currentYearMonth, isYearMonth } from "../months";

function snapshot() {
  const value = new URL(window.location.href).searchParams.get("month");
  return value && isYearMonth(value) && value >= "1900-01" && value <= "2200-12"
    ? value
    : currentYearMonth();
}
function subscribe(listener: () => void) {
  window.addEventListener("popstate", listener);
  window.addEventListener("money-planner-month", listener);
  return () => {
    window.removeEventListener("popstate", listener);
    window.removeEventListener("money-planner-month", listener);
  };
}
export function usePlannerMonth() {
  const month = useSyncExternalStore(subscribe, snapshot, () => "");
  const setMonth = useCallback((value: string) => {
    if (!isYearMonth(value) || value < "1900-01" || value > "2200-12") return;
    const url = new URL(window.location.href);
    url.searchParams.set("month", value);
    window.history.replaceState(null, "", url);
    window.dispatchEvent(new Event("money-planner-month"));
  }, []);
  return { month, setMonth };
}
export function monthLink(path: string, month: string) {
  return month ? `${path}?month=${encodeURIComponent(month)}` : path;
}
