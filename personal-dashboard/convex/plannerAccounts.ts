import { ConvexError, v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { api } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import { accountKind } from "./plannerSchema";
import { requireUser } from "./permissions";
import { accountsFor, checkMoney, checkMonth } from "./lib/planner";

export const save = mutation({
  args: {
    id: v.union(v.id("moneyPlannerAccounts"), v.null()),
    expectedRevision: v.number(),
    name: v.string(),
    institution: v.string(),
    kind: accountKind,
    balanceCents: v.number(),
    month: v.string(),
  },
  handler: async (ctx, args): Promise<Id<"moneyPlannerAccounts">> => {
    const user = await requireUser(ctx);
    checkMonth(args.month);
    checkMoney(args.balanceCents, args.kind !== "credit");
    if (
      !args.name.trim() ||
      args.name.length > 120 ||
      args.institution.length > 120
    )
      throw new ConvexError(
        "Enter an account name and institution up to 120 characters."
      );
    if (args.id) {
      const old = await ctx.db.get(args.id);
      if (
        !old ||
        old.ownerId !== user._id ||
        old.revision !== args.expectedRevision
      )
        throw new ConvexError("This account changed. Reopen it before saving.");
      if (args.kind !== old.kind)
        throw new ConvexError("An existing account's type cannot be changed.");
      await ctx.db.patch(old._id, {
        name: args.name.trim(),
        institution: args.institution.trim(),
        balanceCents: args.balanceCents,
        balanceUpdatedAt: Date.now(),
        revision: old.revision + 1,
      });
      return old._id;
    }
    if ((await accountsFor(ctx, user._id)).length >= 50)
      throw new ConvexError("The planner supports up to 50 accounts.");
    let accountId = crypto.randomUUID(),
      legacyAccountId: string | null = null;
    if (args.kind !== "credit") {
      const created: {
        accountId: string;
        documentId: Id<"moneyFlowDocuments">;
      } = await ctx.runMutation(api.moneyFlow.createAccount, {
        name: args.name,
        institution: args.institution.trim() || "Bank",
        accountType: args.kind,
        openingBalanceCents: args.balanceCents,
        startMonth: args.month,
        fromMonthlyPlanner: true,
      });
      accountId = created.accountId;
      legacyAccountId = created.accountId;
    }
    return ctx.db.insert("moneyPlannerAccounts", {
      ownerId: user._id,
      id: accountId,
      name: args.name.trim(),
      institution: args.institution.trim(),
      kind: args.kind,
      balanceCents: args.balanceCents,
      balanceUpdatedAt: Date.now(),
      legacyAccountId,
      revision: 0,
    });
  },
});
export const statements = query({
  args: { accountId: v.string() },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    if (
      !(await accountsFor(ctx, user._id)).some(
        (item) => item.id === args.accountId && item.kind === "credit"
      )
    )
      throw new ConvexError("Credit account unavailable.");
    const rows = await ctx.db
      .query("moneyPlannerPayments")
      .withIndex("by_ownerId_and_counterpartyId_and_statementMonth", (q) =>
        q.eq("ownerId", user._id).eq("counterpartyId", args.accountId)
      )
      .order("desc")
      .take(25);
    return rows.filter((item) => item.kind === "cardPayment");
  },
});
