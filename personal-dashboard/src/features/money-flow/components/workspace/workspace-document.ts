import { calculateMoneyFlowTotals } from "../../calculations";
import { toCanvasNodes, totalsForCenterNode } from "../../canvas-types";
import type {
  MoneyFlowAccountWorkspace,
  MoneyFlowDocument,
  YearMonth,
} from "../../types";

export function getAccountWorkspace(
  document: MoneyFlowDocument,
  accountId = document.view.selectedAccountId
): MoneyFlowAccountWorkspace {
  return (
    document.accounts.find((account) => account.id === accountId) ??
    document.accounts[0]
  );
}

export function getCanvasNodes(
  document: MoneyFlowDocument,
  accountId: string,
  month: YearMonth
) {
  const account = getAccountWorkspace(document, accountId);
  const totals = calculateMoneyFlowTotals(document, month, account.id);
  return toCanvasNodes(account.nodes, totalsForCenterNode(account, totals));
}
