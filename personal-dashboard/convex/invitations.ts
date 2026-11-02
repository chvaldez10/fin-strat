import { ConvexError, v } from "convex/values";
import { internalMutation, mutation } from "./_generated/server";
import { hashToken, normalizedEmail, requireAdmin } from "./permissions";
import { role } from "./schema";

export const issueInitial = internalMutation({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    if (
      await ctx.db
        .query("users")
        .withIndex("by_role", (q) => q.eq("role", "admin"))
        .first()
    )
      throw new ConvexError("An administrator already exists.");
    if (args.token.length < 32)
      throw new ConvexError("Use a cryptographically random invitation.");
    return ctx.db.insert("invitations", {
      tokenHash: await hashToken(args.token),
      role: "admin",
      kind: "invite",
      expiresAt: Date.now() + 7 * 86400000,
    });
  },
});
export const create = mutation({
  args: {
    email: v.string(),
    role,
    kind: v.union(v.literal("invite"), v.literal("recovery")),
  },
  handler: async (ctx, args) => {
    const admin = await requireAdmin(ctx),
      email = normalizedEmail(args.email);
    const existing = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", email))
      .unique();
    if (args.kind === "invite" && existing)
      throw new ConvexError("This email already has an account.");
    if (args.kind === "recovery" && !existing?.role)
      throw new ConvexError("No admitted account has that email.");
    const token =
      crypto.randomUUID().replaceAll("-", "") +
      crypto.randomUUID().replaceAll("-", "");
    await ctx.db.insert("invitations", {
      tokenHash: await hashToken(token),
      email,
      role: args.kind === "recovery" ? existing!.role! : args.role,
      kind: args.kind,
      expiresAt:
        Date.now() + (args.kind === "recovery" ? 3600000 : 7 * 86400000),
      createdBy: admin._id,
    });
    return { token, email, kind: args.kind };
  },
});
export const consumeRecovery = internalMutation({
  args: { token: v.string(), email: v.string() },
  handler: async (ctx, args) => {
    const email = normalizedEmail(args.email),
      tokenHash = await hashToken(args.token);
    const invite = await ctx.db
      .query("invitations")
      .withIndex("by_token", (q) => q.eq("tokenHash", tokenHash))
      .unique();
    const user = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", email))
      .unique();
    if (
      !user?.role ||
      !invite ||
      invite.kind !== "recovery" ||
      invite.email !== email ||
      invite.usedBy ||
      invite.expiresAt < Date.now()
    )
      throw new ConvexError(
        "Invalid or expired recovery link. Ask an administrator for a new link."
      );
    await ctx.db.patch(invite._id, { usedBy: user._id, usedAt: Date.now() });
    return { userId: user._id, email };
  },
});

// Deployment operators can recover the sole administrator without an email service.
export const issueRecovery = internalMutation({
  args: { token: v.string(), email: v.string() },
  handler: async (ctx, args) => {
    const email = normalizedEmail(args.email);
    if (args.token.length < 32 || args.token.length > 256)
      throw new ConvexError("Use a cryptographically random recovery token.");
    const user = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", email))
      .unique();
    if (!user?.role)
      throw new ConvexError("No admitted account has that email.");
    return ctx.db.insert("invitations", {
      tokenHash: await hashToken(args.token),
      email,
      role: user.role,
      kind: "recovery",
      expiresAt: Date.now() + 3600000,
    });
  },
});
