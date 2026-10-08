export const MAX_CAPTURE_LENGTH = 500;

export type WatchlistCapture = {
  id: string;
  text: string;
  createdAt: string;
};

/** Preserve existing notes if storage is unavailable or its data cannot be read. */
export function saveWatchlistCapture(
  storage: Pick<Storage, "getItem" | "setItem">,
  userId: string,
  capture: WatchlistCapture
) {
  const key = `personal-dashboard:watchlist-captures:${userId}`;
  const stored = storage.getItem(key);
  const existing: unknown = stored === null ? [] : JSON.parse(stored);
  if (
    !Array.isArray(existing) ||
    !existing.every(isWatchlistCapture) ||
    !isWatchlistCapture(capture)
  ) {
    throw new Error("Invalid capture data");
  }
  storage.setItem(key, JSON.stringify([capture, ...existing]));
}

function isWatchlistCapture(value: unknown): value is WatchlistCapture {
  if (!value || typeof value !== "object") return false;
  const capture = value as Partial<WatchlistCapture>;
  return (
    typeof capture.id === "string" &&
    typeof capture.text === "string" &&
    capture.text.trim().length > 0 &&
    capture.text.length <= MAX_CAPTURE_LENGTH &&
    typeof capture.createdAt === "string" &&
    Number.isFinite(Date.parse(capture.createdAt))
  );
}
