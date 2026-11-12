import type { Payment, PaymentKind } from "./types";

export type ActivityKind = PaymentKind | "refund";
export type CategoryKind = "expense" | "savings";
export type ActivityCategory = { id: string; name: string; kind: CategoryKind };

export const ACTIVITY_LABELS = {
  expense: "Expense",
  income: "Income",
  savings: "Savings contribution",
  transfer: "Bank transfer",
  cardPayment: "Credit card repayment",
  refund: "Refund",
} as const satisfies Record<ActivityKind, string>;

export const DEFAULT_CATEGORIES: readonly ActivityCategory[] = [
  { id: "giving", name: "Giving & tithes", kind: "expense" },
  { id: "groceries", name: "Groceries", kind: "expense" },
  { id: "dining", name: "Eating out", kind: "expense" },
  { id: "household", name: "Household bills", kind: "expense" },
  { id: "subscriptions", name: "Subscriptions", kind: "expense" },
  { id: "transport", name: "Transportation", kind: "expense" },
  { id: "shopping", name: "Shopping", kind: "expense" },
  { id: "other-expense", name: "Other spending", kind: "expense" },
  { id: "tfsa", name: "TFSA", kind: "savings" },
  { id: "other-savings", name: "Other savings", kind: "savings" },
];

export type ActivityValues = {
  description: string;
  date: string;
  kind: ActivityKind;
  amountCents: number;
  accountId: string;
  destinationId: string | null;
  categoryId: string | null;
  eTransfer: boolean;
};

export function categoryKind(kind: ActivityKind): CategoryKind | null {
  if (kind === "refund") return "expense";
  return kind === "expense" || kind === "savings" ? kind : null;
}

export type StatementRow = {
  accountId: string;
  date: string;
  amountCents: number;
  direction: "in" | "out";
};

export function matchesScheduledActivity(
  planned: Pick<Payment, "kind" | "accountId" | "counterpartyId">,
  entry: Pick<ActivityValues, "kind" | "accountId" | "destinationId">
) {
  return (
    planned.kind === entry.kind &&
    (planned.accountId === null || planned.accountId === entry.accountId) &&
    (planned.counterpartyId === null ||
      planned.counterpartyId === entry.destinationId)
  );
}

/** A transfer can be matched to a posted row on either of its accounts. */
export function matchesStatement(entry: ActivityValues, row: StatementRow) {
  if (entry.amountCents !== row.amountCents || entry.date !== row.date)
    return false;
  if (entry.accountId === row.accountId)
    return (
      row.direction ===
      (entry.kind === "income" || entry.kind === "refund" ? "in" : "out")
    );
  return entry.destinationId === row.accountId && row.direction === "in";
}

export function summarizeActivity(
  entries: readonly ActivityValues[],
  categories: readonly ActivityCategory[],
  allocations: Readonly<Record<string, number>>,
  spendingLimitCents: number | null
) {
  let income = 0,
    spent = 0,
    saved = 0;
  const amounts = new Map<string, number>();
  for (const entry of entries) {
    if (entry.kind === "income") income += entry.amountCents;
    if (entry.kind === "savings") saved += entry.amountCents;
    if (entry.kind === "expense") spent += entry.amountCents;
    if (entry.kind === "refund") spent -= entry.amountCents;
    if (entry.categoryId) {
      const signed =
        entry.kind === "refund" ? -entry.amountCents : entry.amountCents;
      amounts.set(
        entry.categoryId,
        (amounts.get(entry.categoryId) ?? 0) + signed
      );
    }
  }
  const buckets = categories.map((category) => {
    const actual = amounts.get(category.id) ?? 0;
    const planned = allocations[category.id] ?? null;
    return {
      ...category,
      actual,
      planned,
      hasActivity: amounts.has(category.id),
    };
  });
  const earmarked = buckets.reduce(
    (total, bucket) =>
      total + Math.max(0, (bucket.planned ?? 0) - Math.max(0, bucket.actual)),
    0
  );
  const used = spent + saved;
  const net = income - used;
  return {
    income,
    spent,
    saved,
    earmarked,
    buckets,
    used,
    net,
    unallocated: net - earmarked,
    limitRemaining:
      spendingLimitCents === null ? null : spendingLimitCents - spent,
  };
}
