import type { MoneyCanvasNode } from "../canvas-types";
import { formatMoney } from "../calculations";
import {
  DEFAULT_CATEGORIES,
  type ActivityValues,
  type summarizeActivity,
} from "./activity";
import type { PlannerEdge } from "./components/planner-element-connection";
import type { ActivityEntry } from "./activity-data";
import { hiddenElementLayoutKey } from "./layout-visibility";
import type { PlannerLayoutValues } from "./use-planner-layout";
import type { FinancialAccount, Payment } from "./types";

export type ActivitySummary = ReturnType<typeof summarizeActivity>;
export type ActivityCanvasView = "overview" | "expenses" | "savings";
const defaultIds = new Set(DEFAULT_CATEGORIES.map((item) => item.id));

export type IncomeDisplay = {
  amountCents: number | null;
  label: string;
  detail?: string;
};

export type ExpenseAccount = {
  account: FinancialAccount;
  spent: number;
};

export const expenseAccountElementId = (id: string) => `expense-account-${id}`;
export const overviewCategoryId = (id: string) => `overview-category-${id}`;
export const breakdownCategoryId = (id: string) => `budget-${id}`;
export const breakdownCategoryPlacementKey = (id: string) =>
  `placed-category:${id}`;
export const incomeEntryElementId = (id: string) => `income-entry-${id}`;
export const incomePaymentElementId = (id: string) => `income-payment-${id}`;
export const recurringExpenseElementId = (seriesId: string) =>
  `recurring-expense-${seriesId}`;

export function groupRecurringExpenses(
  plans: readonly Payment[],
  recorded: ReadonlyMap<string, ActivityEntry>
) {
  const groups = new Map<string, Payment[]>();
  for (const plan of plans) {
    if (!plan.seriesId || plan.kind !== "expense" || plan.status === "skipped")
      continue;
    const group = groups.get(plan.seriesId);
    if (group) group.push(plan);
    else groups.set(plan.seriesId, [plan]);
  }
  return Array.from(groups, ([seriesId, payments]) => {
    const ordered = payments.toSorted((a, b) =>
      a.dueDate.localeCompare(b.dueDate)
    );
    const first = ordered[0];
    const pending = ordered.filter(
      (payment) => payment.status === "pending" && !recorded.has(payment._id)
    );
    const known = pending.filter((payment) => payment.amountCents !== null);
    const plannedCents = known.length
      ? known.reduce((total, payment) => total + (payment.amountCents ?? 0), 0)
      : undefined;
    const spent = ordered.reduce(
      (total, payment) => total + (recorded.get(payment._id)?.amountCents ?? 0),
      0
    );
    return {
      id: recurringExpenseElementId(seriesId),
      name: first.name,
      isSubscription: first.isSubscription,
      paymentIds: ordered.map((payment) => payment._id),
      pendingCount: pending.length,
      plannedCents,
      hasUnknownAmount: known.length < pending.length,
      estimated: known.some((payment) => payment.estimated),
      spent,
    };
  });
}

export function overviewCategoryPosition(
  kind: "expense" | "savings",
  positions: PlannerLayoutValues["positions"]
) {
  const group = kind === "expense" ? "overview-expenses" : "overview-savings";
  const origin = positions[group] ?? {
    x: 830,
    y: kind === "expense" ? 120 : 360,
  };
  const occupied = Object.entries(positions)
    .filter(
      ([id]) =>
        id === "center" ||
        id === "recorded-income" ||
        id.startsWith("income-") ||
        id.startsWith("overview-")
    )
    .map(([, position]) => position);
  let slot = 0;
  let position: { x: number; y: number };
  do {
    position = {
      x: origin.x + 340 + Math.floor(slot / 4) * 340,
      y: origin.y + (slot % 4) * 216,
    };
    slot++;
  } while (
    occupied.some(
      (point) =>
        Math.abs(point.x - position.x) < 270 &&
        Math.abs(point.y - position.y) < 185
    )
  );
  return position;
}

