import type {
  MoneyFlowDocument,
  MoneyFlowTotals,
  MoneyFlowTransfer,
} from "./types";

export function calculateMoneyFlowTotals(
  document: MoneyFlowDocument
): MoneyFlowTotals {
  const chequingNode = document.nodes.find(
    (node) => node.kind === "chequing"
  );

  if (!chequingNode) {
    return {
      startingBalanceCents: document.scenario.startingBalanceCents,
      monthlyInflowCents: 0,
      monthlyOutflowCents: 0,
      projectedBalanceCents: document.scenario.startingBalanceCents,
    };
  }

  const monthlyInflowCents = sumTransfers(
    document.transfers.filter(
      (transfer) => transfer.targetNodeId === chequingNode.id
    )
  );
  const monthlyOutflowCents = sumTransfers(
    document.transfers.filter(
      (transfer) => transfer.sourceNodeId === chequingNode.id
    )
  );

  return {
    startingBalanceCents: document.scenario.startingBalanceCents,
    monthlyInflowCents,
    monthlyOutflowCents,
    projectedBalanceCents:
      document.scenario.startingBalanceCents +
      monthlyInflowCents -
      monthlyOutflowCents,
  };
}

function sumTransfers(transfers: MoneyFlowTransfer[]) {
  return transfers.reduce(
    (total, transfer) => total + transfer.monthlyAmountCents,
    0
  );
}

export function formatMoney(
  cents: number,
  currency: MoneyFlowDocument["currency"] = "CAD"
) {
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(cents / 100);
}
