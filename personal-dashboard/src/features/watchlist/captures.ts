export const MAX_CAPTURE_LENGTH = 500;
export const MAX_CAPTURE_ID_LENGTH = 120;
export const CAPTURE_IMPORT_BATCH_SIZE = 200;

export type WatchlistCapture = {
  id: string;
  text: string;
  createdAt: string;
};

function captureKey(userId: string) {
  return `personal-dashboard:watchlist-captures:${userId}`;
}

function parseCaptures(raw: string | null): WatchlistCapture[] {
  if (raw === null) return [];
  const value: unknown = JSON.parse(raw);
  if (!Array.isArray(value) || !value.every(isWatchlistCapture))
    throw new Error("Invalid capture data");
  return value;
}

export function readCaptureBackups(
  storage: Pick<Storage, "getItem">,
  userId: string
): WatchlistCapture[] {
  const keys = new Set([captureKey(userId), captureKey("user_chris_demo")]);
  return Array.from(keys).flatMap((key) =>
    parseCaptures(storage.getItem(key)).map(({ id, text, createdAt }) => ({
      id,
      text,
      createdAt,
    }))
  );
}

/** Preserve existing notes if storage is unavailable or its data cannot be read. */
export function saveWatchlistCapture(
  storage: Pick<Storage, "getItem" | "setItem">,
  userId: string,
  capture: WatchlistCapture
) {
  const key = captureKey(userId);
  const existing = parseCaptures(storage.getItem(key));
  if (!isWatchlistCapture(capture)) throw new Error("Invalid capture data");
  storage.setItem(key, JSON.stringify([capture, ...existing]));
}

function isWatchlistCapture(value: unknown): value is WatchlistCapture {
  if (!value || typeof value !== "object") return false;
  const capture = value as Partial<WatchlistCapture>;
  const text = typeof capture.text === "string" ? capture.text.trim() : "";
  return (
    typeof capture.id === "string" &&
    capture.id.length > 0 &&
    capture.id.length <= MAX_CAPTURE_ID_LENGTH &&
    text.length > 0 &&
    text.length <= MAX_CAPTURE_LENGTH &&
    typeof capture.createdAt === "string" &&
    Number.isFinite(Date.parse(capture.createdAt))
  );
}
