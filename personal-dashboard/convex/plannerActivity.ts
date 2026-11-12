import { ConvexError, v } from "convex/values";
import { mutation, query, type MutationCtx } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import { requireUser } from "./permissions";
import {
  activityCategoryKind,
  activityValues,
  statementDirection,
} from "./activitySchema";
import {
  accountsFor,
  canvasWriteSession,
  checkCanvasWrite,
  checkDate,
  checkMoney,
  checkMonth,
} from "./lib/planner";
import {
  activityCategories,
  activityEntries,
  activityImports,
  activityMonth,
  attachImport,
  invalidateReview,
  matchedImports,
  MAX_ACTIVITY_CATEGORIES,
  MAX_ACTIVITY_ROWS,
  ownedActivity,
  pendingImport,
  validateActivity,
  validateStatementValues,
} from "./lib/activity";
import {
  DEFAULT_CATEGORIES,
  matchesScheduledActivity,
  matchesStatement,
} from "../src/features/money-flow/planner/activity";

export const getMonth = query({
  args: { month: v.string() },
  handler: async (ctx, { month }) => {
    const user = await requireUser(ctx);
    checkMonth(month);
    const [categories, entries, imports, plan] = await Promise.all([
      activityCategories(ctx, user._id),
      activityEntries(ctx, user._id, month),
      activityImports(ctx, user._id, month),
      activityMonth(ctx, user._id, month),
    ]);
    return {
      categories,
      entries,
      plan,
      pending: imports.filter((row) => row.status === "pending"),
      matches: imports
        .filter((row) => row.status === "matched")
        .map(({ accountId, entryId }) => ({ accountId, entryId })),
    };
  },
});

async function findOrCreateCategory(
  ctx: MutationCtx,
  ownerId: Id<"users">,
  input: { name: string; kind: "expense" | "savings" }
) {
  const name = input.name.trim();
  if (!name || name.length > 60)
    throw new ConvexError("Enter a category name up to 60 characters.");
  const categories = await activityCategories(ctx, ownerId);
  if (categories.some((row) => row.name.toLowerCase() === name.toLowerCase()))
    throw new ConvexError(
      "That category already exists. Choose it from the list."
    );
  if (categories.length >= MAX_ACTIVITY_CATEGORIES + DEFAULT_CATEGORIES.length)
    throw new ConvexError("You have reached the category limit.");
  return ctx.db.insert("moneyActivityCategories", {
    ownerId,
    name,
    kind: input.kind,
  });
}

export const saveMonth = mutation({
  args: {
    month: v.string(),
    expectedRevision: v.number(),
    canvas: canvasWriteSession,
    change: v.union(
      v.object({
        field: v.literal("allocation"),
        categoryId: v.string(),
        amountCents: v.union(v.number(), v.null()),
      }),
      v.object({
        field: v.literal("newAllocation"),
        name: v.string(),
        kind: activityCategoryKind,
        amountCents: v.union(v.number(), v.null()),
      }),
      v.object({
        field: v.literal("spendingLimit"),
        amountCents: v.union(v.number(), v.null()),
      }),
      v.object({
        field: v.literal("review"),
        date: v.union(v.string(), v.null()),
      })
    ),
  },
  handler: async (ctx, { month, change, expectedRevision, canvas }) => {
    const user = await requireUser(ctx);
    checkMonth(month);
    await checkCanvasWrite(ctx, canvas);
    const previous = await activityMonth(ctx, user._id, month);
    if ((previous?.revision ?? 0) !== expectedRevision)
      throw new ConvexError(
        "This month changed. Reopen the editor before saving."
      );
    const next = {
      allocations: { ...previous?.allocations },
      spendingLimitCents: previous?.spendingLimitCents ?? null,
      reviewedThrough: previous?.reviewedThrough ?? null,
      revision: expectedRevision + 1,
    };
    if (change.field === "allocation") {
      const categories = await activityCategories(ctx, user._id);
      if (!categories.some((row) => row.id === change.categoryId))
        throw new ConvexError("Choose an available category.");
      checkMoney(change.amountCents);
      if (change.amountCents === null)
        delete next.allocations[change.categoryId];
      else next.allocations[change.categoryId] = change.amountCents;
    } else if (change.field === "newAllocation") {
      checkMoney(change.amountCents);
      const id = await findOrCreateCategory(ctx, user._id, change);
      if (change.amountCents !== null)
        next.allocations[id] = change.amountCents;
    } else if (change.field === "spendingLimit") {
      checkMoney(change.amountCents);
      next.spendingLimitCents = change.amountCents;
    } else {
      if (change.date) {
        checkDate(change.date);
        if (change.date.slice(0, 7) !== month)
          throw new ConvexError("Choose a review date in this month.");
        const rows = await activityImports(ctx, user._id, month);
        if (
          rows.some(
            (row) => row.status === "pending" && row.date <= change.date!
          )
        )
          throw new ConvexError(
            "Review the imported transactions through that date first."
          );
      }
      next.reviewedThrough = change.date;
    }
    if (previous) await ctx.db.patch(previous._id, next);
    else
      await ctx.db.insert("moneyActivityMonths", {
        ...next,
        ownerId: user._id,
        month,
      });
    return null;
  },
});

