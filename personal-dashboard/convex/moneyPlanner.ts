import { v, ConvexError } from "convex/values";
import { query, mutation } from "./_generated/server";
import { requireUser } from "./permissions";
import {
  accountsFor,
  seriesFor,
  settingsFor,
  monthFor,
  materializeMonth,
  checkMonth,
  bounded,
  MAX_MONTH_PAYMENTS,
  addMonths,
} from "./lib/planner";
import { importLegacyPlan } from "./lib/plannerMigration";
import { schedulePayments } from "../src/features/money-flow/planner/recurrence";
import { isCashCommitment } from "../src/features/money-flow/planner/totals";

export const openMonth = mutation({
  args: { month: v.string() },
  handler: async (ctx, { month }) => {
    const user = await requireUser(ctx);
    checkMonth(month);
    let settings = await settingsFor(ctx, user._id);
    if (!settings) {
      const id = await ctx.db.insert("moneyPlannerSettings", {
        ownerId: user._id,
        startMonth: month,
        scheduleRevision: 0,
      });
      settings = (await ctx.db.get(id))!;
      await importLegacyPlan(ctx, user._id);
    }
    await materializeMonth(ctx, settings, month);
    return null;
  },
});
export const getMonth = query({
  args: { month: v.string() },
  handler: async (ctx, { month }) => {
    const user = await requireUser(ctx);
    checkMonth(month);
    const settings = await settingsFor(ctx, user._id);
    const accounts = await accountsFor(ctx, user._id);
    const schedules = await seriesFor(ctx, user._id);
    const review = await monthFor(ctx, user._id, month);
    const previous = await monthFor(
      ctx,
      user._id,
      addMonths(month as `${number}-${number}`, -1)
    );
    const entries = await bounded(
      ctx.db
        .query("moneyPlannerPayments")
        .withIndex("by_ownerId_and_month", (q) =>
          q.eq("ownerId", user._id).eq("month", month)
        )
        .take(MAX_MONTH_PAYMENTS + 1),
      MAX_MONTH_PAYMENTS,
      "monthly payments"
    );
    const overdue = await bounded(
      ctx.db
        .query("moneyPlannerPayments")
        .withIndex("by_ownerId_and_status_and_month", (q) =>
          q.eq("ownerId", user._id).eq("status", "pending").lt("month", month)
        )
        .take(MAX_MONTH_PAYMENTS + 1),
      MAX_MONTH_PAYMENTS,
      "older unpaid items"
    );
    const settled = await bounded(
      ctx.db
        .query("moneyPlannerPayments")
        .withIndex("by_ownerId_and_paidOn", (q) =>
          q
            .eq("ownerId", user._id)
            .gte("paidOn", `${month}-01`)
            .lt("paidOn", `${addMonths(month as `${number}-${number}`, 1)}-01`)
        )
        .take(MAX_MONTH_PAYMENTS + 1),
      MAX_MONTH_PAYMENTS,
      "payments settled this month"
    );
    const carried = [
      ...overdue,
      ...settled.filter((item) => item.month < month),
    ].filter(
      (item) =>
        item.carryForward &&
        (item.kind === "expense" || item.kind === "cardPayment") &&
        isCashCommitment(item, accounts)
    );
    const nextMonth = addMonths(month as `${number}-${number}`, 1);
    const nextRows = await bounded(
      ctx.db
        .query("moneyPlannerPayments")
        .withIndex("by_ownerId_and_month", (q) =>
          q.eq("ownerId", user._id).eq("month", nextMonth)
        )
        .take(MAX_MONTH_PAYMENTS + 1),
      MAX_MONTH_PAYMENTS,
      "upcoming payments"
    );
    const upcoming = new Map(
      schedules
        .flatMap((schedule) => schedulePayments(schedule, nextMonth))
        .map((item) => [item.occurrenceKey, item])
    );
    for (const row of nextRows) {
      if (row.status !== "pending") {
        upcoming.delete(row.occurrenceKey);
        continue;
      }
      upcoming.set(row.occurrenceKey, {
        occurrenceKey: row.occurrenceKey,
        seriesId: row.seriesId ?? row._id,
        originalDate: row.originalDate,
        values: {
          name: row.name,
          kind: row.kind,
          isSubscription: row.isSubscription,
          amountCents: row.amountCents,
          estimated: row.estimated,
          accountId: row.accountId,
          counterpartyId: row.counterpartyId,
          notes: row.notes,
          dueDate: row.dueDate,
          statementMonth: row.statementMonth,
          statementAmountCents: row.statementAmountCents,
        },
      });
    }
    const next = [...upcoming.values()]
      .sort((a, b) => a.values.dueDate.localeCompare(b.values.dueDate))
      .slice(0, 8);
    return {
      ready:
        !!settings &&
        !!review &&
        (review.closed ||
          review.generatedRevision === settings.scheduleRevision),
      scheduleRevision: settings?.scheduleRevision ?? 0,
      accounts,
      schedules: schedules.filter((item) => item.effectiveTo === null),
      scheduleVersions: schedules,
      entries: [...entries, ...carried],
      settlements: settled,
      review,
      carryInCents: review?.carryInCents ?? previous?.carryOutCents ?? null,
      previousConfirmed:
        previous?.carryOutCents !== null &&
        previous?.carryOutCents !== undefined,
      next,
    };
  },
});
export const saveReview = mutation({
  args: {
    month: v.string(),
    expectedRevision: v.number(),
    carryInCents: v.union(v.number(), v.null()),
    carryOutCents: v.union(v.number(), v.null()),
    closed: v.boolean(),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    checkMonth(args.month);
    for (const value of [args.carryInCents, args.carryOutCents])
      if (
        value !== null &&
        (!Number.isSafeInteger(value) || Math.abs(value) > 1_000_000_000_000)
      )
        throw new ConvexError("Enter a valid carryover amount.");
    const review = await monthFor(ctx, user._id, args.month);
    if (!review || review.revision !== args.expectedRevision)
      throw new ConvexError(
        "This month's review changed. Reopen it before saving."
      );
    await ctx.db.patch(review._id, {
      carryInCents: args.carryInCents,
      carryOutCents: args.carryOutCents,
      closed: args.closed,
      revision: review.revision + 1,
    });
    return null;
  },
});
