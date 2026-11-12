import { defineTable } from "convex/server";
import { v } from "convex/values";
import { paymentKind } from "./plannerSchema";

export const activityCategoryKind = v.union(
  v.literal("expense"),
  v.literal("savings")
);
export const statementDirection = v.union(v.literal("in"), v.literal("out"));
export const activityValues = v.object({
  description: v.string(),
  date: v.string(),
  kind: v.union(paymentKind, v.literal("refund")),
  amountCents: v.number(),
  accountId: v.string(),
  destinationId: v.union(v.string(), v.null()),
  categoryId: v.union(v.string(), v.null()),
  eTransfer: v.boolean(),
});
export const activityTables = {
  moneyActivityCategories: defineTable({
    ownerId: v.id("users"),
    name: v.string(),
    kind: activityCategoryKind,
  }).index("by_ownerId", ["ownerId"]),
  moneyActivityMonths: defineTable({
    ownerId: v.id("users"),
    month: v.string(),
    allocations: v.record(v.string(), v.number()),
    spendingLimitCents: v.union(v.number(), v.null()),
    reviewedThrough: v.union(v.string(), v.null()),
    revision: v.number(),
  }).index("by_ownerId_and_month", ["ownerId", "month"]),
  moneyActivityEntries: defineTable({
    ownerId: v.id("users"),
    month: v.string(),
    ...activityValues.fields,
    requestId: v.string(),
    planId: v.union(v.id("moneyPlannerPayments"), v.null()),
    revision: v.number(),
  })
    .index("by_ownerId_and_month", ["ownerId", "month"])
    .index("by_ownerId_and_requestId", ["ownerId", "requestId"])
    .index("by_ownerId_and_planId", ["ownerId", "planId"]),
  moneyActivityImports: defineTable({
    ownerId: v.id("users"),
    month: v.string(),
    accountId: v.string(),
    date: v.string(),
    description: v.string(),
    amountCents: v.number(),
    direction: statementDirection,
    fingerprint: v.string(),
    status: v.union(
      v.literal("pending"),
      v.literal("matched"),
      v.literal("ignored")
    ),
    entryId: v.union(v.id("moneyActivityEntries"), v.null()),
  })
    .index("by_ownerId_and_month", ["ownerId", "month"])
    .index("by_ownerId_and_fingerprint", ["ownerId", "fingerprint"])
    .index("by_ownerId_and_entryId", ["ownerId", "entryId"]),
};
