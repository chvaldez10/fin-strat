import {
  HOUSEHOLD_CATEGORY,
  SUBSCRIPTIONS_CATEGORY_ID,
  householdBillName,
  suggestedExpenseCategory,
  summarizeActivity,
} from "./activity";
import type {
  ActivityData,
  ActivityEntry,
  ActivityFilter,
} from "./activity-data";
import type { FinancialAccount, Payment, Schedule } from "./types";

type HouseholdBill = {
  name: string;
  recorded: ActivityEntry[];
  scheduled: Payment[];
  paid: number;
};

function groupHouseholdBills(
  entries: readonly ActivityEntry[],
  scheduled: readonly Payment[],
  plansById: ReadonlyMap<string, Payment>
) {
  const bills = new Map<string, HouseholdBill>();
  const groupForName = (name: string) => {
    const label =
      householdBillName(name) ?? (name.trim() || "Household payment");
    const id = label.toLowerCase();
    const existing = bills.get(id);
    if (existing) return existing;
    const group: HouseholdBill = {
      name: label,
      recorded: [],
      scheduled: [],
      paid: 0,
    };
    bills.set(id, group);
    return group;
  };
  for (const entry of entries) {
    if (entry.categoryId !== HOUSEHOLD_CATEGORY.id) continue;
    const plan = entry.planId ? plansById.get(entry.planId) : undefined;
    const group = groupForName(plan?.name ?? entry.description);
    group.recorded.push(entry);
    group.paid +=
      entry.kind === "refund" ? -entry.amountCents : entry.amountCents;
  }
  for (const plan of scheduled) groupForName(plan.name).scheduled.push(plan);
  return bills;
}

type Subscription = HouseholdBill & {
  accountId: string | null;
  markedPaid: boolean;
};

function groupSubscriptions({
  entries,
  schedules,
  plansById,
  recordedPlanIds,
  asOf,
  accountId,
}: Readonly<{
  entries: readonly ActivityEntry[];
  schedules: readonly Schedule[];
  plansById: ReadonlyMap<string, Payment>;
  recordedPlanIds: ReadonlySet<string | null>;
  asOf: string;
  accountId?: string;
}>) {
  const groups = new Map<string, Subscription>();
  const subscriptionFor = (name: string, source: string | null) => {
    const id = JSON.stringify([source, name.trim().toLowerCase()]);
    const existing = groups.get(id);
    if (existing) return existing;
    const subscription: Subscription = {
      name: name.trim(),
      accountId: source,
      recorded: [],
      scheduled: [],
      paid: 0,
      markedPaid: false,
    };
    groups.set(id, subscription);
    return subscription;
  };
  for (const schedule of schedules) {
    if (
      schedule.kind === "expense" &&
      schedule.isSubscription &&
      schedule.status === "active" &&
      schedule.effectiveFrom <= asOf &&
      (!schedule.effectiveTo || schedule.effectiveTo > asOf) &&
      (!schedule.endDate || schedule.endDate >= asOf.slice(0, 7) + "-01") &&
      (!accountId || schedule.accountId === accountId)
    )
      subscriptionFor(schedule.name, schedule.accountId);
  }
  for (const entry of entries) {
    if (entry.categoryId !== SUBSCRIPTIONS_CATEGORY_ID) continue;
    const plan = entry.planId ? plansById.get(entry.planId) : undefined;
    const subscription = subscriptionFor(
      plan?.name ?? entry.description,
      entry.accountId
    );
    subscription.recorded.push(entry);
    subscription.paid +=
      entry.kind === "refund" ? -entry.amountCents : entry.amountCents;
  }
  for (const plan of plansById.values()) {
    if (
      plan.kind !== "expense" ||
      !plan.isSubscription ||
      plan.status === "skipped" ||
      recordedPlanIds.has(plan._id) ||
      (accountId && plan.accountId !== accountId)
    )
      continue;
    const subscription = subscriptionFor(plan.name, plan.accountId);
    if (plan.status === "paid") subscription.markedPaid = true;
    else subscription.scheduled.push(plan);
  }
  return groups;
}

