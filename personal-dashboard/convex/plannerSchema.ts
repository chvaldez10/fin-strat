import { defineTable } from "convex/server";
import { v } from "convex/values";

export const paymentKind = v.union(
  v.literal("income"),
  v.literal("expense"),
  v.literal("savings"),
  v.literal("transfer"),
  v.literal("cardPayment")
);
export const accountKind = v.union(
  v.literal("chequing"),
  v.literal("savings"),
  v.literal("credit")
);
export const frequency = v.union(
  v.literal("once"),
  v.literal("weekly"),
  v.literal("fortnightly"),
  v.literal("twiceMonthly"),
  v.literal("monthly"),
  v.literal("yearly")
);
export const paymentFields = {
  name: v.string(),
  kind: paymentKind,
  isSubscription: v.boolean(),
  amountCents: v.union(v.number(), v.null()),
  estimated: v.boolean(),
  accountId: v.union(v.string(), v.null()),
  counterpartyId: v.union(v.string(), v.null()),
  notes: v.string(),
};
export const paymentValues = v.object({
  ...paymentFields,
  dueDate: v.string(),
  statementMonth: v.union(v.string(), v.null()),
  statementAmountCents: v.union(v.number(), v.null()),
});
export const scheduleValues = v.object({
  ...paymentFields,
  frequency,
  startDate: v.string(),
  endDate: v.union(v.string(), v.null()),
  secondDay: v.union(v.number(), v.null()),
  status: v.union(
    v.literal("active"),
    v.literal("paused"),
    v.literal("cancelled")
  ),
});
export const plannerTables = {
  moneyPlannerSettings: defineTable({
    ownerId: v.id("users"),
    startMonth: v.string(),
    scheduleRevision: v.number(),
  }).index("by_ownerId", ["ownerId"]),
  moneyPlannerAccounts: defineTable({
    ownerId: v.id("users"),
    id: v.string(),
    name: v.string(),
    institution: v.string(),
    kind: accountKind,
    balanceCents: v.number(),
    balanceUpdatedAt: v.union(v.number(), v.null()),
    legacyAccountId: v.union(v.string(), v.null()),
    revision: v.number(),
  })
    .index("by_ownerId", ["ownerId"])
    .index("by_ownerId_and_id", ["ownerId", "id"]),
  moneyPlannerSeries: defineTable({
    ownerId: v.id("users"),
    seriesId: v.string(),
    ...scheduleValues.fields,
    effectiveFrom: v.string(),
    effectiveTo: v.union(v.string(), v.null()),
    revision: v.number(),
    legacyKey: v.union(v.string(), v.null()),
    monthOverrides: v.optional(
      v.record(v.string(), v.union(v.number(), v.null()))
    ),
  })
    .index("by_ownerId", ["ownerId"])
    .index("by_ownerId_and_seriesId", ["ownerId", "seriesId"]),
  moneyPlannerPayments: defineTable({
    ownerId: v.id("users"),
    ...paymentValues.fields,
    occurrenceKey: v.string(),
    seriesId: v.union(v.string(), v.null()),
    originalDate: v.string(),
    month: v.string(),
    status: v.union(
      v.literal("pending"),
      v.literal("paid"),
      v.literal("skipped")
    ),
    paidOn: v.union(v.string(), v.null()),
    carryForward: v.boolean(),
    modified: v.boolean(),
    revision: v.number(),
  })
    .index("by_ownerId_and_month", ["ownerId", "month"])
    .index("by_ownerId_and_status_and_month", ["ownerId", "status", "month"])
    .index("by_ownerId_and_paidOn", ["ownerId", "paidOn"])
    .index("by_ownerId_and_occurrenceKey", ["ownerId", "occurrenceKey"])
    .index("by_ownerId_and_counterpartyId_and_statementMonth", [
      "ownerId",
      "counterpartyId",
      "statementMonth",
    ]),
  moneyPlannerMonths: defineTable({
    ownerId: v.id("users"),
    month: v.string(),
    carryInCents: v.union(v.number(), v.null()),
    carryOutCents: v.union(v.number(), v.null()),
    closed: v.boolean(),
    revision: v.number(),
    generatedRevision: v.number(),
  }).index("by_ownerId_and_month", ["ownerId", "month"]),
  moneyPlannerLayouts: defineTable({
    ownerId: v.id("users"),
    accountId: v.string(),
    positions: v.record(v.string(), v.object({ x: v.number(), y: v.number() })),
    viewport: v.object({ x: v.number(), y: v.number(), zoom: v.number() }),
    revision: v.number(),
  }).index("by_ownerId_and_accountId", ["ownerId", "accountId"]),
};
