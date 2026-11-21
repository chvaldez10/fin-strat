import type {
  CanvasPositions,
  CanvasProjection,
  MoneyCanvasNode,
  PlannerEdge,
} from "../canvas-types";
import { formatMoney } from "../calculations";
import { HOUSEHOLD_CATEGORY, SUBSCRIPTIONS_CATEGORY_ID } from "./activity";
import type { ActivityFilter } from "./activity-data";
import type { ActivityWorkspaceData } from "./activity-workspace-data";
import { activityAccountName } from "./activity-canvas-account";
import type { FinancialAccount, Payment } from "./types";

export const activityGroups = {
  household: {
    label: HOUSEHOLD_CATEGORY.name,
    filter: { type: "spending", categoryId: HOUSEHOLD_CATEGORY.id },
    amountCaption: "Paid this month",
  },
  expenses: {
    label: "Expenses",
    filter: { type: "expenses" },
    amountCaption: "Spent this month",
  },
  savings: {
    label: "Savings",
    filter: { type: "savings" },
    amountCaption: "Contributed this month",
  },
} as const;

export type ActivityGroup = keyof typeof activityGroups;
export type ActivityCanvasView = "overview" | ActivityGroup;

type ActivityFlowItem = {
  id: string;
  incoming?: boolean;
  source?: string;
  data: MoneyCanvasNode["data"];
} & (
  | {
      filter: ActivityFilter;
      group?: never;
      initialView?: "scheduled";
    }
  | {
      group: ActivityGroup;
      filter?: never;
      initialView?: never;
    }
);

function scheduledAmount(plans: readonly Payment[]) {
  if (!plans.length) return undefined;
  const known = plans.filter((payment) => payment.amountCents !== null);
  if (!known.length) return "Scheduled amount unknown";
  const amount = known.reduce(
    (sum, payment) => sum + (payment.amountCents ?? 0),
    0
  );
  return [
    `${known.some((payment) => payment.estimated) ? "Estimated" : "Scheduled"} ${formatMoney(amount)}`,
    known.length < plans.length ? "plus unknown amounts" : null,
  ]
    .filter(Boolean)
    .join(" · ");
}

function activityGroupAmount(
  view: ActivityGroup,
  { totals, household, expenses }: ActivityWorkspaceData
) {
  if (view === "household") return household.paid;
  if (view === "expenses") return expenses.spent;
  return totals.saved;
}

function plannedCharges(plans: readonly Payment[]) {
  const amount = scheduledAmount(plans);
  if (!amount) return undefined;
  const label = plans.length === 1 ? plans[0].name : `${plans.length} charges`;
  return `${amount} · ${label}`;
}

const subscriptionBranch = `budget-${SUBSCRIPTIONS_CATEGORY_ID}`;

function subscriptionFlowItems(
  subscriptions: ActivityWorkspaceData["subscriptions"]
): ActivityFlowItem[] {
  return Array.from(subscriptions, ([id, subscription]) => {
    const { name, accountId, recorded, scheduled, markedPaid, paid } =
      subscription;
    const status = [
      scheduledAmount(scheduled),
      markedPaid && "Marked paid in planner",
      !recorded.length &&
        !scheduled.length &&
        !markedPaid &&
        "No charge this month",
      !accountId && "Account not assigned",
    ]
      .filter(Boolean)
      .join(" · ");
    return {
      id: `subscription-${encodeURIComponent(id)}`,
      source: subscriptionBranch,
      filter: {
        type: "spending",
        categoryId: SUBSCRIPTIONS_CATEGORY_ID,
        subscriptionId: id,
      },
      initialView:
        !recorded.length && scheduled.length ? "scheduled" : undefined,
      data: {
        kind: "expense",
        caption: "Subscription",
        label: name,
        monthlyAmountCents: paid,
        amountCaption: "Recorded this month",
        note: status || undefined,
      },
    };
  });
}

