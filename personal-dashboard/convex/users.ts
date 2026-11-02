import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { requireUser } from "./permissions";
import { boundedText } from "./validation";
export const current = query({
  args: {},
  handler: async (ctx) => {
    const id = await getAuthUserId(ctx);
    if (!id) return null;
    const user = await ctx.db.get(id);
    return user?.role
      ? {
          id: user._id,
          name: user.name ?? "",
          email: user.email ?? "",
          role: user.role,
        }
      : null;
  },
});
export const updateProfile = mutation({
  args: { name: v.string() },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    await ctx.db.patch(user._id, { name: boundedText(args.name, "Name", 80) });
  },
});
