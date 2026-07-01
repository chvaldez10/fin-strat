import type { UserId } from "@/features/auth/types";
import {
  createCibcWorkspace,
  createDemoMoneyFlowDocument,
} from "./mock-data";
import { currentYearMonth } from "./months";
import {
  MONEY_FLOW_DOCUMENT_VERSION,
  type MoneyFlowAccountWorkspace,
  type MoneyFlowDocument,
  type MoneyFlowNode,
  type MoneyFlowRepository,
  type MoneyFlowTransfer,
  type MoneyFlowViewMode,
  type MoneyFlowViewport,
  type YearMonth,
} from "./types";

const STORAGE_PREFIX = "personal-dashboard:money-flow";
const LEGACY_STORAGE_KEY = STORAGE_PREFIX;

type LegacyGraphDocument = {
  nodes: MoneyFlowNode[];
  transfers: MoneyFlowTransfer[];
  viewport: MoneyFlowViewport;
};

type LegacyV1V2Document = Omit<LegacyGraphDocument, "transfers"> & {
  id?: string;
  userId?: UserId;
  version: 1 | 2;
  currency: "CAD";
  scenario: { name: string; startingBalanceCents: number };
  transfers: Array<{
    id: string;
    sourceNodeId: string;
    targetNodeId: string;
    monthlyAmountCents: number;
    label?: string;
  }>;
};

type LegacyV3Document = LegacyGraphDocument & {
  id: string;
  userId: UserId;
  version: 3;
  currency: "CAD";
  scenario: {
    name: string;
    startMonth: YearMonth;
    openingBalanceCents: number;
    forecastMonthCount: number;
  };
  view: { selectedMonth: YearMonth; mode: MoneyFlowViewMode };
};

type PartialV4Account = {
  id: string;
  nodeId: string;
  institution: string;
  name: string;
  openingBalanceCents: number;
};

