import type { MoneyFlowDocument, MoneyFlowTransfer } from "./types";

type TransferChanges = Pick<
  MoneyFlowTransfer,
  | "baseMonthlyAmountCents"
  | "startMonth"
  | "endMonth"
  | "monthOverrides"
  | "label"
>;

/** Update both sides of a linked account transfer; keep each side's own label. */
export function updateTransfer(
  document: MoneyFlowDocument,
  accountId: string,
  transferId: string,
  changes: TransferChanges
): MoneyFlowDocument {
  const source = document.accounts
    .find((account) => account.id === accountId)
    ?.transfers.find((transfer) => transfer.id === transferId);
  if (!source) return document;
  const { label, ...financialChanges } = changes;
  return {
    ...document,
    accounts: document.accounts.map((account) => ({
      ...account,
      transfers: account.transfers.map((transfer) => {
        if (account.id === accountId && transfer.id === transferId)
          return { ...transfer, ...financialChanges, label };
        if (isCounterparty(source, accountId, transfer, account.id))
          return { ...transfer, ...financialChanges };
        return transfer;
      }),
    })),
  };
}

/** Remove linked counterparts as part of the same local document mutation. */
export function removeTransfers(
  document: MoneyFlowDocument,
  accountId: string,
  transferIds: readonly string[]
): MoneyFlowDocument {
  const ids = new Set(transferIds);
  const removed =
    document.accounts
      .find((account) => account.id === accountId)
      ?.transfers.filter((transfer) => ids.has(transfer.id)) ?? [];
  return {
    ...document,
    accounts: document.accounts.map((account) => ({
      ...account,
      transfers: account.transfers.filter(
        (transfer) =>
          !(account.id === accountId && ids.has(transfer.id)) &&
          !removed.some((source) =>
            isCounterparty(source, accountId, transfer, account.id)
          )
      ),
    })),
  };
}

function isCounterparty(
  source: MoneyFlowTransfer,
  sourceAccountId: string,
  target: MoneyFlowTransfer,
  targetAccountId: string
) {
  return (
    !!source.linkedTransferId &&
    source.counterpartyAccountId === targetAccountId &&
    target.linkedTransferId === source.linkedTransferId &&
    target.counterpartyAccountId === sourceAccountId
  );
}
