import { query, mutation } from "./_generated/server";
import { requireUser } from "./permissions";
import { preferenceFields } from "./schema";
const defaults = { reducedMotion: false, weeklyReview: true, showMoney: true };
export const get = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireUser(ctx);
    const record = await ctx.db
      .query("preferences")
      .withIndex("by_owner", (q) => q.eq("ownerId", user._id))
      .unique();
    return record
      ? {
          reducedMotion: record.reducedMotion,
          weeklyReview: record.weeklyReview,
          showMoney: record.showMoney,
        }
      : defaults;
  },
});
export const save = mutation({
  args: preferenceFields,
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const record = await ctx.db
      .query("preferences")
      .withIndex("by_owner", (q) => q.eq("ownerId", user._id))
      .unique();
    if (record) await ctx.db.patch(record._id, args);
    else await ctx.db.insert("preferences", { ownerId: user._id, ...args });
  },
});
