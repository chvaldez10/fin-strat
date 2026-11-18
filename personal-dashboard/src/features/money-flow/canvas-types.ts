import type { Edge, Node } from "@xyflow/react";
import type { MoneyNodeKind } from "./types";

export type CanvasElementKind = Exclude<MoneyNodeKind, "note">;

type MoneyCanvasNodeData = Record<string, unknown> & {
  kind: CanvasElementKind;
  variant?: "credit-card" | "debit-account";
  label: string;
  caption?: string;
  amountCaption?: string;
  showOutput?: boolean;
  note?: string;
  monthlyAmountCents?: number;
};

export type MoneyCanvasNode = Node<MoneyCanvasNodeData, CanvasElementKind>;

export type CanvasPositions = Record<string, { x: number; y: number }>;

export type PlannerEdge = Edge<
  { amount: number | null; kind: CanvasElementKind; hideLabel?: boolean },
  "planner"
>;

export type CanvasProjection = {
  nodes: MoneyCanvasNode[];
  edges: PlannerEdge[];
};
