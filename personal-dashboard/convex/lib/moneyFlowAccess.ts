import { ConvexError } from "convex/values";
import type { QueryCtx, MutationCtx } from "../_generated/server";
import type { Id, Doc } from "../_generated/dataModel";
import { requireUser } from "../permissions";

export async function ownedDocument(
  ctx: QueryCtx | MutationCtx,
  id: Id<"moneyFlowDocuments">
) {
  const user = await requireUser(ctx);
  const document = await ctx.db.get(id);
  if (!document || document.ownerId !== user._id)
    throw new ConvexError("Plan unavailable or access denied.");
  return document;
}

export async function accountRecord(
  ctx: QueryCtx | MutationCtx,
  document: Doc<"moneyFlowDocuments">,
  id: string
) {
  const account = await ctx.db
    .query("moneyFlowAccounts")
    .withIndex("by_document_account", (q) =>
      q.eq("documentId", document._id).eq("accountId", id)
    )
    .unique();
  if (!account || account.ownerId !== document.ownerId)
    throw new ConvexError("Account unavailable or access denied.");
  return account;
}
