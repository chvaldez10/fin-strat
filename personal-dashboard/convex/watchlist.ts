import { paginationOptsValidator } from "convex/server";
import { ConvexError, v } from "convex/values";
import { query, mutation, type QueryCtx } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import { requireUser, hashToken } from "./permissions";
import { boundedText, MAX_ACCOUNTS as MAX_LEGACY_ACCOUNTS } from "./validation";
import { accountsFor, settingsFor } from "./lib/planner";
import {
  CAPTURE_IMPORT_BATCH_SIZE,
  MAX_CAPTURE_ID_LENGTH,
  MAX_CAPTURE_LENGTH,
} from "../src/features/watchlist/captures";
export const list = query({
  args: { paginationOpts: paginationOptsValidator },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    if (args.paginationOpts.numItems > 100)
      throw new ConvexError("Request at most 100 notes.");
    return ctx.db
      .query("watchlistCaptures")
      .withIndex("by_owner_created", (q) => q.eq("ownerId", user._id))
      .order("desc")
      .paginate(args.paginationOpts);
  },
});
export const create = mutation({
  args: { text: v.string() },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    return ctx.db.insert("watchlistCaptures", {
      ownerId: user._id,
      text: boundedText(args.text, "Note", MAX_CAPTURE_LENGTH),
      createdAt: Date.now(),
    });
  },
});
export const remove = mutation({
  args: { id: v.id("watchlistCaptures") },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx),
      record = await ctx.db.get(args.id);
    if (!record || record.ownerId !== user._id)
      throw new ConvexError("Note unavailable or access denied.");
    await ctx.db.delete(record._id);
  },
});
export const importLocal = mutation({
  args: {
    notes: v.array(
      v.object({ id: v.string(), text: v.string(), createdAt: v.string() })
    ),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    if (args.notes.length > CAPTURE_IMPORT_BATCH_SIZE)
      throw new ConvexError(
        `Import at most ${CAPTURE_IMPORT_BATCH_SIZE} notes at a time.`
      );
    const key = "watchlist:" + (await hashToken(JSON.stringify(args.notes)));
    const prior = await ctx.db
      .query("imports")
      .withIndex("by_owner_key", (q) =>
        q.eq("ownerId", user._id).eq("key", key)
      )
      .unique();
    if (prior) return { alreadyImported: true };
    const notesById = new Map<string, (typeof args.notes)[number]>();
    for (const note of args.notes) {
      const createdAt = Date.parse(note.createdAt);
      if (
        !Number.isFinite(createdAt) ||
        !note.id ||
        note.id.length > MAX_CAPTURE_ID_LENGTH
      )
        throw new ConvexError("The backup contains an invalid note.");
      // Preserve the first copy, matching the original ordered import.
      if (!notesById.has(note.id)) notesById.set(note.id, note);
    }
    await Promise.all(
      [...notesById.values()].map(async (note) => {
        const existing = await ctx.db
          .query("watchlistCaptures")
          .withIndex("by_owner_legacy", (q) =>
            q.eq("ownerId", user._id).eq("legacyId", note.id)
          )
          .unique();
        if (existing) return;
        await ctx.db.insert("watchlistCaptures", {
          ownerId: user._id,
          text: boundedText(note.text, "Note", MAX_CAPTURE_LENGTH),
          createdAt: Date.parse(note.createdAt),
          legacyId: note.id,
        });
      })
    );
    await ctx.db.insert("imports", {
      ownerId: user._id,
      key,
      completedAt: Date.now(),
    });
    return { alreadyImported: false };
  },
});
async function moneyAccountCount(ctx: QueryCtx, ownerId: Id<"users">) {
  const accounts = await accountsFor(ctx, ownerId);
  if (await settingsFor(ctx, ownerId)) return accounts.length;

  const legacyPlan = await ctx.db
    .query("moneyFlowDocuments")
    .withIndex("by_owner", (q) => q.eq("ownerId", ownerId))
    .unique();
  if (!legacyPlan) return accounts.length;

  const legacy = await ctx.db
    .query("moneyFlowAccounts")
    .withIndex("by_owner_document", (q) =>
      q.eq("ownerId", ownerId).eq("documentId", legacyPlan._id)
    )
    .take(MAX_LEGACY_ACCOUNTS);
  return new Set([
    ...accounts.map((account) => account.id),
    ...legacy.map((account) => account.accountId),
  ]).size;
}

export const summary = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireUser(ctx),
      notes = await ctx.db
        .query("watchlistCaptures")
        .withIndex("by_owner_created", (q) => q.eq("ownerId", user._id))
        .order("desc")
        .take(101);
    return {
      noteCount: Math.min(notes.length, 100),
      moreNotes: notes.length > 100,
      accountCount: await moneyAccountCount(ctx, user._id),
      recentNotes: notes
        .slice(0, 3)
        .map((note) => ({ id: note._id, text: note.text })),
    };
  },
});
