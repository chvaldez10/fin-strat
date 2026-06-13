import type { UserId } from "@/features/auth/types";
import { createDemoMoneyFlowDocument } from "./mock-data";
import {
  MONEY_FLOW_DOCUMENT_VERSION,
  type MoneyFlowDocument,
  type MoneyFlowRepository,
} from "./types";

const STORAGE_PREFIX = "personal-dashboard:money-flow";
const LEGACY_STORAGE_KEY = STORAGE_PREFIX;

type LegacyMoneyFlowDocument = Omit<
  MoneyFlowDocument,
  "id" | "userId" | "version"
> & {
  version: 1;
};

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

  const scopedDocument = readStoredDocument(storageKeyForUser(userId));

  if (isMoneyFlowDocument(scopedDocument, userId)) {
    return scopedDocument;
  }

  const legacyDocument = readStoredDocument(LEGACY_STORAGE_KEY);

  if (isLegacyMoneyFlowDocument(legacyDocument)) {
    const migratedDocument: MoneyFlowDocument = {
      ...legacyDocument,
      id: `money-flow-monthly-baseline:${userId}`,
      userId,
      version: MONEY_FLOW_DOCUMENT_VERSION,
    };

    saveMoneyFlow(userId, migratedDocument);
    window.localStorage.removeItem(LEGACY_STORAGE_KEY);
    return migratedDocument;
  }

  return createDemoMoneyFlowDocument(userId);
}

export function saveMoneyFlow(
  userId: UserId,
  document: MoneyFlowDocument
) {
  if (typeof window === "undefined") {
    return;
  }

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
  const storedDocument = window.localStorage.getItem(key);

  if (!storedDocument) {
    return null;
  }

  try {
    return JSON.parse(storedDocument);
  } catch {
    return null;
  }
}

function isMoneyFlowDocument(
  value: unknown,
  userId: UserId
): value is MoneyFlowDocument {
  if (!hasDocumentShape(value)) {
    return false;
  }

  const document = value as Partial<MoneyFlowDocument>;

  return (
    document.version === MONEY_FLOW_DOCUMENT_VERSION &&
    typeof document.id === "string" &&
    document.userId === userId
  );
}

function isLegacyMoneyFlowDocument(
  value: unknown
): value is LegacyMoneyFlowDocument {
  return (
    hasDocumentShape(value) &&
    (value as Partial<LegacyMoneyFlowDocument>).version === 1
  );
}

function hasDocumentShape(value: unknown) {
  if (!value || typeof value !== "object") {
    return false;
  }

  const document = value as Partial<MoneyFlowDocument>;

  return (
    document.currency === "CAD" &&
    Array.isArray(document.nodes) &&
    Array.isArray(document.transfers) &&
    typeof document.scenario?.startingBalanceCents === "number" &&
    typeof document.viewport?.zoom === "number"
  );
}
