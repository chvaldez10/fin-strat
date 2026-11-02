import type { UserId } from "@/features/auth/types";
import { currentYearMonth, isYearMonth, monthsBetween } from "../months";
import {
  MONEY_FLOW_DOCUMENT_VERSION,
  type MoneyFlowAccountWorkspace,
  type MoneyFlowDocument,
  type MoneyFlowNode,
  type MoneyFlowTransfer,
  type MoneyFlowViewMode,
  type MoneyFlowViewport,
  type YearMonth,
} from "../types";

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

export function decodeStoredMoneyFlowDocument(
  value: unknown,
  userId: UserId
): MoneyFlowDocument | null {
  if (!value || typeof value !== "object") return null;
  const owner = (value as { userId?: unknown }).userId;
  if (owner !== undefined && owner !== userId) return null;

  if (isMoneyFlowDocument(value, userId)) {
    return value;
  }

  // Historical records have different shapes. Validate the migration result
  // before exposing it, and preserve malformed records for recovery.
  try {
    const migrated = isPartialSharedV4Document(value)
      ? migratePartialV4Document(value, userId)
      : isLegacyV3Document(value)
        ? migrateV3Document(value, userId)
        : isLegacyV1V2Document(value)
          ? migrateV1V2Document(value, userId)
          : null;
    return isMoneyFlowDocument(migrated, userId) ? migrated : null;
  } catch {
    return null;
  }
}

