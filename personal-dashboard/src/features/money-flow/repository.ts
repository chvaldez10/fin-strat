import type { UserId } from "@/features/auth/types";
import { createDemoMoneyFlowDocument } from "./mock-data";
import { decodeStoredMoneyFlowDocument } from "./persistence/document-codec";
import type { MoneyFlowDocument, MoneyFlowRepository } from "./types";

const STORAGE_PREFIX = "personal-dashboard:money-flow";
const LEGACY_STORAGE_KEY = STORAGE_PREFIX;

export function createLocalMoneyFlowRepository(
  userId: UserId
): MoneyFlowRepository {
  return {
    userId,
    load: () => loadMoneyFlow(userId),
    save: (document) => saveMoneyFlow(userId, document),
    reset: () => resetMoneyFlow(userId),
  };
}

export function loadMoneyFlow(userId: UserId): MoneyFlowDocument {
  if (typeof window === "undefined") {
    return createDemoMoneyFlowDocument(userId);
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
    if (scopedDocument !== storedDocument)
      saveMoneyFlow(userId, scopedDocument);
    return scopedDocument;
  }

  const storedLegacy = readStoredDocument(LEGACY_STORAGE_KEY);
  if (storedLegacy !== null) {
    const legacyDocument = decodeStoredMoneyFlowDocument(storedLegacy, userId);
    if (!legacyDocument)
      throw new Error(
        "Older finance data could not be loaded safely. It has not been overwritten."
      );
    saveMoneyFlow(userId, legacyDocument);
    // The scoped copy is durable before the original migration record is removed.
    try {
      window.localStorage.removeItem(LEGACY_STORAGE_KEY);
    } catch {
      /* Keep the original when storage prevents cleanup. */
    }
    return legacyDocument;
  }

  return createDemoMoneyFlowDocument(userId);
}

export function saveMoneyFlow(userId: UserId, document: MoneyFlowDocument) {
  if (typeof window === "undefined") return;
  if (document.userId !== userId) {
    throw new Error("Cannot save a money-flow document for another user.");
  }
  window.localStorage.setItem(
    storageKeyForUser(userId),
    JSON.stringify(document)
  );
}

export function resetMoneyFlow(userId: UserId) {
  const document = createDemoMoneyFlowDocument(userId);
  saveMoneyFlow(userId, document);
  return document;
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
