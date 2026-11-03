import {
  calculateMoneyFlowTotals,
  getTransferAmountForMonth,
  isTransferActiveForMonth,
} from "../../calculations";
import { getElementConnections } from "../../elements";
import { toCanvasNodes, totalsForCenterNode } from "../../canvas-types";
import type {
  MoneyFlowAccountWorkspace,
  MoneyFlowDocument,
  MoneyFlowTotals,
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
  month: YearMonth,
  computedTotals?: MoneyFlowTotals
) {
  const account = getAccountWorkspace(document, accountId);
  const totals =
    computedTotals ?? calculateMoneyFlowTotals(document, month, account.id);
  return toCanvasNodes(account.nodes, totalsForCenterNode(account, totals)).map(
    (element) => {
      const { primary, count } = getElementConnections(account, element.id);
      return {
        ...element,
        data: {
          ...element.data,
          monthlyAmountCents: primary
            ? getTransferAmountForMonth(primary, month)
            : undefined,
          paymentDay: primary?.startDate
            ? Number(primary.startDate.slice(8, 10))
            : undefined,
          connectionCount: count,
          active: primary
            ? isTransferActiveForMonth(primary, month)
            : undefined,
        },
      };
    }
  );
}