type PartialSharedV4Document = LegacyGraphDocument & {
  id: string;
  userId: UserId;
  version: 4;
  currency: "CAD";
  scenario: MoneyFlowDocument["scenario"];
  accounts: PartialV4Account[];
  view: MoneyFlowDocument["view"];
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

  const migrated = migrateStoredDocument(scopedDocument, userId);
  if (migrated) {
    saveMoneyFlow(userId, migrated);
    return migrated;
  }

  const unscopedDocument = readStoredDocument(LEGACY_STORAGE_KEY);
  const migratedUnscoped = migrateStoredDocument(unscopedDocument, userId);
  if (migratedUnscoped) {
    saveMoneyFlow(userId, migratedUnscoped);
    window.localStorage.removeItem(LEGACY_STORAGE_KEY);
    return migratedUnscoped;
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

function migrateStoredDocument(value: unknown, userId: UserId) {
  if (isPartialSharedV4Document(value)) {
    return migratePartialV4Document(value, userId);
  }
  if (isLegacyV3Document(value)) {
    return migrateV3Document(value, userId);
  }
  if (isLegacyV1V2Document(value)) {
    return migrateV1V2Document(value, userId);
  }
  return null;
}

function migratePartialV4Document(
  legacy: PartialSharedV4Document,
  userId: UserId
): MoneyFlowDocument {
  const primaryAccount =
    legacy.accounts.find((account) => account.id === "account-scotiabank") ??
    legacy.accounts[0];
  const primaryNode =
    legacy.nodes.find((node) => node.id === primaryAccount?.nodeId) ??
    legacy.nodes.find((node) => node.kind === "chequing");
  const centerNode = primaryNode ?? createFallbackCenterNode();
  const otherAccountNodeIds = new Set(
    legacy.accounts
      .filter((account) => account.id !== primaryAccount?.id)
      .map((account) => account.nodeId)
  );
  const nodes = legacy.nodes
    .filter((node) => !otherAccountNodeIds.has(node.id))
    .map((node) =>
      node.id === centerNode.id ? { ...node, label: "Chequing" } : node
    );
  if (!nodes.some((node) => node.id === centerNode.id)) {
    nodes.push(centerNode);
  }

  const scotiabank: MoneyFlowAccountWorkspace = {
    id: primaryAccount?.id ?? "account-scotiabank",
    institution: primaryAccount?.institution ?? "Scotiabank",
    name: primaryAccount?.name ?? "Scotiabank Chequing",
    accountType: "chequing",
    openingBalanceCents: primaryAccount?.openingBalanceCents ?? 0,
    centerNodeId: centerNode.id,
    nodes,
    transfers: legacy.transfers.filter(
      (transfer) =>
        !otherAccountNodeIds.has(transfer.sourceNodeId) &&
        !otherAccountNodeIds.has(transfer.targetNodeId)
    ),
    viewport: legacy.viewport,
  };
  const cibc = createCibcWorkspace(legacy.scenario.startMonth);

  return {
    id: legacy.id,
    userId,
    version: MONEY_FLOW_DOCUMENT_VERSION,
    currency: legacy.currency,
    scenario: legacy.scenario,
    accounts: [scotiabank, cibc],
    view: {
      ...legacy.view,
      selectedAccountId:
        legacy.view.selectedAccountId === cibc.id ? cibc.id : scotiabank.id,
    },
  };
}

function migrateV3Document(
  legacy: LegacyV3Document,
  userId: UserId
): MoneyFlowDocument {
  const existingCenter = legacy.nodes.find((node) => node.kind === "chequing");
  const centerNode = existingCenter ?? createFallbackCenterNode();
  const nodes = legacy.nodes.map((node) =>
    node.id === centerNode.id ? { ...node, label: "Chequing" } : node
  );
  if (!existingCenter) nodes.push(centerNode);

  const scotiabank: MoneyFlowAccountWorkspace = {
    id: "account-scotiabank",
    institution: "Scotiabank",
    name: "Scotiabank Chequing",
    accountType: "chequing",
    openingBalanceCents: legacy.scenario.openingBalanceCents,
    centerNodeId: centerNode.id,
    nodes,
    transfers: legacy.transfers,
    viewport: legacy.viewport,
  };

  return {
    id: legacy.id,
    userId,
    version: MONEY_FLOW_DOCUMENT_VERSION,
    currency: legacy.currency,
    scenario: {
      name: legacy.scenario.name,
      startMonth: legacy.scenario.startMonth,
      forecastMonthCount: legacy.scenario.forecastMonthCount,
    },
    accounts: [scotiabank, createCibcWorkspace(legacy.scenario.startMonth)],
    view: {
      ...legacy.view,
      selectedAccountId: scotiabank.id,
    },
  };
}

function migrateV1V2Document(
  legacy: LegacyV1V2Document,
  userId: UserId
): MoneyFlowDocument {
  const startMonth = currentYearMonth();
  return migrateV3Document(
    {
      id: legacy.id ?? `money-flow-monthly-baseline:${userId}`,
      userId,
      version: 3,
      currency: legacy.currency,
      scenario: {
        name: legacy.scenario.name,
        startMonth,
        openingBalanceCents: legacy.scenario.startingBalanceCents,
        forecastMonthCount: 12,
      },
      view: { selectedMonth: startMonth, mode: "canvas" },
      nodes: legacy.nodes,
      transfers: legacy.transfers.map((transfer) => ({
        id: transfer.id,
        sourceNodeId: transfer.sourceNodeId,
        targetNodeId: transfer.targetNodeId,
        baseMonthlyAmountCents: transfer.monthlyAmountCents,
        startMonth,
        label: transfer.label,
      })),
      viewport: legacy.viewport,
    },
    userId
  );
}

function createFallbackCenterNode(): MoneyFlowNode {
  return {
    id: "scotia-chequing",
    kind: "chequing",
    label: "Chequing",
    position: { x: 520, y: 220 },
    note: "Primary chequing account",
  };
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

function isMoneyFlowDocument(
  value: unknown,
  userId: UserId
): value is MoneyFlowDocument {
  if (!value || typeof value !== "object") return false;
  const document = value as Partial<MoneyFlowDocument>;
  return (
    document.version === MONEY_FLOW_DOCUMENT_VERSION &&
    document.currency === "CAD" &&
    document.userId === userId &&
    Array.isArray(document.accounts) &&
    document.accounts.length > 0 &&
    document.accounts.every(isAccountWorkspace) &&
    typeof document.view?.selectedAccountId === "string" &&
    isYearMonth(document.view.selectedMonth)
  );
}

function isAccountWorkspace(value: unknown): value is MoneyFlowAccountWorkspace {
  if (!value || typeof value !== "object") return false;
  const account = value as Partial<MoneyFlowAccountWorkspace>;
  return (
    typeof account.id === "string" &&
    typeof account.centerNodeId === "string" &&
    typeof account.openingBalanceCents === "number" &&
    Array.isArray(account.nodes) &&
    Array.isArray(account.transfers) &&
    typeof account.viewport?.zoom === "number"
  );
}

function isPartialSharedV4Document(
  value: unknown
): value is PartialSharedV4Document {
  if (!hasLegacyGraphShape(value)) return false;
  const document = value as Partial<PartialSharedV4Document>;
  return (
    document.version === 4 &&
    Array.isArray(document.accounts) &&
    document.accounts.some(
      (account) =>
        account &&
        typeof account === "object" &&
        typeof (account as Partial<PartialV4Account>).nodeId === "string"
    ) &&
    typeof document.scenario?.startMonth === "string"
  );
}

function isLegacyV3Document(value: unknown): value is LegacyV3Document {
  if (!hasLegacyGraphShape(value)) return false;
  const document = value as Partial<LegacyV3Document>;
  return (
    document.version === 3 &&
    typeof document.scenario?.openingBalanceCents === "number" &&
    isYearMonth(document.view?.selectedMonth)
  );
}

function isLegacyV1V2Document(
  value: unknown
): value is LegacyV1V2Document {
  if (!hasLegacyGraphShape(value)) return false;
  const document = value as Partial<LegacyV1V2Document>;
  return (
    (document.version === 1 || document.version === 2) &&
    typeof document.scenario?.startingBalanceCents === "number"
  );
}

function hasLegacyGraphShape(value: unknown) {
  if (!value || typeof value !== "object") return false;
  const document = value as Partial<LegacyGraphDocument> & { currency?: string };
  return (
    document.currency === "CAD" &&
    Array.isArray(document.nodes) &&
    Array.isArray(document.transfers) &&
    typeof document.viewport?.zoom === "number"
  );
}

function isYearMonth(value: unknown): value is YearMonth {
  return typeof value === "string" && /^\d{4}-\d{2}$/.test(value);
}