function categoryNode(
  id: string,
  bucket: ActivitySummary["buckets"][number],
  position: { x: number; y: number }
): MoneyCanvasNode {
  const kind = bucket.kind === "savings" ? "account" : "expense";
  return {
    id,
    type: kind,
    position,
    data: {
      kind,
      caption:
        bucket.kind === "savings" ? "Savings category" : "Spending category",
      label: bucket.name,
      monthlyAmountCents: bucket.actual,
      amountCaption: bucket.kind === "savings" ? "Contributed" : "Spent",
      note:
        bucket.kind === "savings" && bucket.planned !== null
          ? `${formatMoney(bucket.planned)} set aside`
          : undefined,
    },
  };
}

export function activityExpenseAccounts(
  accounts: FinancialAccount[],
  entries: readonly ActivityValues[]
): ExpenseAccount[] {
  const spending = new Map<string, number>();
  for (const entry of entries) {
    if (entry.kind !== "expense" && entry.kind !== "refund") continue;
    const signed =
      entry.kind === "refund" ? -entry.amountCents : entry.amountCents;
    spending.set(
      entry.accountId,
      (spending.get(entry.accountId) ?? 0) + signed
    );
  }
  return accounts
    .filter((account) => account.kind !== "savings" || spending.has(account.id))
    .map((account) => ({
      account,
      spent: spending.get(account.id) ?? 0,
    }));
}

export function visibleActivityBuckets(
  totals: ActivitySummary,
  view: ActivityCanvasView,
  positions: PlannerLayoutValues["positions"] = {}
) {
  if (view === "overview") return [];
  return totals.buckets.filter(
    (item) =>
      (view === "savings"
        ? item.kind === "savings"
        : item.kind === "expense") &&
      !positions[hiddenElementLayoutKey(breakdownCategoryId(item.id))] &&
      (item.hasActivity ||
        (item.kind === "savings" && item.planned !== null) ||
        positions[breakdownCategoryPlacementKey(item.id)] ||
        !defaultIds.has(item.id))
  );
}

export function displayActivityIncome(
  receivedCents: number,
  scheduled: readonly Pick<Payment, "amountCents" | "estimated">[]
): IncomeDisplay {
  if (!scheduled.length)
    return { amountCents: receivedCents, label: "Income received" };

  const known = scheduled.filter((payment) => payment.amountCents !== null);
  const amountCents = known.reduce(
    (sum, payment) => sum + (payment.amountCents ?? 0),
    0
  );
  const incomplete = known.length < scheduled.length;
  const estimated = known.some((payment) => payment.estimated);
  if (receivedCents === 0) {
    let label = "Scheduled income";
    if (incomplete && known.length) label = "Known scheduled income";
    else if (estimated) label = "Estimated scheduled income";
    return {
      amountCents: known.length ? amountCents : null,
      label,
      detail: "$0 received",
    };
  }

  const scheduledAmount = `${estimated ? "≈ " : ""}${formatMoney(amountCents)}`;
  return {
    amountCents: receivedCents,
    label: "Income received",
    detail: known.length
      ? `${scheduledAmount} still scheduled${incomplete ? " + unknown amounts" : ""}`
      : "Scheduled amount unknown",
  };
}