export const saveEntry = mutation({
  args: {
    month: v.string(),
    canvas: canvasWriteSession,
    requestId: v.string(),
    id: v.union(v.id("moneyActivityEntries"), v.null()),
    expectedRevision: v.number(),
    values: activityValues,
    planId: v.union(v.id("moneyPlannerPayments"), v.null()),
    importId: v.union(v.id("moneyActivityImports"), v.null()),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const ownerId = user._id;
    checkMonth(args.month);
    await checkCanvasWrite(ctx, args.canvas);
    if (!/^[a-f0-9-]{36}$/.test(args.requestId))
      throw new ConvexError("Reopen the editor before saving.");
    const values = {
      ...args.values,
      description: args.values.description.trim(),
    };
    await validateActivity(ctx, ownerId, args.month, values);
    const old = args.id
      ? await ownedActivity(ctx, ownerId, args.id, args.expectedRevision)
      : null;
    if (old && old.month !== args.month)
      throw new ConvexError("Open the transaction's month before editing.");
    if (!old) {
      const prior = await ctx.db
        .query("moneyActivityEntries")
        .withIndex("by_ownerId_and_requestId", (q) =>
          q.eq("ownerId", ownerId).eq("requestId", args.requestId)
        )
        .unique();
      if (prior) {
        if (
          prior.planId !== args.planId ||
          Object.entries(values).some(
            ([key, value]) => prior[key as keyof typeof values] !== value
          )
        )
          throw new ConvexError(
            "An earlier version was saved. Reopen it from Activity to make changes."
          );
        return prior._id;
      }
    }
    if (args.planId && args.planId !== old?.planId) {
      const planned = await ctx.db.get(args.planId);
      if (
        !planned ||
        planned.ownerId !== ownerId ||
        planned.month !== args.month ||
        planned.status !== "pending" ||
        !matchesScheduledActivity(planned, values)
      )
        throw new ConvexError(
          "Choose a transaction matching this scheduled payment."
        );
      const recorded = await ctx.db
        .query("moneyActivityEntries")
        .withIndex("by_ownerId_and_planId", (q) =>
          q.eq("ownerId", ownerId).eq("planId", args.planId)
        )
        .unique();
      if (recorded)
        throw new ConvexError(
          "This scheduled payment already has a recorded transaction."
        );
    }
    const imported = args.importId
      ? await pendingImport(ctx, ownerId, args.importId)
      : null;
    if (old) {
      if (
        old.planId &&
        args.planId === old.planId &&
        (values.kind !== old.kind ||
          values.accountId !== old.accountId ||
          values.destinationId !== old.destinationId)
      )
        throw new ConvexError("Keep the linked payment's type and accounts.");
      const matches = await matchedImports(ctx, ownerId, old._id);
      if (matches.some((row) => !matchesStatement(values, row)))
        throw new ConvexError(
          "Keep the date, amount and accounts from the matched statement. Remove this entry to review its import again."
        );
      await ctx.db.patch(old._id, {
        ...values,
        planId: args.planId,
        revision: old.revision + 1,
      });
      if (imported) await attachImport(ctx, imported, values, old._id);
      return old._id;
    }
    const rows = await activityEntries(ctx, ownerId, args.month);
    if (rows.length >= MAX_ACTIVITY_ROWS)
      throw new ConvexError("This month has reached its transaction limit.");
    const id = await ctx.db.insert("moneyActivityEntries", {
      ...values,
      month: args.month,
      ownerId,
      requestId: args.requestId,
      planId: args.planId,
      revision: 0,
    });
    if (imported) await attachImport(ctx, imported, values, id);
    return id;
  },
});

