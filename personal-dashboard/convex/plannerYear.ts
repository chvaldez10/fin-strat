import { ConvexError, v } from "convex/values";
import { query } from "./_generated/server";
import { requireUser } from "./permissions";
import {
  accountsFor,
  seriesFor,
  monthFor,
  bounded,
  MAX_MONTH_PAYMENTS,
} from "./lib/planner";
import { schedulePayments } from "../src/features/money-flow/planner/recurrence";
import { plannerTotals } from "../src/features/money-flow/planner/totals";
import type { Payment } from "../src/features/money-flow/planner/types";

export const get = query({
  args: { year: v.number() },
  handler: async (ctx, { year }) => {
    const user = await requireUser(ctx);
    if (!Number.isInteger(year) || year < 1900 || year > 2200)
      throw new ConvexError("Choose a valid year.");
    const accounts = await accountsFor(ctx, user._id),
      schedules = await seriesFor(ctx, user._id);
    return Promise.all(
      Array.from({ length: 12 }, async (_, index) => {
        const month = `${year}-${String(index + 1).padStart(2, "0")}`;
        const saved = await bounded(
          ctx.db
            .query("moneyPlannerPayments")
            .withIndex("by_ownerId_and_month", (q) =>
              q.eq("ownerId", user._id).eq("month", month)
            )
            .take(MAX_MONTH_PAYMENTS + 1),
          MAX_MONTH_PAYMENTS,
          "monthly payments"
        );
        const review = await monthFor(ctx, user._id, month);
        const rows = new Map<string, Payment>();
        const generated = schedules.flatMap((schedule) =>
          schedulePayments(schedule, month)
        );
        if (generated.length > MAX_MONTH_PAYMENTS)
          throw new ConvexError(
            "This month has more than 1000 scheduled payments."
          );
        if (!review?.closed)
          for (const item of generated) {
            const moved = await ctx.db
              .query("moneyPlannerPayments")
              .withIndex("by_ownerId_and_occurrenceKey", (q) =>
                q
                  .eq("ownerId", user._id)
                  .eq("occurrenceKey", item.occurrenceKey)
              )
              .unique();
            if (moved && moved.month !== month) continue;
            rows.set(item.occurrenceKey, {
              ...item.values,
              _id: item.occurrenceKey,
              seriesId: item.seriesId,
              month,
              originalDate: item.originalDate,
              status: "pending",
              paidOn: null,
              revision: 0,
              carryForward: false,
              modified: false,
            });
          }
        for (const item of saved) rows.set(item.occurrenceKey, item);
        return {
          month,
          ...plannerTotals([...rows.values()], accounts, month, null),
        };
      })
    );
  },
});
