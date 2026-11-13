import type { Node } from "@xyflow/react";
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