function migratePartialV4Document(
  legacy: PartialSharedV4Document,
  userId: UserId
): MoneyFlowDocument {
  const accounts: MoneyFlowAccountWorkspace[] = legacy.accounts.map(
    (account) => {
      const center = legacy.nodes.find((node) => node.id === account.nodeId);
      if (!center)
        throw new Error("A legacy account is missing its center node.");
      return {
        id: account.id,
        institution: account.institution,
        name: account.name,
        accountType: "chequing",
        openingBalanceCents: account.openingBalanceCents,
        centerNodeId: center.id,
        viewport: { ...legacy.viewport },
        // Older versions shared one graph. Retain that graph in each workspace
        // instead of dropping other accounts, disconnected notes, or transfers.
        nodes: legacy.nodes.map((node) => ({
          ...node,
          kind:
            node.id === center.id
              ? "chequing"
              : node.kind === "chequing"
                ? "account"
                : node.kind,
        })),
        transfers: legacy.transfers.map((transfer) => {
          const source = legacy.accounts.find(
            (item) => item.nodeId === transfer.sourceNodeId
          );
          const target = legacy.accounts.find(
            (item) => item.nodeId === transfer.targetNodeId
          );
          if (
            source &&
            target &&
            source.id !== target.id &&
            (source.id === account.id || target.id === account.id)
          ) {
            return {
              ...transfer,
              linkedTransferId: `legacy:${transfer.id}`,
              counterpartyAccountId:
                source.id === account.id ? target.id : source.id,
            };
          }
          const {
            linkedTransferId: _linked,
            counterpartyAccountId: _counterparty,
            ...independent
          } = transfer;
          return independent;
        }),
      };
    }
  );
  return {
    id: legacy.id,
    userId,
    version: MONEY_FLOW_DOCUMENT_VERSION,
    currency: legacy.currency,
    scenario: legacy.scenario,
    accounts,
    view: {
      ...legacy.view,
      selectedAccountId: accounts.some(
        (account) => account.id === legacy.view.selectedAccountId
      )
        ? legacy.view.selectedAccountId
        : accounts[0].id,
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
    accounts: [scotiabank],
    view: { ...legacy.view, selectedAccountId: scotiabank.id },
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

function isMoneyFlowDocument(
  value: unknown,
  userId: UserId
): value is MoneyFlowDocument {
  if (!value || typeof value !== "object") return false;
  const document = value as Partial<MoneyFlowDocument>;
  return (
    typeof document.id === "string" &&
    document.version === MONEY_FLOW_DOCUMENT_VERSION &&
    document.currency === "CAD" &&
    document.userId === userId &&
    Array.isArray(document.accounts) &&
    document.accounts.length > 0 &&
    document.accounts.every(isAccountWorkspace) &&
    new Set(document.accounts.map((account) => account.id)).size ===
      document.accounts.length &&
    typeof document.scenario?.name === "string" &&
    isYearMonth(document.scenario.startMonth) &&
    Number.isSafeInteger(document.scenario.forecastMonthCount) &&
    document.scenario.forecastMonthCount > 0 &&
    document.scenario.forecastMonthCount <= 1200 &&
    typeof document.view?.selectedAccountId === "string" &&
    document.accounts.some(
      (account) => account.id === document.view?.selectedAccountId
    ) &&
    isYearMonth(document.view.selectedMonth) &&
    monthsBetween(document.scenario.startMonth, document.view.selectedMonth) >=
      0 &&
    monthsBetween(document.scenario.startMonth, document.view.selectedMonth) <
      document.scenario.forecastMonthCount &&
    (document.view.mode === "canvas" || document.view.mode === "table")
  );
}

function isAccountWorkspace(
  value: unknown
): value is MoneyFlowAccountWorkspace {
  if (!value || typeof value !== "object") return false;
  const account = value as Partial<MoneyFlowAccountWorkspace>;
  const nodes = Array.isArray(account.nodes) ? account.nodes : [];
  if (!nodes.every(isMoneyFlowNode)) return false;
  const nodeIds = new Set(nodes.map((node) => node.id));
  return (
    typeof account.id === "string" &&
    typeof account.institution === "string" &&
    typeof account.name === "string" &&
    (account.accountType === "chequing" || account.accountType === "savings") &&
    typeof account.centerNodeId === "string" &&
    Number.isSafeInteger(account.openingBalanceCents) &&
    nodeIds.size === nodes.length &&
    nodeIds.has(account.centerNodeId) &&
    nodes.find((node) => node.id === account.centerNodeId)?.kind ===
      "chequing" &&
    Array.isArray(account.transfers) &&
    account.transfers.every(
      (transfer) =>
        isMoneyFlowTransfer(transfer) &&
        nodeIds.has(transfer.sourceNodeId) &&
        nodeIds.has(transfer.targetNodeId)
    ) &&
    new Set(account.transfers.map((transfer) => transfer.id)).size ===
      account.transfers.length &&
    Number.isFinite(account.viewport?.x) &&
    Number.isFinite(account.viewport?.y) &&
    Number.isFinite(account.viewport?.zoom) &&
    account.viewport!.zoom > 0
  );
}

function isMoneyFlowNode(value: unknown): value is MoneyFlowNode {
  if (!value || typeof value !== "object") return false;
  const node = value as Partial<MoneyFlowNode>;
  return (
    typeof node.id === "string" &&
    typeof node.label === "string" &&
    ["chequing", "income", "expense", "account", "note"].includes(
      node.kind ?? ""
    ) &&
    Number.isFinite(node.position?.x) &&
    Number.isFinite(node.position?.y) &&
    (node.note === undefined || typeof node.note === "string")
  );
}

function isMoneyFlowTransfer(value: unknown): value is MoneyFlowTransfer {
  if (!value || typeof value !== "object") return false;
  const transfer = value as Partial<MoneyFlowTransfer>;
  const overridesAreValid =
    transfer.monthOverrides === undefined ||
    (transfer.monthOverrides !== null &&
      typeof transfer.monthOverrides === "object" &&
      Object.entries(transfer.monthOverrides).every(
        ([month, amount]) =>
          isYearMonth(month) &&
          (amount === null ||
            (Number.isSafeInteger(amount) && (amount as number) >= 0))
      ));
  return (
    typeof transfer.id === "string" &&
    typeof transfer.sourceNodeId === "string" &&
    typeof transfer.targetNodeId === "string" &&
    Number.isSafeInteger(transfer.baseMonthlyAmountCents) &&
    transfer.baseMonthlyAmountCents! >= 0 &&
    isYearMonth(transfer.startMonth) &&
    (transfer.endMonth === undefined || isYearMonth(transfer.endMonth)) &&
    (transfer.endMonth === undefined ||
      monthsBetween(transfer.startMonth!, transfer.endMonth) >= 0) &&
    (transfer.label === undefined || typeof transfer.label === "string") &&
    overridesAreValid
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

function isLegacyV1V2Document(value: unknown): value is LegacyV1V2Document {
  if (!hasLegacyGraphShape(value)) return false;
  const document = value as Partial<LegacyV1V2Document>;
  return (
    (document.version === 1 || document.version === 2) &&
    typeof document.scenario?.startingBalanceCents === "number"
  );
}

function hasLegacyGraphShape(value: unknown) {
  if (!value || typeof value !== "object") return false;
  const document = value as Partial<LegacyGraphDocument> & {
    currency?: string;
  };
  return (
    document.currency === "CAD" &&
    Array.isArray(document.nodes) &&
    Array.isArray(document.transfers) &&
    typeof document.viewport?.zoom === "number"
  );
}
