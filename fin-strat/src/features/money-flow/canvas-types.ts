import type { Edge, Node, Viewport } from "@xyflow/react";
import type {
  MoneyFlowDocument,
  MoneyFlowNode,
  MoneyFlowTotals,
  MoneyFlowTransfer,
  MoneyNodeKind,
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
  label?: string;
};

export type MoneyCanvasNode = Node<MoneyCanvasNodeData, MoneyNodeKind>;
export type MoneyCanvasEdge = Edge<MoneyCanvasEdgeData, "money">;

export function toCanvasNodes(
  nodes: MoneyFlowNode[],
  totals?: MoneyFlowTotals
): MoneyCanvasNode[] {
  return nodes.map((node) => ({
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
  }));
}

export function toCanvasEdges(
  transfers: MoneyFlowTransfer[]
): MoneyCanvasEdge[] {
  return transfers.map((transfer) => ({
    id: transfer.id,
    type: "money",
    source: transfer.sourceNodeId,
    target: transfer.targetNodeId,
    data: {
      monthlyAmountCents: transfer.monthlyAmountCents,
      label: transfer.label,
    },
  }));
}

export function toMoneyFlowDocument(
  document: MoneyFlowDocument,
  nodes: MoneyCanvasNode[],
  edges: MoneyCanvasEdge[],
  viewport: Viewport
): MoneyFlowDocument {
  return {
    ...document,
    nodes: nodes.map((node) => ({
      id: node.id,
      kind: node.data.kind,
      label: node.data.label,
      position: node.position,
      note: node.data.note,
    })),
    transfers: edges.map((edge) => ({
      id: edge.id,
      sourceNodeId: edge.source,
      targetNodeId: edge.target,
      monthlyAmountCents: edge.data?.monthlyAmountCents ?? 0,
      label: edge.data?.label,
    })),
    viewport,
  };
}
