import { ConvexError, v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireUser } from "./permissions";
import { accountsFor } from "./lib/planner";
import { ownedDocument } from "./lib/moneyFlowAccess";
import { assertWorkspaceLease } from "./lib/workspaceLease";

const layoutValues = v.object({
  positions: v.record(v.string(), v.object({ x: v.number(), y: v.number() })),
  viewport: v.object({ x: v.number(), y: v.number(), zoom: v.number() }),
});
export const get = query({
  args: { accountId: v.string() },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx),
      account = (await accountsFor(ctx, user._id)).find(
        (item) => item.legacyAccountId === args.accountId
      );
    const layout = await ctx.db
      .query("moneyPlannerLayouts")
      .withIndex("by_ownerId_and_accountId", (q) =>
        q.eq("ownerId", user._id).eq("accountId", args.accountId)
      )
      .unique();
    return account ? { account, layout } : null;
  },
});
export const saveLayout = mutation({
  args: {
    documentId: v.id("moneyFlowDocuments"),
    accountId: v.string(),
    sessionId: v.string(),
    expectedRevision: v.number(),
    values: layoutValues,
  },
  handler: async (ctx, args) => {
    const document = await ownedDocument(ctx, args.documentId);
    await assertWorkspaceLease(ctx, document, args.accountId, args.sessionId);
    if (
      !(await accountsFor(ctx, document.ownerId)).some(
        (a) => a.legacyAccountId === args.accountId
      )
    )
      throw new ConvexError("Account canvas unavailable.");
    const values = args.values;
    if (
      Object.keys(values.positions).length > 1000 ||
      Object.values(values.positions).some(
        (p) =>
          !Number.isFinite(p.x) ||
          !Number.isFinite(p.y) ||
          Math.abs(p.x) > 100000 ||
          Math.abs(p.y) > 100000
      ) ||
      !Number.isFinite(values.viewport.x) ||
      !Number.isFinite(values.viewport.y) ||
      Math.abs(values.viewport.x) > 100000 ||
      Math.abs(values.viewport.y) > 100000 ||
      !Number.isFinite(values.viewport.zoom) ||
      values.viewport.zoom < 0.3 ||
      values.viewport.zoom > 2
    )
      throw new ConvexError("Canvas position is outside the supported range.");
    const current = await ctx.db
      .query("moneyPlannerLayouts")
      .withIndex("by_ownerId_and_accountId", (q) =>
        q.eq("ownerId", document.ownerId).eq("accountId", args.accountId)
      )
      .unique();
    if (current && current.revision !== args.expectedRevision)
      return {
        status: "conflict" as const,
        current: {
          revision: current.revision,
          workspace: {
            positions: current.positions,
            viewport: current.viewport,
          },
        },
      };
    const revision = (current?.revision ?? 0) + 1;
    if (current) await ctx.db.patch(current._id, { ...values, revision });
    else
      await ctx.db.insert("moneyPlannerLayouts", {
        ownerId: document.ownerId,
        accountId: args.accountId,
        ...values,
        revision,
      });
    return { status: "saved" as const, revision, workspace: values };
  },
});
