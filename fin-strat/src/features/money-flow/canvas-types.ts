import type { Edge, Node, Viewport } from "@xyflow/react";
import {
  getTransferAmountForMonth,
  isTransferActiveForMonth,
} from "./calculations";
import type {
  MoneyFlowDocument,
  MoneyFlowAccountWorkspace,
  MoneyFlowNode,
  MoneyFlowTotals,
  MoneyFlowTransfer,
  MoneyNodeKind,
  YearMonth,
} from "./types";

export type MoneyCanvasNodeData = Record<string, unknown> & {
  kind: MoneyNodeKind;
  label: string;
  note?: string;
  startingBalanceCents?: number;
  projectedBalanceCents?: number;
};

export type MoneyCanvasEdgeData = Record<string, unknown> & {
  monthlyAmountCents: number;
  baseMonthlyAmountCents: number;
  startMonth: YearMonth;
  endMonth?: YearMonth;
  monthOverrides?: Partial<Record<YearMonth, number | null>>;
  label?: string;
};

export type MoneyCanvasNode = Node<MoneyCanvasNodeData, MoneyNodeKind>;
export type MoneyCanvasEdge = Edge<MoneyCanvasEdgeData, "money">;

export function toCanvasNodes(
  nodes: MoneyFlowNode[],
  totalsByNode: Record<string, MoneyFlowTotals> = {}
): MoneyCanvasNode[] {
  return nodes.map((node) => {
    const totals = totalsByNode[node.id];

    return {
      id: node.id,
      type: node.kind,
      position: node.position,
      deletable: node.kind !== "chequing",
      data: {
        kind: node.kind,
        label: node.label,
        note: node.note,
        startingBalanceCents:
          node.kind === "chequing" ? totals?.startingBalanceCents : undefined,
        projectedBalanceCents:
          node.kind === "chequing" ? totals?.projectedBalanceCents : undefined,
      },
    };
  });
}

export function toCanvasEdges(
  transfers: MoneyFlowTransfer[],
  month: YearMonth
): MoneyCanvasEdge[] {
  return transfers
    .map((transfer) => ({
      id: transfer.id,
      type: "money",
      source: transfer.sourceNodeId,
      target: transfer.targetNodeId,
      hidden: !isTransferActiveForMonth(transfer, month),
      data: {
        monthlyAmountCents: getTransferAmountForMonth(transfer, month),
        baseMonthlyAmountCents: transfer.baseMonthlyAmountCents,
        startMonth: transfer.startMonth,
        endMonth: transfer.endMonth,
        monthOverrides: transfer.monthOverrides,
        label: transfer.label,
      },
    }));
}

export function updateAccountWorkspaceFromCanvas(
  document: MoneyFlowDocument,
  accountId: string,
  nodes: MoneyCanvasNode[],
  edges: MoneyCanvasEdge[],
  viewport: Viewport
): MoneyFlowDocument {
  return {
    ...document,
    accounts: document.accounts.map((account) =>
      account.id === accountId
        ? {
            ...account,
            nodes: nodes.map((node) => ({
              id: node.id,
              kind: node.data.kind,
              label: node.data.label,
              position: node.position,
              note: node.data.note,
            })),
            transfers: edges.map((edge) => {
              const existing = account.transfers.find(
                (transfer) => transfer.id === edge.id
              );

              return {
                id: edge.id,
                linkedTransferId: existing?.linkedTransferId,
                counterpartyAccountId: existing?.counterpartyAccountId,
                sourceNodeId: edge.source,
                targetNodeId: edge.target,
                baseMonthlyAmountCents:
                  edge.data?.baseMonthlyAmountCents ??
                  existing?.baseMonthlyAmountCents ??
                  0,
                startMonth:
                  edge.data?.startMonth ??
                  existing?.startMonth ??
                  document.scenario.startMonth,
                endMonth: edge.data?.endMonth ?? existing?.endMonth,
                monthOverrides:
                  edge.data?.monthOverrides ?? existing?.monthOverrides,
                label: edge.data?.label ?? existing?.label,
              };
            }),
            viewport,
          }
        : account
    ),
  };
}

export function totalsForCenterNode(
  account: MoneyFlowAccountWorkspace,
  totals: MoneyFlowTotals
) {
  return { [account.centerNodeId]: totals };
}