export function deriveActivityWorkspace(
  data: ActivityData,
  accounts: FinancialAccount[],
  plans: Payment[],
  schedules: Schedule[],
  asOf: string,
  account?: FinancialAccount
) {
  const accountId = account?.id;
  const plansById = new Map(plans.map((plan) => [plan._id, plan]));
  const entries = accountId
    ? data.entries.filter(
        (entry) =>
          entry.accountId === accountId || entry.destinationId === accountId
      )
    : data.entries;
  const activity = {
    ...data,
    entries: entries.map((entry) => {
      if (
        entry.categoryId ||
        (entry.kind !== "expense" && entry.kind !== "refund")
      )
        return entry;
      const plan = entry.planId ? plansById.get(entry.planId) : undefined;
      const categoryId = suggestedExpenseCategory(
        plan?.name ?? entry.description,
        plan?.isSubscription
      );
      return categoryId ? { ...entry, categoryId } : entry;
    }),
    pending: accountId
      ? data.pending.filter((row) => row.accountId === accountId)
      : data.pending,
  };
  const recordedPlanIds = new Set<string | null>(
    data.entries.map((entry) => entry.planId)
  );
  const scheduled = plans.filter(
    (plan) =>
      plan.status === "pending" &&
      !recordedPlanIds.has(plan._id) &&
      (!accountId ||
        plan.accountId === accountId ||
        plan.counterpartyId === accountId)
  );
  const scheduledExpenses = new Map<string | null, Payment[]>();
  for (const plan of scheduled) {
    if (plan.kind !== "expense") continue;
    const categoryId = suggestedExpenseCategory(plan.name, plan.isSubscription);
    const group = scheduledExpenses.get(categoryId);
    if (group) group.push(plan);
    else scheduledExpenses.set(categoryId, [plan]);
  }

  const totals = summarizeActivity(
    activity.entries,
    data.categories,
    data.plan?.allocations ?? {},
    accountId ? null : (data.plan?.spendingLimitCents ?? null)
  );
  const householdScheduled = scheduledExpenses.get(HOUSEHOLD_CATEGORY.id) ?? [];
  const householdPaid =
    totals.buckets.find((bucket) => bucket.id === HOUSEHOLD_CATEGORY.id)
      ?.actual ?? 0;
  const paidByCard = new Map<string, number>();
  const scheduledByCard = new Map<string, Payment[]>();
  let moneyOut = 0;
  let transfersSent = 0;
  let transfersReceived = 0;
  for (const entry of activity.entries) {
    if (entry.kind === "cardPayment" && entry.destinationId) {
      paidByCard.set(
        entry.destinationId,
        (paidByCard.get(entry.destinationId) ?? 0) + entry.amountCents
      );
    }
    if (entry.kind === "transfer") {
      if (accountId && entry.destinationId === accountId)
        transfersReceived += entry.amountCents;
      else transfersSent += entry.amountCents;
    }
    if (
      entry.accountId !== accountId ||
      entry.kind === "income" ||
      entry.kind === "refund"
    )
      continue;
    moneyOut += entry.amountCents;
  }
  for (const payment of scheduled) {
    if (payment.kind !== "cardPayment" || !payment.counterpartyId) continue;
    const group = scheduledByCard.get(payment.counterpartyId);
    if (group) group.push(payment);
    else scheduledByCard.set(payment.counterpartyId, [payment]);
  }

  const cardPayments = accounts
    .filter(
      (card) =>
        card.kind === "credit" &&
        (!accountId ||
          card.id === accountId ||
          paidByCard.has(card.id) ||
          scheduledByCard.has(card.id))
    )
    .map((card) => ({
      account: card,
      paid: paidByCard.get(card.id) ?? 0,
      planned: scheduledByCard.get(card.id) ?? [],
    }));

  return {
    activity,
    scheduled,
    scheduledExpenses,
    totals,
    household: {
      paid: householdPaid,
      scheduled: householdScheduled,
      bills: groupHouseholdBills(
        activity.entries,
        householdScheduled,
        plansById
      ),
    },
    subscriptions: groupSubscriptions({
      entries: activity.entries,
      schedules,
      plansById,
      recordedPlanIds,
      asOf,
      accountId,
    }),
    expenses: {
      spent: totals.spent - householdPaid,
      scheduled: Array.from(scheduledExpenses)
        .filter(([categoryId]) => categoryId !== HOUSEHOLD_CATEGORY.id)
        .flatMap(([, payments]) => payments),
    },
    moneyOut,
    transfersSent,
    transfersReceived,
    cardPayments,
    cardPaymentsTotal: [...paidByCard.values()].reduce(
      (sum, amount) => sum + amount,
      0
    ),
  };
}

export type ActivityWorkspaceData = ReturnType<typeof deriveActivityWorkspace>;

export function activityListRecords(
  workspace: ActivityWorkspaceData,
  filter?: ActivityFilter
) {
  const { activity, scheduled, scheduledExpenses, household, expenses } =
    workspace;
  const selectedGroup =
    filter?.subscriptionId !== undefined
      ? workspace.subscriptions
      : household.bills;
  const groupId = filter?.subscriptionId ?? filter?.billId;
  if (groupId !== undefined) {
    const bill = selectedGroup.get(groupId);
    return {
      activity: { ...activity, entries: bill?.recorded ?? [] },
      scheduled: bill?.scheduled ?? [],
      title: bill?.name,
    };
  }
  if (filter?.type === "expenses") {
    return {
      activity: {
        ...activity,
        entries: activity.entries.filter(
          (entry) => entry.categoryId !== HOUSEHOLD_CATEGORY.id
        ),
      },
      scheduled: expenses.scheduled,
    };
  }
  if (filter?.type === "spending" && filter.categoryId !== undefined)
    return {
      activity,
      scheduled: scheduledExpenses.get(filter.categoryId) ?? [],
    };
  return { activity, scheduled };
}
