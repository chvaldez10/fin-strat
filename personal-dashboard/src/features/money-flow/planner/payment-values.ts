import type { Payment, PaymentValues } from "./types";

/** Older card payments display their payment month when no statement month was saved. */
export function editablePaymentValues(item: Payment): PaymentValues {
  return {
    name: item.name,
    kind: item.kind,
    isSubscription: item.isSubscription,
    amountCents: item.amountCents,
    estimated: item.estimated,
    accountId: item.accountId,
    counterpartyId: item.counterpartyId,
    notes: item.notes,
    dueDate: item.dueDate,
    statementMonth:
      item.kind === "cardPayment"
        ? (item.statementMonth ?? item.month)
        : item.statementMonth,
    statementAmountCents: item.statementAmountCents,
  };
}
