import { summarizeActivity } from "./activity";
import type { ActivityData, ActivityEntry } from "./activity-data";
import {
  activityExpenseAccounts,
  displayActivityIncome,
  groupRecurringExpenses,
} from "./activity-projection";
import type { FinancialAccount, Payment } from "./types";

export function deriveActivityWorkspace(
  data: ActivityData,
  accounts: FinancialAccount[],
  plans: Payment[],
  bankId?: string
) {
  const activity = bankId
    ? {
        ...data,
        entries: data.entries.filter(
          (entry) => entry.accountId === bankId || entry.destinationId === bankId
        ),
        pending: data.pending.filter((row) => row.accountId === bankId),
      }
    : data;

  const recordedByPlan = new Map<string, ActivityEntry>();
  for (const entry of data.entries) {
    if (entry.planId) recordedByPlan.set(entry.planId, entry);
  }

  let workspaceAccounts = accounts;
  let workspacePlans = plans;
  if (bankId) {
    const linkedAccountIds = new Set([bankId]);
    for (const plan of plans) {
      if (
        plan.kind === "cardPayment" &&
        plan.accountId === bankId &&
        plan.counterpartyId
      )
        linkedAccountIds.add(plan.counterpartyId);
    }
    for (const entry of activity.entries) {
      if (entry.kind === "cardPayment" && entry.destinationId)
        linkedAccountIds.add(entry.destinationId);
    }
    workspaceAccounts = accounts.filter((account) =>
      linkedAccountIds.has(account.id)
    );
    const linkedCardIds = new Set(
      workspaceAccounts
        .filter((account) => account.kind === "credit")
        .map((account) => account.id)
    );
    workspacePlans = plans.filter((plan) => {
      if (plan.kind === "expense" && plan.seriesId) {
        const source = recordedByPlan.get(plan._id)?.accountId ?? plan.accountId;
        return source === bankId || (source !== null && linkedCardIds.has(source));
      }
      return plan.accountId === bankId || plan.counterpartyId === bankId;
    });
  }

  const scheduled = workspacePlans.filter(
    (plan) => plan.status === "pending" && !recordedByPlan.has(plan._id)
  );
  const receivedIncome = activity.entries
    .filter((entry) => entry.kind === "income")
    .sort((a, b) => b.date.localeCompare(a.date));
  const scheduledIncome = scheduled
    .filter((payment) => payment.kind === "income")
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  const totals = summarizeActivity(
    activity.entries,
    data.categories,
    data.plan?.allocations ?? {},
    bankId ? null : (data.plan?.spendingLimitCents ?? null)
  );

  return {
    activity,
    workspaceAccounts,
    scheduled,
    receivedIncome,
    scheduledIncome,
    totals,
    income: displayActivityIncome(totals.income, scheduledIncome),
    expenseAccounts: bankId ? [] : activityExpenseAccounts(accounts, activity.entries),
    recurringExpenses: groupRecurringExpenses(workspacePlans, recordedByPlan),
  };
}

export type ActivityWorkspaceData = ReturnType<typeof deriveActivityWorkspace>;
