import type {
  MoneyFlowDocument,
  MoneyFlowNode,
  MoneyFlowTransfer,
} from "./types";

export type ConnectionCandidate = Pick<
  MoneyFlowTransfer,
  "sourceNodeId" | "targetNodeId"
>;

export type ConnectionValidation =
  | { valid: true }
  | { valid: false; reason: string };

export function validateConnection(
  document: MoneyFlowDocument,
  candidate: ConnectionCandidate
): ConnectionValidation {
  if (candidate.sourceNodeId === candidate.targetNodeId) {
    return { valid: false, reason: "A box cannot connect to itself." };
  }

  const source = findNode(document.nodes, candidate.sourceNodeId);
  const target = findNode(document.nodes, candidate.targetNodeId);

  if (!source || !target) {
    return { valid: false, reason: "Both boxes must exist." };
  }

  if (source.kind === "note" || target.kind === "note") {
    return { valid: false, reason: "Notes cannot carry money." };
  }

  if (source.kind === "expense") {
    return { valid: false, reason: "Expenses cannot send money." };
  }

  if (target.kind === "income") {
    return { valid: false, reason: "Income boxes cannot receive money." };
  }

  if (
    document.transfers.some(
      (transfer) =>
        transfer.sourceNodeId === candidate.sourceNodeId &&
        transfer.targetNodeId === candidate.targetNodeId
    )
  ) {
    return {
      valid: false,
      reason: "A money flow already exists between these boxes.",
    };
  }

  return { valid: true };
}

function findNode(nodes: MoneyFlowNode[], id: string) {
  return nodes.find((node) => node.id === id);
}