export function projectActivityCanvas({
  totals,
  receivedIncome,
  scheduledIncome,
  recurringExpenses,
  accounts,
  bank,
  view,
  positions,
}: Readonly<{
  totals: ActivitySummary;
  receivedIncome: readonly ActivityEntry[];
  scheduledIncome: readonly Payment[];
  recurringExpenses: ReturnType<typeof groupRecurringExpenses>;
  accounts: ExpenseAccount[];
  bank?: Pick<FinancialAccount, "name" | "balanceCents" | "balanceUpdatedAt">;
  view: ActivityCanvasView;
  positions: PlannerLayoutValues["positions"];
}>) {
  const overview = view === "overview";
  const centerId = overview ? "center" : `${view}-center`;
  const centerLabel = view === "expenses" ? "Expenses" : "Savings";
  const nodes: MoneyCanvasNode[] = [
    {
      id: centerId,
      type: "chequing",
      position: positions[centerId] ?? { x: 420, y: overview ? 240 : 115 },
      data: {
        kind: "chequing",
        caption: overview
          ? bank
            ? "Bank account"
            : "Monthly overview"
          : "This month",
        label: overview ? (bank?.name ?? "All accounts") : centerLabel,
        note: overview
          ? bank?.balanceUpdatedAt != null
            ? `${formatMoney(bank.balanceCents)} recorded balance`
            : undefined
          : view === "expenses"
            ? `${formatMoney(totals.spent)} recorded spending`
            : `${formatMoney(totals.saved)} recorded`,
      },
    },
  ];
  const edges: PlannerEdge[] = [];
  const connect = (
    id: string,
    kind: "income" | "expense" | "account",
    amount: number,
    source = centerId
  ) => {
    edges.push({
      id: `edge-${id}`,
      type: "planner",
      source: kind === "income" ? id : source,
      target: kind === "income" ? centerId : id,
      data: { kind, amount, hideLabel: true },
      selectable: false,
      focusable: false,
      reconnectable: false,
      deletable: false,
    });
  };

  if (overview) {
    const receipts = receivedIncome.map((entry) => ({
      id: incomeEntryElementId(entry._id),
      label: entry.description,
      amount: entry.amountCents,
      caption: "Income received",
      date: entry.date,
      previousPosition: entry.planId
        ? positions[incomePaymentElementId(entry.planId)]
        : undefined,
    }));
    const expected = scheduledIncome.map((payment) => ({
      id: incomePaymentElementId(payment._id),
      label: payment.name,
      amount: payment.amountCents,
      caption: payment.estimated ? "Estimated income" : "Scheduled income",
      date: payment.dueDate,
      previousPosition: undefined,
    }));
    const incomeCards = [...receipts, ...expected];
    const incomeOrigin = positions["recorded-income"] ?? { x: 30, y: 220 };
    const usedIncomePositions = incomeCards.flatMap(
      ({ id, previousPosition }) => {
        const position = positions[id] ?? previousPosition;
        return position ? [position] : [];
      }
    );
    let incomeSlot = 0;
    for (const card of incomeCards) {
      let position = positions[card.id] ?? card.previousPosition;
      if (!position) {
        do {
          const slot = incomeSlot++;
          position = {
            x: incomeOrigin.x - Math.floor(slot / 4) * 312,
            y: incomeOrigin.y + (slot % 4) * 192,
          };
        } while (
          usedIncomePositions.some(
            (point) =>
              Math.abs(point.x - position.x) < 260 &&
              Math.abs(point.y - position.y) < 175
          )
        );
        usedIncomePositions.push(position);
      }
      nodes.push({
        id: card.id,
        type: "income",
        position,
        data: {
          kind: "income",
          caption: card.caption,
          label: card.label,
          monthlyAmountCents: card.amount ?? undefined,
          amountCaption: card.date,
        },
      });
      connect(card.id, "income", card.amount ?? 0);
    }
    if (!incomeCards.length) {
      nodes.push({
        id: "recorded-income",
        type: "income",
        position: incomeOrigin,
        data: {
          kind: "income",
          caption: "Income",
          label: "Log income",
          monthlyAmountCents: 0,
          amountCaption: "No income recorded",
        },
      });
      connect("recorded-income", "income", 0);
    }
    const placed = totals.buckets.filter(
      (bucket) =>
        positions[overviewCategoryId(bucket.id)] &&
        !positions[hiddenElementLayoutKey(breakdownCategoryId(bucket.id))]
    );
    nodes.push(
      {
        id: "overview-expenses",
        type: "expense",
        position: positions["overview-expenses"] ?? { x: 830, y: 120 },
        data: {
          kind: "expense",
          caption: "Spending",
          label: "Expenses",
          monthlyAmountCents: totals.spent,
          amountCaption: "Recorded spending",
          showOutput: true,
        },
      },
      {
        id: "overview-savings",
        type: "account",
        position: positions["overview-savings"] ?? { x: 830, y: 360 },
        data: {
          kind: "account",
          caption: "Contributions",
          label: "Savings",
          monthlyAmountCents: totals.saved,
          amountCaption: "View savings categories",
        },
      }
    );
    connect("overview-expenses", "expense", totals.spent);
    connect("overview-savings", "account", totals.saved);
    for (const bucket of placed) {
      const id = overviewCategoryId(bucket.id);
      nodes.push(categoryNode(id, bucket, positions[id]));
      const savings = bucket.kind === "savings";
      connect(
        id,
        savings ? "account" : "expense",
        bucket.actual,
        savings ? "overview-savings" : "overview-expenses"
      );
    }
    return { nodes, edges };
  }

  const buckets = visibleActivityBuckets(totals, view, positions);
  const expenseAccounts = view === "expenses" ? accounts : [];
  const recurring = view === "expenses" ? recurringExpenses : [];
  const positioned = [
    ...buckets.map((bucket) => breakdownCategoryId(bucket.id)),
    ...expenseAccounts.map(({ account }) =>
      expenseAccountElementId(account.id)
    ),
    ...recurring.map((group) => group.id),
  ];
  const occupied = [
    ...nodes.map((node) => node.position),
    ...positioned.flatMap((id) => (positions[id] ? [positions[id]] : [])),
  ];
  const place = (id: string, next: () => { x: number; y: number }) => {
    if (positions[id]) return positions[id];
    let position = next();
    while (
      occupied.some(
        (point) =>
          Math.abs(point.x - position.x) < 270 &&
          Math.abs(point.y - position.y) < 185
      )
    )
      position = next();
    occupied.push(position);
    return position;
  };

  let accountSlot = 0;
  for (const { account, spent } of expenseAccounts) {
    const id = expenseAccountElementId(account.id);
    if (positions[hiddenElementLayoutKey(id)]) continue;
    const credit = account.kind === "credit";
    nodes.push({
      id,
      type: "account",
      position: place(id, () => {
        const slot = accountSlot++;
        return {
          x: 30 + (slot % 2) * 400,
          y: 350 + Math.floor(slot / 2) * 216,
        };
      }),
      data: {
        kind: "account",
        variant: credit ? "credit-card" : "debit-account",
        caption: credit ? "Credit card" : "Bank account",
        label: account.name,
        monthlyAmountCents: spent,
        amountCaption: "Spent this month",
      },
    });
    connect(id, "expense", spent);
  }

  let slot = 0;
  for (const bucket of buckets) {
    const id = breakdownCategoryId(bucket.id);
    const position = place(id, () => {
      const point = {
        x: 830 + Math.floor(slot / 4) * 340,
        y: 30 + (slot % 4) * 216,
      };
      slot++;
      return point;
    });
    nodes.push(categoryNode(id, bucket, position));
    connect(
      id,
      bucket.kind === "savings" ? "account" : "expense",
      bucket.actual
    );
  }
  for (const group of recurring) {
    if (positions[hiddenElementLayoutKey(group.id)]) continue;
    const amountCaption = group.pendingCount
      ? `${group.estimated ? "Estimated" : "Scheduled"} · ${group.pendingCount} remaining`
      : "Recorded spending";
    nodes.push({
      id: group.id,
      type: "expense",
      position: place(group.id, () => {
        const next = slot++;
        return {
          x: 830 + Math.floor(next / 4) * 340,
          y: 30 + (next % 4) * 216,
        };
      }),
      data: {
        kind: "expense",
        caption: group.isSubscription ? "Subscription" : "Recurring payment",
        label: group.name,
        monthlyAmountCents: group.pendingCount
          ? group.plannedCents
          : group.spent,
        amountCaption,
        note: group.hasUnknownAmount
          ? group.plannedCents === undefined
            ? "Amount unknown"
            : "Some amounts are unknown"
          : undefined,
      },
    });
    connect(group.id, "expense", group.spent);
  }
  return { nodes, edges };
}