export const removeEntry = mutation({
  args: {
    id: v.id("moneyActivityEntries"),
    expectedRevision: v.number(),
    canvas: canvasWriteSession,
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    await checkCanvasWrite(ctx, args.canvas);
    const entry = await ownedActivity(
      ctx,
      user._id,
      args.id,
      args.expectedRevision
    );
    const matches = await matchedImports(ctx, user._id, entry._id);
    await Promise.all(
      matches.map((row) =>
        ctx.db.patch(row._id, { status: "pending", entryId: null })
      )
    );
    if (matches.length)
      await invalidateReview(ctx, user._id, entry.month, entry.date);
    await ctx.db.delete(entry._id);
    return null;
  },
});

export const importRows = mutation({
  args: {
    accountId: v.string(),
    month: v.string(),
    canvas: canvasWriteSession,
    rows: v.array(
      v.object({
        date: v.string(),
        description: v.string(),
        amountCents: v.number(),
        direction: statementDirection,
      })
    ),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const ownerId = user._id;
    checkMonth(args.month);
    await checkCanvasWrite(ctx, args.canvas);
    if (!args.rows.length || args.rows.length > 500)
      throw new ConvexError("Import between 1 and 500 transactions at a time.");
    if (
      !(await accountsFor(ctx, ownerId)).some(
        (row) => row.id === args.accountId
      )
    )
      throw new ConvexError("Choose an available account.");
    const occurrences = new Map<string, number>();
    const rows = args.rows.map((input) => {
      const row = { ...input, description: input.description.trim() };
      validateStatementValues(args.month, row);
      const key = JSON.stringify([
        args.accountId,
        row.date,
        row.amountCents,
        row.direction,
        row.description.toLowerCase(),
      ]);
      const occurrence = (occurrences.get(key) ?? 0) + 1;
      occurrences.set(key, occurrence);
      return { ...row, fingerprint: `${key}:${occurrence}` };
    });
    const lookedUp = await Promise.all(
      rows.map(async (row) => ({
        row,
        existing: await ctx.db
          .query("moneyActivityImports")
          .withIndex("by_ownerId_and_fingerprint", (q) =>
            q.eq("ownerId", ownerId).eq("fingerprint", row.fingerprint)
          )
          .unique(),
      }))
    );
    const fresh = lookedUp
      .filter(({ existing }) => !existing)
      .map(({ row }) => row);
    if (!fresh.length) return { added: 0, duplicates: rows.length };
    if (
      (await activityImports(ctx, ownerId, args.month)).length + fresh.length >
      MAX_ACTIVITY_ROWS
    )
      throw new ConvexError("This month has reached its import limit.");
    await Promise.all(
      fresh.map((row) =>
        ctx.db.insert("moneyActivityImports", {
          ...row,
          ownerId,
          accountId: args.accountId,
          month: args.month,
          status: "pending",
          entryId: null,
        })
      )
    );
    const earliest = fresh.reduce(
      (date, row) => (row.date < date ? row.date : date),
      fresh[0].date
    );
    await invalidateReview(ctx, ownerId, args.month, earliest);
    return { added: fresh.length, duplicates: rows.length - fresh.length };
  },
});

export const reviewImport = mutation({
  args: {
    id: v.id("moneyActivityImports"),
    canvas: canvasWriteSession,
    entryId: v.union(v.id("moneyActivityEntries"), v.null()),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    await checkCanvasWrite(ctx, args.canvas);
    const row = await pendingImport(ctx, user._id, args.id);
    if (!args.entryId) {
      await ctx.db.patch(row._id, { status: "ignored" });
      return null;
    }
    const entry = await ctx.db.get(args.entryId);
    if (!entry || entry.ownerId !== user._id)
      throw new ConvexError("Choose a transaction from your activity.");
    await attachImport(ctx, row, entry, entry._id);
    return null;
  },
});
