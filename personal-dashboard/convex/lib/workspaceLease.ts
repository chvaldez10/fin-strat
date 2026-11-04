import { ConvexError } from "convex/values";
import type { QueryCtx, MutationCtx } from "../_generated/server";
import type { Doc } from "../_generated/dataModel";

export const WORKSPACE_LEASE_MS = 90_000;

export function workspaceLease(
  ctx: QueryCtx | MutationCtx,
  document: Doc<"moneyFlowDocuments">,
  accountId: string
) {
  return ctx.db
    .query("moneyFlowWorkspaceLeases")
    .withIndex("by_documentId_and_accountId", (q) =>
      q.eq("documentId", document._id).eq("accountId", accountId)
    )
    .unique();
}

/** Checked in the same transaction as a write, fencing out displaced clients. */
export async function assertWorkspaceLease(
  ctx: MutationCtx,
  document: Doc<"moneyFlowDocuments">,
  accountId: string,
  sessionId: string
) {
  const lease = await workspaceLease(ctx, document, accountId);
  if (
    !lease ||
    lease.ownerId !== document.ownerId ||
    lease.sessionId !== sessionId ||
    lease.expiresAt <= Date.now()
  )
    throw new ConvexError({
      code: "WORKSPACE_SESSION_LOST",
      message:
        "This canvas is no longer active in this window. Refresh to take over.",
    });
}
