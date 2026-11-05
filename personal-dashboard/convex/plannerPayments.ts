import { v, ConvexError } from "convex/values";
import { mutation } from "./_generated/server";
import { requireUser } from "./permissions";
import { paymentValues } from "./plannerSchema";
import {
  checkPayment,
  ownedPayment,
  checkDate,
  monthFor,
  MAX_MONTH_PAYMENTS,
  canvasWriteSession,
  checkCanvasWrite,
} from "./lib/planner";

export const save = mutation({
  args: {
    id: v.union(v.id("moneyPlannerPayments"), v.null()),
    expectedRevision: v.number(),
    values: paymentValues,
    canvas: canvasWriteSession,
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    await checkPayment(ctx, user._id, args.values);
    await checkCanvasWrite(ctx, args.canvas);
    if (
      args.values.kind === "cardPayment" &&
      (!args.values.statementMonth || !args.values.accountId)
    )
      throw new ConvexError(
        "Choose the statement month and the bank account paying this card."
      );
    const month = args.values.dueDate.slice(0, 7);
    const review = await monthFor(ctx, user._id, month);
    if (review?.closed)
      throw new ConvexError("Reopen this month before changing its payments.");
    if (args.values.kind === "cardPayment" && args.values.statementMonth) {
      const same = await ctx.db
        .query("moneyPlannerPayments")
        .withIndex("by_ownerId_and_counterpartyId_and_statementMonth", (q) =>
          q
            .eq("ownerId", user._id)
            .eq("counterpartyId", args.values.counterpartyId)
            .eq("statementMonth", args.values.statementMonth)
        )
        .unique();
      if (same && same._id !== args.id)
        throw new ConvexError(
          "This card already has a payment for that statement month. Edit that payment instead."
        );
    }
    if (args.id) {
      const item = await ownedPayment(
        ctx,
        user._id,
        args.id,
        args.expectedRevision
      );
      if ((await monthFor(ctx, user._id, item.month))?.closed)
        throw new ConvexError(
          "Reopen the payment's original month before changing it."
        );
      await ctx.db.patch(item._id, {
        ...args.values,
        month,
        carryForward: true,
        modified: true,
        revision: item.revision + 1,
      });
      return item._id;
    }
    const count = await ctx.db
      .query("moneyPlannerPayments")
      .withIndex("by_ownerId_and_month", (q) =>
        q.eq("ownerId", user._id).eq("month", month)
      )
      .take(MAX_MONTH_PAYMENTS);
    if (count.length >= MAX_MONTH_PAYMENTS)
      throw new ConvexError("This month already contains 1000 payments.");
    return ctx.db.insert("moneyPlannerPayments", {
      ownerId: user._id,
      ...args.values,
      occurrenceKey: crypto.randomUUID(),
      seriesId: null,
      originalDate: args.values.dueDate,
      month,
      status: "pending",
      paidOn: null,
      carryForward: true,
      modified: true,
      revision: 0,
    });
  },
});
export const setStatus = mutation({
  args: {
    canvas: canvasWriteSession,
    id: v.id("moneyPlannerPayments"),
    expectedRevision: v.number(),
    status: v.union(
      v.literal("pending"),
      v.literal("paid"),
      v.literal("skipped")
    ),
    paidOn: v.union(v.string(), v.null()),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const item = await ownedPayment(
      ctx,
      user._id,
      args.id,
      args.expectedRevision
    );
    await checkCanvasWrite(ctx, args.canvas);
    if (args.status === "paid") {
      if (!args.paidOn) throw new ConvexError("Choose when this was paid.");
      checkDate(args.paidOn);
    }
    if (
      (await monthFor(ctx, user._id, item.month))?.closed &&
      args.status !== "paid"
    )
      throw new ConvexError(
        "Reopen the original month before changing its status."
      );
    await ctx.db.patch(item._id, {
      status: args.status,
      carryForward: true,
      paidOn: args.status === "paid" ? args.paidOn : null,
      modified: true,
      revision: item.revision + 1,
    });
    return null;
  },
});
