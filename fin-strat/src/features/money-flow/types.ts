import type { UserId } from "@/features/auth/types";

export const MONEY_FLOW_DOCUMENT_VERSION = 2 as const;

export type MoneyFlowCurrency = "CAD";

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
  sourceNodeId: string;
  targetNodeId: string;
  monthlyAmountCents: number;
  label?: string;
};

export type MoneyFlowScenario = {
  name: string;
  startingBalanceCents: number;
};

export type MoneyFlowDocument = {
  id: string;
  userId: UserId;
  version: typeof MONEY_FLOW_DOCUMENT_VERSION;
  currency: MoneyFlowCurrency;
  scenario: MoneyFlowScenario;
  nodes: MoneyFlowNode[];
  transfers: MoneyFlowTransfer[];
  viewport: MoneyFlowViewport;
};

export type MoneyFlowTotals = {
  startingBalanceCents: number;
  monthlyInflowCents: number;
  monthlyOutflowCents: number;
  projectedBalanceCents: number;
};

export type MoneyFlowRepository = {
  userId: UserId;
  load: () => MoneyFlowDocument;
  save: (document: MoneyFlowDocument) => void;
  reset: () => MoneyFlowDocument;
};
