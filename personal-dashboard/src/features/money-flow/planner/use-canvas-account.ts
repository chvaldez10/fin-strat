"use client";
import { useCallback, useSyncExternalStore } from "react";

function snapshot() {
  return new URL(window.location.href).searchParams.get("account") ?? "";
}
function subscribe(listener: () => void) {
  window.addEventListener("popstate", listener);
  window.addEventListener("money-canvas-account", listener);
  return () => {
    window.removeEventListener("popstate", listener);
    window.removeEventListener("money-canvas-account", listener);
  };
}
/** The URL remembers the selected canvas without changing any financial data. */
export function useCanvasAccount() {
  const accountId = useSyncExternalStore(subscribe, snapshot, () => "");
  const selectAccount = useCallback((id: string) => {
    const url = new URL(window.location.href);
    url.searchParams.set("account", id);
    window.history.replaceState(null, "", url);
    window.dispatchEvent(new Event("money-canvas-account"));
  }, []);
  return { accountId, selectAccount };
}
