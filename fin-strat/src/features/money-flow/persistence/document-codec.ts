import type { UserId } from "@/features/auth/types";
import {
  createCibcWorkspace,
  createDemoMoneyFlowDocument,
} from "../mock-data";
import { currentYearMonth } from "../months";
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
  if (isMoneyFlowDocument(value, userId)) {
    return repairZeroedDemoTransfers(value, userId);
  }
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

function repairZeroedDemoTransfers(
  document: MoneyFlowDocument,
  userId: UserId
): MoneyFlowDocument {
  const demo = createDemoMoneyFlowDocument(userId);
  let repaired = false;
  const accounts = document.accounts.map((account) => {
    const demoAccount = demo.accounts.find((item) => item.id === account.id);
    if (!demoAccount) return account;

    const demoTransferById = new Map(
      demoAccount.transfers.map((transfer) => [transfer.id, transfer])
    );
    const recognizedTransfers = account.transfers.filter((transfer) =>
      demoTransferById.has(transfer.id)
    );
    const wasSimultaneouslyZeroed =
      recognizedTransfers.length >= 2 &&
      recognizedTransfers.every(
        (transfer) => transfer.baseMonthlyAmountCents === 0
      );

    if (!wasSimultaneouslyZeroed) return account;
    repaired = true;
    return {
      ...account,
      transfers: account.transfers.map((transfer) => {
        const demoTransfer = demoTransferById.get(transfer.id);
        return demoTransfer
          ? {
              ...transfer,
              baseMonthlyAmountCents: demoTransfer.baseMonthlyAmountCents,
            }
          : transfer;
      }),
    };
  });

  return repaired ? { ...document, accounts } : document;
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
    document.version === MONEY_FLOW_DOCUMENT_VERSION &&
    document.currency === "CAD" &&
    document.userId === userId &&
    Array.isArray(document.accounts) &&
    document.accounts.length > 0 &&
    document.accounts.every(isAccountWorkspace) &&
    typeof document.scenario?.name === "string" &&
    isYearMonth(document.scenario.startMonth) &&
    Number.isInteger(document.scenario.forecastMonthCount) &&
    document.scenario.forecastMonthCount > 0 &&
    typeof document.view?.selectedAccountId === "string" &&
    document.accounts.some(
      (account) => account.id === document.view?.selectedAccountId
    ) &&
    isYearMonth(document.view.selectedMonth) &&
    (document.view.mode === "canvas" || document.view.mode === "table")
  );
}

function isAccountWorkspace(value: unknown): value is MoneyFlowAccountWorkspace {
  if (!value || typeof value !== "object") return false;
  const account = value as Partial<MoneyFlowAccountWorkspace>;
  const nodes = Array.isArray(account.nodes) ? account.nodes : [];
  const nodeIds = new Set(nodes.map((node) => node.id));
  return (
    typeof account.id === "string" &&
    typeof account.institution === "string" &&
    typeof account.name === "string" &&
    (account.accountType === "chequing" || account.accountType === "savings") &&
    typeof account.centerNodeId === "string" &&
    Number.isFinite(account.openingBalanceCents) &&
    nodes.every(isMoneyFlowNode) &&
    nodeIds.has(account.centerNodeId) &&
    Array.isArray(account.transfers) &&
    account.transfers.every(
      (transfer) =>
        isMoneyFlowTransfer(transfer) &&
        nodeIds.has(transfer.sourceNodeId) &&
        nodeIds.has(transfer.targetNodeId)
    ) &&
    Number.isFinite(account.viewport?.x) &&
    Number.isFinite(account.viewport?.y) &&
    Number.isFinite(account.viewport?.zoom)
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
    Number.isFinite(node.position?.y)
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
          isYearMonth(month) && (amount === null || Number.isFinite(amount))
      ));
  return (
    typeof transfer.id === "string" &&
    typeof transfer.sourceNodeId === "string" &&
    typeof transfer.targetNodeId === "string" &&
    Number.isFinite(transfer.baseMonthlyAmountCents) &&
    isYearMonth(transfer.startMonth) &&
    (transfer.endMonth === undefined || isYearMonth(transfer.endMonth)) &&
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
  if (typeof value !== "string" || !/^\d{4}-\d{2}$/.test(value)) return false;
  const month = Number(value.slice(5));
  return month >= 1 && month <= 12;
}