function activityGroupItems(
  workspace: ActivityWorkspaceData,
  view: Exclude<ActivityGroup, "household">
): ActivityFlowItem[] {
  const { totals, activity, scheduledExpenses, subscriptions } = workspace;
  const savings = view === "savings";
  const type = savings ? "savings" : "spending";
  const kind = savings ? "savings" : "expense";
  const amountCaption = savings ? "Contributed" : "Spent this month";
  const items: ActivityFlowItem[] = [];
  const categories = new Set(totals.buckets.map((bucket) => bucket.id));
  for (const bucket of totals.buckets) {
    if (bucket.kind !== kind || bucket.id === HOUSEHOLD_CATEGORY.id) continue;
    const scheduled = savings ? undefined : scheduledExpenses.get(bucket.id);
    const subscription = bucket.id === SUBSCRIPTIONS_CATEGORY_ID;
    if (
      !bucket.hasActivity &&
      !scheduled?.length &&
      !(subscription && subscriptions.size)
    )
      continue;
    items.push({
      id: `budget-${bucket.id}`,
      filter: { type, categoryId: bucket.id },
      initialView: bucket.hasActivity ? undefined : "scheduled",
      data: {
        kind: savings ? "account" : "expense",
        label: bucket.name,
        caption: savings ? "Savings" : "Expense group",
        monthlyAmountCents: bucket.actual,
        amountCaption,
        note:
          scheduled &&
          (subscription
            ? scheduledAmount(scheduled)
            : plannedCharges(scheduled)),
        showOutput: subscription && subscriptions.size > 0,
      },
    });
  }

  const entries = activity.entries.filter(
    (entry) =>
      (entry.kind === kind || (!savings && entry.kind === "refund")) &&
      !categories.has(entry.categoryId ?? "")
  );
  const scheduled = savings ? undefined : scheduledExpenses.get(null);
  if (entries.length || scheduled?.length) {
    items.push({
      id: `overview-uncategorized-${type}`,
      filter: { type, categoryId: null },
      initialView: entries.length ? undefined : "scheduled",
      data: {
        kind: savings ? "account" : "expense",
        label: savings ? "Uncategorized savings" : "Uncategorized expenses",
        monthlyAmountCents: entries.reduce(
          (sum, entry) =>
            sum +
            (entry.kind === "refund" ? -entry.amountCents : entry.amountCents),
          0
        ),
        amountCaption,
        note: scheduled && plannedCharges(scheduled),
      },
    });
  }
  if (!savings) items.push(...subscriptionFlowItems(subscriptions));
  return items;
}

function householdFlowItems({
  household,
}: ActivityWorkspaceData): ActivityFlowItem[] {
  return Array.from(household.bills, ([billId, bill]) => ({
    id: `household-bill-${encodeURIComponent(billId)}`,
    filter: { ...activityGroups.household.filter, billId },
    initialView: bill.recorded.length ? undefined : "scheduled",
    data: {
      kind: "expense",
      caption: "Household bill",
      label: bill.name,
      monthlyAmountCents: bill.paid,
      amountCaption: "Paid this month",
      note: scheduledAmount(bill.scheduled),
    },
  }));
}

export function activityFlowItems(
  workspace: ActivityWorkspaceData,
  view: ActivityCanvasView,
  account?: FinancialAccount
): ActivityFlowItem[] {
  if (view === "household") return householdFlowItems(workspace);
  if (view !== "overview") return activityGroupItems(workspace, view);
  const {
    totals,
    activity,
    cardPayments,
    transfersSent,
    transfersReceived,
    household,
    expenses,
  } = workspace;
  const items: ActivityFlowItem[] = [];
  if (account?.kind !== "credit") {
    items.push({
      id: "recorded-income",
      incoming: true,
      filter: { type: "income" },
      data: {
        kind: "income",
        label: "Income received",
        monthlyAmountCents: totals.income,
        amountCaption: "Recorded this month",
      },
    });
  }

  for (const group of ["household", "expenses", "savings"] as const) {
    const savings = group === "savings";
    if (savings && !activity.entries.some((entry) => entry.kind === "savings"))
      continue;
    if (
      group === "household" &&
      account?.kind === "credit" &&
      !household.bills.size
    )
      continue;
    const scheduled =
      group === "household" ? household.scheduled : expenses.scheduled;
    const { label, amountCaption } = activityGroups[group];
    items.push({
      id: `overview-${group}`,
      group,
      data: {
        kind: savings ? "account" : "expense",
        caption: "Open group",
        label,
        monthlyAmountCents: activityGroupAmount(group, workspace),
        amountCaption,
        note: savings ? undefined : scheduledAmount(scheduled),
      },
    });
  }

  for (const { account: card, paid, planned } of cardPayments) {
    const incoming = account?.kind === "credit";
    items.push({
      id: incoming
        ? `card-payment-received-${card.id}`
        : `card-payment-${card.id}`,
      incoming,
      filter: { type: "cardPayment", accountId: card.id },
      data: {
        kind: incoming ? "income" : "expense",
        variant: incoming ? undefined : "credit-card",
        label: incoming ? "Payments received" : card.name,
        caption: "Credit card payments",
        monthlyAmountCents: paid,
        amountCaption: incoming ? "Received this month" : "Paid this month",
        note: scheduledAmount(planned),
      },
    });
  }

  for (const [incoming, amount] of [
    [false, transfersSent],
    [true, transfersReceived],
  ] as const) {
    if (!amount) continue;
    items.push({
      id: incoming ? "overview-transfers-in" : "overview-transfers",
      incoming,
      filter: {
        type: "transfer",
        accountId: account?.id,
        direction: account ? (incoming ? "in" : "out") : undefined,
      },
      data: {
        kind: incoming ? "income" : "account",
        label: account
          ? incoming
            ? "Transfers received"
            : "Transfers sent"
          : "Bank transfers",
        monthlyAmountCents: amount,
        amountCaption: "Moved this month",
      },
    });
  }
  return items;
}

