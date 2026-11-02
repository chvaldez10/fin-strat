import { Password } from "@convex-dev/auth/providers/Password";
import {
  convexAuth,
  modifyAccountCredentials,
  invalidateSessions,
} from "@convex-dev/auth/server";
import { ConvexCredentials } from "@convex-dev/auth/providers/ConvexCredentials";
import { ConvexError } from "convex/values";
import type { DataModel } from "./_generated/dataModel";
import type { MutationCtx } from "./_generated/server";
import { hashToken, normalizedEmail } from "./permissions";
import { internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [
    Password<DataModel>({
      profile(params) {
        return {
          email: normalizedEmail(params.email),
          name:
            typeof params.name === "string"
              ? params.name.trim().slice(0, 80)
              : "",
          invitationCode:
            typeof params.invitationCode === "string"
              ? params.invitationCode
              : "",
        };
      },
      validatePasswordRequirements(password) {
        if (password.length < 12 || password.length > 128)
          throw new ConvexError(
            "Use a password between 12 and 128 characters."
          );
      },
    }),
    ConvexCredentials({
      id: "recovery",
      authorize: async (params, ctx): Promise<{ userId: Id<"users"> }> => {
        if (
          typeof params.token !== "string" ||
          typeof params.email !== "string" ||
          typeof params.password !== "string" ||
          params.password.length < 12 ||
          params.password.length > 128
        )
          throw new ConvexError(
            "Enter your recovery link, email, and a new 12-128 character password."
          );
        const result = await ctx.runMutation(
          internal.invitations.consumeRecovery,
          { token: params.token, email: params.email }
        );
        await modifyAccountCredentials(ctx, {
          provider: "password",
          account: { id: result.email, secret: params.password },
        });
        await invalidateSessions(ctx, { userId: result.userId });
        return { userId: result.userId };
      },
    }),
  ],
  callbacks: {
    async createOrUpdateUser(genericCtx, { existingUserId, profile }) {
      const ctx = genericCtx as MutationCtx;
      if (existingUserId) {
        const user = await ctx.db.get(existingUserId);
        if (!user?.role)
          throw new ConvexError("This account has not been admitted.");
        return existingUserId;
      }
      const code = profile.invitationCode;
      if (typeof code !== "string" || code.length < 32 || code.length > 256)
        throw new ConvexError("A valid invitation is required.");
      const email = normalizedEmail(profile.email);
      const tokenHash = await hashToken(code);
      const invite = await ctx.db
        .query("invitations")
        .withIndex("by_token", (q) => q.eq("tokenHash", tokenHash))
        .unique();
      if (
        !invite ||
        invite.kind !== "invite" ||
        invite.usedBy ||
        invite.expiresAt < Date.now() ||
        (invite.email && invite.email !== email)
      )
        throw new ConvexError(
          "This invitation is invalid, expired, or already used."
        );
      const name = typeof profile.name === "string" ? profile.name.trim() : "";
      if (!name || name.length > 80)
        throw new ConvexError("Enter your name (up to 80 characters).");
      const userId = await ctx.db.insert("users", {
        email,
        name,
        role: invite.role,
      });
      await ctx.db.patch(invite._id, { usedBy: userId, usedAt: Date.now() });
      return userId;
    },
  },
});
