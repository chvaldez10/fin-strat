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

  const scopedDocument = decodeStoredMoneyFlowDocument(
    readStoredDocument(storageKeyForUser(userId)),
    userId
  );
  if (scopedDocument) {
    saveMoneyFlow(userId, scopedDocument);
    return scopedDocument;
  }

  const legacyDocument = decodeStoredMoneyFlowDocument(
    readStoredDocument(LEGACY_STORAGE_KEY),
    userId
  );
  if (legacyDocument) {
    saveMoneyFlow(userId, legacyDocument);
    window.localStorage.removeItem(LEGACY_STORAGE_KEY);
    return legacyDocument;
  }

  return createDemoMoneyFlowDocument(userId);
}

export function saveMoneyFlow(
  userId: UserId,
  document: MoneyFlowDocument
) {
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
    return JSON.parse(stored);
  } catch {
    return null;
  }
}
