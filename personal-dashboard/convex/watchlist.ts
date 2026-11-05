import { paginationOptsValidator } from "convex/server";
import { ConvexError, v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { requireUser, hashToken } from "./permissions";
import { boundedText } from "./validation";
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
      text: boundedText(args.text, "Note", 500),
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
    if (args.notes.length > 200)
      throw new ConvexError("Import at most 200 notes at a time.");
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
      if (!Number.isFinite(createdAt) || !note.id || note.id.length > 120)
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
          text: boundedText(note.text, "Note", 500),
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
export const summary = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireUser(ctx),
      notes = await ctx.db
        .query("watchlistCaptures")
        .withIndex("by_owner_created", (q) => q.eq("ownerId", user._id))
        .order("desc")
        .take(101);
    const plan = await ctx.db
      .query("moneyFlowDocuments")
      .withIndex("by_owner", (q) => q.eq("ownerId", user._id))
      .unique();
    const accounts = plan
      ? await ctx.db
          .query("moneyFlowAccounts")
          .withIndex("by_owner_document", (q) =>
            q.eq("ownerId", user._id).eq("documentId", plan._id)
          )
          .take(25)
      : [];
    return {
      noteCount: Math.min(notes.length, 100),
      moreNotes: notes.length > 100,
      accountCount: accounts.length,
      recentNotes: notes
        .slice(0, 3)
        .map((note) => ({ id: note._id, text: note.text })),
    };
  },
});
