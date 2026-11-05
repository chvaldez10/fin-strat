import { v, ConvexError } from "convex/values";
import { mutation } from "./_generated/server";
import { requireUser } from "./permissions";
import { scheduleValues } from "./plannerSchema";
import {
  checkPayment,
  checkDate,
  settingsFor,
  seriesFor,
  materializeMonth,
  MAX_MONTH_PAYMENTS,
} from "./lib/planner";

export const save = mutation({
  args: {
    id: v.union(v.id("moneyPlannerSeries"), v.null()),
    expectedRevision: v.number(),
    values: scheduleValues,
    effectiveFrom: v.string(),
    month: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx),
      values = args.values;
    checkDate(args.effectiveFrom);
    await checkPayment(ctx, user._id, {
      ...values,
      dueDate: values.startDate,
      statementMonth: null,
      statementAmountCents: null,
    });
    if (values.kind === "cardPayment")
      throw new ConvexError(
        "Use a monthly credit statement to plan a card payment."
      );
    if (values.endDate) {
      checkDate(values.endDate);
      if (values.endDate < values.startDate)
        throw new ConvexError("The end date must follow the start date.");
    }
    if (
      values.frequency === "twiceMonthly" &&
      (!values.secondDay ||
        !Number.isInteger(values.secondDay) ||
        values.secondDay < 1 ||
        values.secondDay > 31)
    )
      throw new ConvexError("Choose a second payment day between 1 and 31.");
    const settings = await settingsFor(ctx, user._id);
    if (!settings) throw new ConvexError("Open the monthly planner first.");
    const all = await seriesFor(ctx, user._id);
    if (all.length >= 1000)
      throw new ConvexError(
        "The planner supports up to 1000 recurring schedule versions."
      );
    let seriesId = crypto.randomUUID();
    let legacyKey: string | null = null;
    let monthOverrides: Record<string, number | null> | undefined;
    if (args.id) {
      const old = await ctx.db.get(args.id);
      if (
        !old ||
        old.ownerId !== user._id ||
        old.effectiveTo ||
        old.revision !== args.expectedRevision
      )
        throw new ConvexError(
          "This recurring payment changed. Reopen it before saving."
        );
      if (args.effectiveFrom < old.effectiveFrom)
        throw new ConvexError(
          "Future changes cannot start before the existing schedule version."
        );
      const custom = await ctx.db
        .query("moneyPlannerPayments")
        .withIndex("by_ownerId_and_status_and_month", (q) =>
          q
            .eq("ownerId", user._id)
            .eq("status", "pending")
            .gte("month", args.effectiveFrom.slice(0, 7))
        )
        .take(MAX_MONTH_PAYMENTS + 1);
      if (custom.length > MAX_MONTH_PAYMENTS)
        throw new ConvexError(
          "Review upcoming payments before changing this schedule."
        );
      if (
        (old.frequency !== values.frequency ||
          old.startDate !== values.startDate ||
          old.secondDay !== values.secondDay) &&
        custom.some(
          (item) =>
            item.seriesId === old.seriesId &&
            item.modified &&
            item.dueDate >= args.effectiveFrom
        )
      )
        throw new ConvexError(
          "This schedule has custom upcoming payments. Resolve or skip those payments before changing its timing."
        );
      seriesId = old.seriesId;
      legacyKey = old.legacyKey;
      const replacesAmounts =
        old.amountCents !== values.amountCents ||
        old.frequency !== values.frequency ||
        old.startDate !== values.startDate ||
        old.secondDay !== values.secondDay;
      monthOverrides = replacesAmounts
        ? Object.fromEntries(
            Object.entries(old.monthOverrides ?? {}).filter(
              ([key]) => key < args.effectiveFrom.slice(0, 7)
            )
          )
        : old.monthOverrides;
      await ctx.db.patch(old._id, {
        effectiveTo: args.effectiveFrom,
        revision: old.revision + 1,
      });
    }
    const id = await ctx.db.insert("moneyPlannerSeries", {
      ownerId: user._id,
      seriesId,
      ...values,
      effectiveFrom: args.effectiveFrom,
      effectiveTo: null,
      legacyKey,
      monthOverrides,
      revision: 0,
    });
    const updated = {
      ...settings,
      scheduleRevision: settings.scheduleRevision + 1,
    };
    await ctx.db.patch(settings._id, {
      scheduleRevision: updated.scheduleRevision,
    });
    await materializeMonth(ctx, updated, args.month);
    return id;
  },
});
