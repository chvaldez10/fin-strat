import type { FinancialAccount, Payment } from "./types";

export function isCashCommitment(
  item: Pick<Payment, "kind" | "accountId">,
  accounts: FinancialAccount[]
) {
  return (
    item.kind !== "transfer" &&
    accounts.find((a) => a.id === item.accountId)?.kind !== "credit"
  );
}

export function plannerTotals(
  items: Payment[],
  accounts: FinancialAccount[],
  month: string,
  carryInCents: number | null,
  settlements: Payment[] = items
) {
  const active = items.filter(
    (item) => item.status !== "skipped" && isCashCommitment(item, accounts)
  );
  const income = active.filter(
    (item) => item.kind === "income" && item.month === month
  );
  const commitments = active.filter((item) => item.kind !== "income");
  const sum = (rows: Payment[]) =>
    rows.reduce((value, item) => value + (item.amountCents ?? 0), 0);
  const salary = sum(income),
    savings = sum(commitments.filter((item) => item.kind === "savings")),
    expenses = sum(commitments.filter((item) => item.kind !== "savings"));
  return {
    salary,
    savings,
    expenses,
    remaining: salary - savings - expenses,
    available:
      carryInCents === null ? null : salary + carryInCents - savings - expenses,
    pending: sum(commitments.filter((item) => item.status === "pending")),
    unknown: active.filter((item) => item.amountCents === null).length,
    estimated: active.filter((item) => item.estimated).length,
    // A suggestion, never a reconciled bank balance: unpaid bills remain cash
    // earmarks in carry-out and are subtracted once in the following month.
    suggestedCarryOut:
      carryInCents === null
        ? null
        : carryInCents +
          salary -
          sum(
            settlements.filter(
              (item) =>
                item.status === "paid" &&
                item.paidOn?.slice(0, 7) === month &&
                item.kind !== "income" &&
                isCashCommitment(item, accounts)
            )
          ),
  };
}
