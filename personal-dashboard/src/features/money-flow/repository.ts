import type { UserId } from "@/features/auth/types";
import { decodeStoredMoneyFlowDocument } from "./persistence/document-codec";
import type { MoneyFlowDocument } from "./types";

const STORAGE_PREFIX = "personal-dashboard:money-flow";
const LEGACY_STORAGE_KEY = STORAGE_PREFIX;

/** Read-only browser backup reader. Convex is the runtime store. */
export function loadMoneyFlow(userId: UserId): MoneyFlowDocument | null {
  if (typeof window === "undefined") {
    return null;
  }

  const storedDocument = readStoredDocument(storageKeyForUser(userId));
  if (storedDocument !== null) {
    const scopedDocument = decodeStoredMoneyFlowDocument(
      storedDocument,
      userId
    );
    if (!scopedDocument)
      throw new Error(
        "Saved finance data is invalid or belongs to another user. It has not been overwritten."
      );
    return scopedDocument;
  }

  const storedLegacy = readStoredDocument(LEGACY_STORAGE_KEY);
  if (storedLegacy !== null) {
    const legacyDocument = decodeStoredMoneyFlowDocument(storedLegacy, userId);
    if (!legacyDocument)
      throw new Error(
        "Older finance data could not be loaded safely. It has not been overwritten."
      );
    return legacyDocument;
  }

  return null;
}

function storageKeyForUser(userId: UserId) {
  return `${STORAGE_PREFIX}:${userId}`;
}

function readStoredDocument(key: string): unknown {
  const stored = window.localStorage.getItem(key);
  if (!stored) return null;
  try {
    const value: unknown = JSON.parse(stored);
    if (value === null) throw new Error("Empty saved document");
    return value;
  } catch {
    throw new Error(
      "Saved finance data could not be read. It has not been overwritten."
    );
  }
}
