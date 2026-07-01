import type { UserId } from "@/features/auth/types";

export const MONEY_FLOW_DOCUMENT_VERSION = 4 as const;

export type MoneyFlowCurrency = "CAD";
export type YearMonth = `${number}-${number}`;
export type MoneyFlowViewMode = "canvas" | "table";

export type MoneyNodeKind =
  | "chequing"
  | "income"
  | "expense"
  | "account"
  | "note";

export type MoneyFlowPosition = {
  x: number;
  y: number;
};

export type MoneyFlowViewport = {
  x: number;
  y: number;
  zoom: number;
};

export type MoneyFlowNode = {
  id: string;
  kind: MoneyNodeKind;
  label: string;
  position: MoneyFlowPosition;
  note?: string;
};

export type MoneyFlowTransfer = {
  id: string;
  linkedTransferId?: string;
  counterpartyAccountId?: string;
  sourceNodeId: string;
  targetNodeId: string;
  baseMonthlyAmountCents: number;
  startMonth: YearMonth;
  endMonth?: YearMonth;
  monthOverrides?: Partial<Record<YearMonth, number | null>>;
  label?: string;
};

export type MoneyFlowScenario = {
  name: string;
  startMonth: YearMonth;
  forecastMonthCount: number;
};

export type MoneyFlowAccountWorkspace = {
  id: string;
  institution: string;
  name: string;
  accountType: "chequing" | "savings";
  openingBalanceCents: number;
  centerNodeId: string;
  nodes: MoneyFlowNode[];
  transfers: MoneyFlowTransfer[];
  viewport: MoneyFlowViewport;
};

export type MoneyFlowView = {
  selectedMonth: YearMonth;
  selectedAccountId: string;
  mode: MoneyFlowViewMode;
};

export type MoneyFlowDocument = {
  id: string;
  userId: UserId;
  version: typeof MONEY_FLOW_DOCUMENT_VERSION;
  currency: MoneyFlowCurrency;
  scenario: MoneyFlowScenario;
  accounts: MoneyFlowAccountWorkspace[];
  view: MoneyFlowView;
};

export type MoneyFlowTotals = {
  month: YearMonth;
  startingBalanceCents: number;
  monthlyInflowCents: number;
  monthlyOutflowCents: number;
  projectedBalanceCents: number;
};

export type MoneyFlowMonthResult = MoneyFlowTotals & {
  transferAmounts: Record<string, number>;
};

export type MoneyFlowRepository = {
  userId: UserId;
  load: () => MoneyFlowDocument;
  save: (document: MoneyFlowDocument) => void;
  reset: () => MoneyFlowDocument;
};