export function projectActivityCanvas(
  workspace: ActivityWorkspaceData,
  view: ActivityCanvasView,
  account: FinancialAccount | undefined,
  items: readonly ActivityFlowItem[],
  positions: CanvasPositions
): CanvasProjection {
  const group = view === "overview" ? undefined : activityGroups[view];
  const center = group ? `${view}-center` : "center";
  const inbound = items.filter((item) => item.incoming);
  const outbound = items.filter((item) => !item.incoming && !item.source);
  const children = items.filter((item) => item.source);
  const centerPosition = positions[center] ?? {
    x: 270,
    y: 40 + Math.min(2, (outbound.length - 1) / 2) * 164,
  };
  const nodes: MoneyCanvasNode[] = [
    {
      id: center,
      type: "chequing",
      position: centerPosition,
      data: {
        kind: "chequing",
        compact: true,
        variant:
          !group && account?.kind === "credit" ? "credit-card" : undefined,
        caption: group
          ? activityAccountName(account)
          : account?.kind === "credit"
            ? "Credit card"
            : account
              ? "Bank account"
              : "Monthly activity",
        label: group?.label ?? activityAccountName(account),
        note:
          view !== "overview"
            ? `${formatMoney(activityGroupAmount(view, workspace))} ${activityGroups[view].amountCaption.toLowerCase()}`
            : account?.balanceUpdatedAt != null
              ? `${formatMoney(account.balanceCents)} ${account.kind === "credit" ? "recorded amount owed" : "recorded balance"}`
              : undefined,
      },
    },
  ];
  const edges: PlannerEdge[] = [];
  const nodePositions = new Map([[center, centerPosition]]);
  const occupied = [
    centerPosition,
    ...items.flatMap(({ id }) => (positions[id] ? [positions[id]] : [])),
  ];

  for (const [group, incoming] of [
    [inbound, true],
    [outbound, false],
    [children, false],
  ] as const) {
    let slot = 0;
    for (const item of group) {
      const source = item.source ?? center;
      const origin = nodePositions.get(source) ?? centerPosition;
      let position = positions[item.id];
      if (!position) {
        do {
          const row = slot++;
          position = incoming
            ? {
                x: centerPosition.x - 250 - Math.floor(row / 5) * 260,
                y: centerPosition.y + (row % 5) * 164,
              }
            : {
                x: origin.x + 270 + Math.floor(row / 5) * 260,
                y: (item.source ? origin.y : 40) + (row % 5) * 164,
              };
        } while (
          occupied.some(
            (other) =>
              Math.abs(other.x - position.x) < 220 &&
              Math.abs(other.y - position.y) < 147
          )
        );
        occupied.push(position);
      }
      nodePositions.set(item.id, position);
      nodes.push({
        id: item.id,
        type: item.data.kind,
        position,
        data: { ...item.data, compact: true },
        ariaLabel: item.group
          ? `Open ${item.data.label} canvas`
          : item.data.label,
      });
      edges.push({
        id: `edge-${item.id}`,
        source: item.incoming ? item.id : source,
        target: item.incoming ? center : item.id,
        type: "planner",
        data: {
          amount: item.data.monthlyAmountCents ?? 0,
          kind: item.data.kind,
          hideLabel: true,
          showMotion: false,
        },
        selectable: false,
        focusable: false,
        deletable: false,
        reconnectable: false,
      });
    }
  }
  return { nodes, edges };
}
