import { paginationOptsValidator } from "convex/server";
import { ConvexError, v } from "convex/values";
import { query, mutation } from "./_generated/server";
import type { Doc } from "./_generated/dataModel";
import { requireUser, hashToken } from "./permissions";
import { workspace, scenario, view } from "./schema";
import {
  MAX_ACCOUNTS,
  boundedText,
  validateAccount,
  validateScenario,
  validateView,
  validateImport,
  financialSchedule,
  storedAccount,
} from "./validation";
import type { MoneyFlowAccountWorkspace } from "../src/features/money-flow/types";
import { ownedDocument, accountRecord } from "./lib/moneyFlowAccess";
import { assertWorkspaceLease } from "./lib/workspaceLease";
export const getCurrent = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireUser(ctx);
    return ctx.db
      .query("moneyFlowDocuments")
      .withIndex("by_owner", (q) => q.eq("ownerId", user._id))
      .unique();
  },
});
export const listAccounts = query({
  args: {
    documentId: v.id("moneyFlowDocuments"),
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args) => {
    const document = await ownedDocument(ctx, args.documentId);
    if (args.paginationOpts.numItems > MAX_ACCOUNTS)
      throw new ConvexError("Request at most 25 accounts per page.");
    const result = await ctx.db
      .query("moneyFlowAccounts")
      .withIndex("by_owner_document", (q) =>
        q.eq("ownerId", document.ownerId).eq("documentId", document._id)
      )
      .paginate(args.paginationOpts);
    return {
      ...result,
      page: result.page.map((record) => ({
        recordId: record._id,
        revision: record.revision,
        id: record.accountId,
        name: record.workspace.name,
        institution: record.workspace.institution,
        accountType: record.workspace.accountType,
        openingBalanceCents: record.workspace.openingBalanceCents,
        centerNodeId: record.workspace.centerNodeId,
      })),
    };
  },
});
export const getWorkspace = query({
  args: { documentId: v.id("moneyFlowDocuments"), accountId: v.string() },
  handler: async (ctx, args) => {
    const document = await ownedDocument(ctx, args.documentId);
    const record = await accountRecord(ctx, document, args.accountId);
    return { workspace: record.workspace, revision: record.revision };
  },
});
export const createAccount = mutation({
  args: {
    name: v.string(),
    institution: v.string(),
    accountType: v.union(v.literal("chequing"), v.literal("savings")),
    openingBalanceCents: v.number(),
    startMonth: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const name = boundedText(args.name, "Account name"),
      institution = boundedText(args.institution, "Institution");
    if (!Number.isSafeInteger(args.openingBalanceCents))
      throw new ConvexError("Enter a valid opening balance.");
    const proposed = {
      name: "My monthly plan",
      startMonth: args.startMonth,
      forecastMonthCount: 12,
    };
    validateScenario(proposed);
    let document = await ctx.db
      .query("moneyFlowDocuments")
      .withIndex("by_owner", (q) => q.eq("ownerId", user._id))
      .unique();
    const accountId = crypto.randomUUID(),
      centerNodeId = crypto.randomUUID();
    if (!document) {
      const id = await ctx.db.insert("moneyFlowDocuments", {
        ownerId: user._id,
        domainId: crypto.randomUUID(),
        version: 4,
        currency: "CAD",
        scenario: proposed,
        view: {
          selectedAccountId: accountId,
          selectedMonth: args.startMonth,
          mode: "canvas",
        },
        revision: 0,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
      document = (await ctx.db.get(id))!;
    }
    const existing = await ctx.db
      .query("moneyFlowAccounts")
      .withIndex("by_owner_document", (q) =>
        q.eq("ownerId", user._id).eq("documentId", document!._id)
      )
      .take(MAX_ACCOUNTS);
    if (existing.length >= MAX_ACCOUNTS)
      throw new ConvexError("This plan supports up to 25 accounts.");
    const account = {
      id: accountId,
      name,
      institution,
      accountType: args.accountType,
      openingBalanceCents: args.openingBalanceCents,
      centerNodeId,
      nodes: [
        {
          id: centerNodeId,
          kind: "chequing" as const,
          label: name,
          position: { x: 300, y: 180 },
        },
      ],
      transfers: [],
      viewport: { x: 0, y: 0, zoom: 1 },
    };
    await ctx.db.insert("moneyFlowAccounts", {
      ownerId: user._id,
      documentId: document._id,
      accountId,
      workspace: account,
      revision: 0,
      updatedAt: Date.now(),
    });
    if (existing.length === 0)
      await ctx.db.patch(document._id, {
        view: { ...document.view, selectedAccountId: accountId },
        updatedAt: Date.now(),
      });
    return { documentId: document._id, accountId };
  },
});
export const saveWorkspace = mutation({
  args: {
    documentId: v.id("moneyFlowDocuments"),
    accountId: v.string(),
    sessionId: v.string(),
    expectedRevision: v.number(),
    counterpartRevisions: v.record(v.string(), v.number()),
    workspace,
  },
  handler: async (ctx, args) => {
    const document = await ownedDocument(ctx, args.documentId);
    await assertWorkspaceLease(ctx, document, args.accountId, args.sessionId);
    const current = await accountRecord(ctx, document, args.accountId);
    if (current.revision !== args.expectedRevision)
      return {
        status: "conflict" as const,
        current: { workspace: current.workspace, revision: current.revision },
      };
    validateScenario(document.scenario);
    validateAccount(args.workspace, document.scenario);
    if (
      args.workspace.id !== args.accountId ||
      args.workspace.centerNodeId !== current.workspace.centerNodeId
    )
      throw new ConvexError("Account identifiers cannot be changed.");
    const changedTargets = new Map<
      string,
      { record: Doc<"moneyFlowAccounts">; workspace: MoneyFlowAccountWorkspace }
    >();
    const oldById = new Map(current.workspace.transfers.map((t) => [t.id, t]));
    for (const next of args.workspace.transfers) {
      const old = oldById.get(next.id);
      if (
        next.linkedTransferId &&
        (!old ||
          next.linkedTransferId !== old.linkedTransferId ||
          next.counterpartyAccountId !== old.counterpartyAccountId)
      )
        throw new ConvexError(
          "Create linked transfers with the dedicated paired operation."
        );
    }
    for (const old of current.workspace.transfers) {
      if (!old.linkedTransferId || !old.counterpartyAccountId) continue;
      const next = args.workspace.transfers.find((t) => t.id === old.id);
      if (next && next.linkedTransferId !== old.linkedTransferId)
        throw new ConvexError("Linked transfer identity cannot be changed.");
      if (
        next &&
        financialSchedule(
          next as MoneyFlowAccountWorkspace["transfers"][number]
        ) ===
          financialSchedule(
            old as MoneyFlowAccountWorkspace["transfers"][number]
          )
      )
        continue;
      const target = await accountRecord(
        ctx,
        document,
        old.counterpartyAccountId
      );
      if (target.revision !== args.counterpartRevisions[target.accountId])
        return {
          status: "conflict" as const,
          current: { workspace: current.workspace, revision: current.revision },
        };
      const targetWorkspace =
        changedTargets.get(target.accountId)?.workspace ??
        (target.workspace as MoneyFlowAccountWorkspace);
      const reciprocal = targetWorkspace.transfers.filter(
        (t) =>
          t.linkedTransferId === old.linkedTransferId &&
          t.counterpartyAccountId === args.accountId
      );
      if (reciprocal.length !== 1)
        throw new ConvexError(
          "A linked transfer is missing its counterpart. Your edits have not been saved."
        );
      const transfers = next
        ? targetWorkspace.transfers.map((t) =>
            t.id === reciprocal[0].id
              ? {
                  ...t,
                  baseMonthlyAmountCents: next.baseMonthlyAmountCents,
                  startMonth:
                    next.startMonth as MoneyFlowAccountWorkspace["transfers"][number]["startMonth"],
                  endMonth:
                    next.endMonth as MoneyFlowAccountWorkspace["transfers"][number]["endMonth"],
                  monthOverrides: next.monthOverrides,
                  startDate:
                    next.startDate as MoneyFlowAccountWorkspace["transfers"][number]["startDate"],
                  endDate:
                    next.endDate as MoneyFlowAccountWorkspace["transfers"][number]["endDate"],
                }
              : t
          )
        : targetWorkspace.transfers.filter((t) => t.id !== reciprocal[0].id);
      const updated = { ...targetWorkspace, transfers };
      validateAccount(updated, document.scenario);
      changedTargets.set(target.accountId, {
        record: target,
        workspace: updated,
      });
    }
    for (const { record, workspace } of changedTargets.values())
      await ctx.db.patch(record._id, {
        workspace: storedAccount(workspace),
        revision: record.revision + 1,
        updatedAt: Date.now(),
      });
    await ctx.db.patch(current._id, {
      workspace: args.workspace,
      revision: current.revision + 1,
      updatedAt: Date.now(),
    });
    await ctx.db.patch(document._id, { updatedAt: Date.now() });
    return {
      status: "saved" as const,
      revision: current.revision + 1,
      workspace: args.workspace,
      counterpartRevisions: Object.fromEntries(
        [...changedTargets].map(([id, { record }]) => [id, record.revision + 1])
      ),
    };
  },
});
export const saveView = mutation({
  args: {
    documentId: v.id("moneyFlowDocuments"),
    accountId: v.string(),
    sessionId: v.string(),
    view,
  },
  handler: async (ctx, args) => {
    const document = await ownedDocument(ctx, args.documentId);
    await assertWorkspaceLease(ctx, document, args.accountId, args.sessionId);
    validateScenario(document.scenario);
    validateView(args.view, document.scenario);
    await accountRecord(ctx, document, args.view.selectedAccountId);
    await ctx.db.patch(document._id, {
      view: args.view,
      updatedAt: Date.now(),
    });
  },
});
export const updateScenario = mutation({
  args: {
    documentId: v.id("moneyFlowDocuments"),
    scenario,
    expectedRevision: v.number(),
  },
  handler: async (ctx, args) => {
    const document = await ownedDocument(ctx, args.documentId);
    validateScenario(args.scenario);
    validateView(document.view, args.scenario);
    if (document.revision !== args.expectedRevision)
      throw new ConvexError(
        "The scenario changed elsewhere. Reload before saving."
      );
    await ctx.db.patch(document._id, {
      scenario: args.scenario,
      revision: document.revision + 1,
      updatedAt: Date.now(),
    });
  },
});
export const importLocal = mutation({
  args: {
    document: v.any(),
    replaceExisting: v.boolean(),
    expectedRevision: v.optional(v.number()),
    accountRevisions: v.record(v.string(), v.number()),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx),
      imported = validateImport(args.document, user._id);
    const key =
      "money-flow:" + (await hashToken(JSON.stringify(args.document)));
    const prior = await ctx.db
      .query("imports")
      .withIndex("by_owner_key", (q) =>
        q.eq("ownerId", user._id).eq("key", key)
      )
      .unique();
    if (prior) return { alreadyImported: true, documentId: prior.documentId };
    const priorRevisions = new Map<string, number>();
    let current = await ctx.db
      .query("moneyFlowDocuments")
      .withIndex("by_owner", (q) => q.eq("ownerId", user._id))
      .unique();
    if (current) {
      if (!args.replaceExisting || args.expectedRevision !== current.revision)
        throw new ConvexError(
          "A server plan already exists or has changed. Review it before explicitly replacing it."
        );
      const accounts = await ctx.db
        .query("moneyFlowAccounts")
        .withIndex("by_owner_document", (q) =>
          q.eq("ownerId", user._id).eq("documentId", current!._id)
        )
        .take(MAX_ACCOUNTS + 1);
      for (const account of accounts) {
        if (args.accountRevisions[account.accountId] !== account.revision)
          throw new ConvexError(
            "An account changed. Reload before replacing your server plan."
          );
        priorRevisions.set(account.accountId, account.revision);
      }
      for (const account of accounts) await ctx.db.delete(account._id);
      await ctx.db.patch(current._id, {
        domainId: imported.id,
        scenario: imported.scenario,
        view: imported.view,
        revision: current.revision + 1,
        updatedAt: Date.now(),
      });
    } else {
      const id = await ctx.db.insert("moneyFlowDocuments", {
        ownerId: user._id,
        domainId: imported.id,
        version: 4,
        currency: "CAD",
        scenario: imported.scenario,
        view: imported.view,
        revision: 0,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
      current = (await ctx.db.get(id))!;
    }
    for (const account of imported.accounts)
      await ctx.db.insert("moneyFlowAccounts", {
        ownerId: user._id,
        documentId: current._id,
        accountId: account.id,
        workspace: storedAccount(account),
        revision: Math.max(
          current.revision + 1,
          (priorRevisions.get(account.id) ?? -1) + 1
        ),
        updatedAt: Date.now(),
      });
    await ctx.db.insert("imports", {
      ownerId: user._id,
      key,
      completedAt: Date.now(),
      documentId: current._id,
    });
    return { alreadyImported: false, documentId: current._id };
  },
});
