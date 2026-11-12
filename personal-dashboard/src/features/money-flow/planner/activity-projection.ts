import type { MoneyCanvasNode } from "../canvas-types";
import { formatMoney } from "../calculations";
import {
  DEFAULT_CATEGORIES,
  type ActivityValues,
  type summarizeActivity,
} from "./activity";
import type { PlannerEdge } from "./components/planner-element-connection";
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
  hasRecorded: boolean;
  charges: Payment[];
  repayments: Payment[];
};

export const expenseAccountElementId = (id: string) => `expense-account-${id}`;
export const overviewCategoryId = (id: string) => `overview-category-${id}`;
export const breakdownCategoryId = (id: string) => `budget-${id}`;
export const breakdownCategoryPlacementKey = (id: string) =>
  `placed-category:${id}`;

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
        bucket.planned === null
          ? "Set aside an amount"
          : `${formatMoney(bucket.planned)} set aside`,
    },
  };
}

export function activityExpenseAccounts(
  accounts: FinancialAccount[],
  scheduled: Payment[],
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
  return accounts.flatMap((account) => {
    const charges = scheduled.filter(
      (row) => row.kind === "expense" && row.accountId === account.id
    );
    const hasRecorded = spending.has(account.id);
    if (account.kind === "savings" && !hasRecorded && !charges.length)
      return [];
    return [
      {
        account,
        spent: spending.get(account.id) ?? 0,
        hasRecorded,
        charges,
        repayments: scheduled.filter(
          (row) =>
            row.kind === "cardPayment" && row.counterpartyId === account.id
        ),
      },
    ];
  });
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
        item.planned !== null ||
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

function plannedCardPayments(payments: readonly Payment[]) {
  if (!payments.length) return null;
  const known = payments.filter((payment) => payment.amountCents !== null);
  const amountCents = known.length
    ? known.reduce((sum, payment) => sum + (payment.amountCents ?? 0), 0)
    : null;
  const incomplete = known.length < payments.length;
  const estimated = known.some((payment) => payment.estimated);
  const label = incomplete
    ? "Known card payments"
    : estimated
      ? "Estimated card payments"
      : "Planned card payments";
  const detail =
    amountCents === null
      ? "Planned card payment amount unknown"
      : `${estimated ? "≈ " : ""}${formatMoney(amountCents)} in planned card payments${incomplete ? " + unknown amounts" : ""}`;
  return { amountCents, label, detail };
}

export function projectActivityCanvas({
  totals,
  income,
  accounts,
  bank,
  view,
  positions,
}: Readonly<{
  totals: ActivitySummary;
  income: IncomeDisplay;
  accounts: ExpenseAccount[];
  bank?: Pick<FinancialAccount, "name" | "balanceCents" | "balanceUpdatedAt">;
  view: ActivityCanvasView;
  positions: PlannerLayoutValues["positions"];
}>) {
  const overview = view === "overview";
  const cardPayments = plannedCardPayments(
    accounts.flatMap((item) => item.repayments)
  );
  const centerId = overview ? "center" : `${view}-center`;
  const centerLabel = view === "expenses" ? "Expenses" : "Savings";
  const nodes: MoneyCanvasNode[] = [
    {
      id: centerId,
      type: "chequing",
      position: positions[centerId] ?? { x: 420, y: overview ? 240 : 115 },
      data: {
        kind: "chequing",
        caption: overview ? "Overview bank" : "This month",
        label: overview ? (bank?.name ?? "Choose a bank account") : centerLabel,
        note: overview
          ? bank?.balanceUpdatedAt != null
            ? `${formatMoney(bank.balanceCents)} recorded balance`
            : undefined
          : view === "expenses"
            ? [
                `${formatMoney(totals.spent)} recorded spending`,
                cardPayments?.detail,
              ]
                .filter(Boolean)
                .join(" · ")
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
    const placed = totals.buckets.filter(
      (bucket) => positions[overviewCategoryId(bucket.id)]
    );
    nodes.push(
      {
        id: "recorded-income",
        type: "income",
        position: positions["recorded-income"] ?? { x: 30, y: 220 },
        data: {
          kind: "income",
          label: income.label,
          monthlyAmountCents: income.amountCents ?? undefined,
          amountCaption: income.detail ?? "Edit income",
        },
      },
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
          note: cardPayments?.detail,
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
    connect("recorded-income", "income", income.amountCents ?? 0);
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
  const positioned = [
    ...buckets.map((bucket) => breakdownCategoryId(bucket.id)),
    ...expenseAccounts.map(({ account }) =>
      expenseAccountElementId(account.id)
    ),
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
  for (const {
    account,
    spent,
    hasRecorded,
    charges,
    repayments,
  } of expenseAccounts) {
    const id = expenseAccountElementId(account.id);
    if (positions[hiddenElementLayoutKey(id)]) continue;
    const credit = account.kind === "credit";
    const repayment = credit ? plannedCardPayments(repayments) : null;
    const balance =
      credit && account.balanceUpdatedAt !== null
        ? `${formatMoney(account.balanceCents)} recorded balance owed`
        : undefined;
    const knownCharges = charges.filter((row) => row.amountCents !== null);
    const scheduledTotal = knownCharges.reduce(
      (sum, row) => sum + (row.amountCents ?? 0),
      0
    );
    const showScheduled = !hasRecorded && charges.length > 0;
    let displayedAmount: number | undefined = spent;
    let amountCaption = "Spent this month";
    let balanceNote = balance;
    let paymentNote = repayment?.detail;
    if (showScheduled) {
      displayedAmount = knownCharges.length ? scheduledTotal : undefined;
      amountCaption = "Scheduled expenses · $0 spent";
      if (knownCharges.length < charges.length && knownCharges.length)
        amountCaption = "Known scheduled expenses · $0 spent";
      else if (knownCharges.some((row) => row.estimated))
        amountCaption = "Estimated expenses · $0 spent";
    } else if (!hasRecorded && repayment?.amountCents != null) {
      displayedAmount = repayment.amountCents;
      amountCaption = `${repayment.label} · $0 spent`;
      paymentNote = undefined;
    } else if (!hasRecorded && balance) {
      displayedAmount = account.balanceCents;
      amountCaption = "Recorded balance owed · $0 spent";
      balanceNote = undefined;
    }
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
        monthlyAmountCents: displayedAmount,
        amountCaption,
        note:
          [paymentNote, balanceNote].filter(Boolean).join(" · ") || undefined,
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
  return { nodes, edges };
}
