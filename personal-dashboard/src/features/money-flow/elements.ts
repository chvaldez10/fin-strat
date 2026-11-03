import type { MoneyFlowAccountWorkspace, MoneyNodeKind } from "./types";

export type FlowElementKind = Exclude<MoneyNodeKind, "chequing" | "note">;

export function isFlowElement(kind: MoneyNodeKind): kind is FlowElementKind {
  return kind === "income" || kind === "expense" || kind === "account";
}

/** One consistent primary connection for the card, inspector, and edit command. */
export function getElementConnections(
  account: MoneyFlowAccountWorkspace,
  elementId: string
) {
  const element = account.nodes.find((item) => item.id === elementId);
  const connections = account.transfers.filter(
    (item) => item.sourceNodeId === elementId || item.targetNodeId === elementId
  );
  const primary =
    element && isFlowElement(element.kind)
      ? (connections.find((item) =>
          element.kind === "income"
            ? item.sourceNodeId === elementId &&
              item.targetNodeId === account.centerNodeId
            : item.sourceNodeId === account.centerNodeId &&
              item.targetNodeId === elementId
        ) ?? connections[0])
      : undefined;
  return {
    primary,
    additional: connections.filter((item) => item.id !== primary?.id),
    count: connections.length,
  };
}
