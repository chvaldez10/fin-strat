import { ConvexError, v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { ownedDocument, accountRecord } from "./lib/moneyFlowAccess";
import { workspaceLease, WORKSPACE_LEASE_MS } from "./lib/workspaceLease";

const canvasArgs = {
  documentId: v.id("moneyFlowDocuments"),
  accountId: v.string(),
};
const sessionArgs = { ...canvasArgs, sessionId: v.string() };

// This is an exclusive write lease, not an online-presence record. Keep it
// separate from finance records so heartbeats never change graph revisions.
export const acquire = mutation({
  args: { ...sessionArgs, takeover: v.boolean() },
  handler: async (ctx, args) => {
    const document = await ownedDocument(ctx, args.documentId);
    const account = await accountRecord(ctx, document, args.accountId);
    if (!/^[a-f0-9-]{36}$/.test(args.sessionId))
      throw new ConvexError("Invalid workspace session.");
    const lease = await workspaceLease(ctx, document, args.accountId);
    const now = Date.now();
    if (
      lease?.sessionId &&
      lease.sessionId !== args.sessionId &&
      lease.expiresAt > now &&
      !args.takeover
    )
      return { status: "blocked" as const };
    const generation =
      lease?.sessionId === args.sessionId
        ? lease.generation
        : (lease?.generation ?? 0) + 1;
    const value = {
      ownerId: document.ownerId,
      documentId: document._id,
      accountId: args.accountId,
      sessionId: args.sessionId,
      generation,
      expiresAt: now + WORKSPACE_LEASE_MS,
    };
    if (lease) await ctx.db.patch(lease._id, value);
    else await ctx.db.insert("moneyFlowWorkspaceLeases", value);
    return {
      status: "active" as const,
      generation,
      expiresAt: value.expiresAt,
      serverTime: now,
      snapshot: { workspace: account.workspace, revision: account.revision },
    };
  },
});

export const current = query({
  args: canvasArgs,
  handler: async (ctx, args) => {
    const document = await ownedDocument(ctx, args.documentId);
    await accountRecord(ctx, document, args.accountId);
    const lease = await workspaceLease(ctx, document, args.accountId);
    // No clock-dependent query: expiry is checked by mutations and the client
    // deadline. Queries notify clients immediately on explicit takeovers.
    return lease
      ? {
          sessionId: lease.sessionId,
          generation: lease.generation,
        }
      : null;
  },
});

export const renew = mutation({
  args: sessionArgs,
  handler: async (ctx, args) => {
    const document = await ownedDocument(ctx, args.documentId);
    await accountRecord(ctx, document, args.accountId);
    const lease = await workspaceLease(ctx, document, args.accountId);
    const now = Date.now();
    if (lease?.sessionId !== args.sessionId || lease.expiresAt <= now)
      return { status: "blocked" as const };
    const expiresAt = now + WORKSPACE_LEASE_MS;
    await ctx.db.patch(lease._id, { expiresAt });
    return { status: "active" as const, expiresAt, serverTime: now };
  },
});

export const release = mutation({
  args: sessionArgs,
  handler: async (ctx, args) => {
    const document = await ownedDocument(ctx, args.documentId);
    const lease = await workspaceLease(ctx, document, args.accountId);
    // A late cleanup from the previous owner must never release its successor.
    if (lease?.sessionId === args.sessionId)
      await ctx.db.patch(lease._id, { sessionId: null, expiresAt: 0 });
    return null;
  },
});
