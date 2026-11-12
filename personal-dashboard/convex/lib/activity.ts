import { ConvexError } from "convex/values";
import type { Doc, Id } from "../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../_generated/server";
import { accountsFor, bounded, checkDate, checkMoney } from "./planner";
import {
  categoryKind,
  DEFAULT_CATEGORIES,
  matchesStatement,
  type ActivityValues,
} from "../../src/features/money-flow/planner/activity";

export const MAX_ACTIVITY_ROWS = 1000;
export const MAX_ACTIVITY_CATEGORIES = 80;
type Ctx = QueryCtx | MutationCtx;

export function activityMonth(ctx: Ctx, ownerId: Id<"users">, month: string) {
  return ctx.db
    .query("moneyActivityMonths")
    .withIndex("by_ownerId_and_month", (q) =>
      q.eq("ownerId", ownerId).eq("month", month)
    )
    .unique();
}

export async function activityCategories(ctx: Ctx, ownerId: Id<"users">) {
  const custom = await bounded(
    ctx.db
      .query("moneyActivityCategories")
      .withIndex("by_ownerId", (q) => q.eq("ownerId", ownerId))
      .take(MAX_ACTIVITY_CATEGORIES + 1),
    MAX_ACTIVITY_CATEGORIES,
    "activity categories"
  );
  return [
    ...DEFAULT_CATEGORIES,
    ...custom.map(({ _id, name, kind }) => ({ id: _id, name, kind })),
  ];
}

export function activityEntries(ctx: Ctx, ownerId: Id<"users">, month: string) {
  return bounded(
    ctx.db
      .query("moneyActivityEntries")
      .withIndex("by_ownerId_and_month", (q) =>
        q.eq("ownerId", ownerId).eq("month", month)
      )
      .take(MAX_ACTIVITY_ROWS + 1),
    MAX_ACTIVITY_ROWS,
    "transactions this month"
  );
}

export function activityImports(ctx: Ctx, ownerId: Id<"users">, month: string) {
  return bounded(
    ctx.db
      .query("moneyActivityImports")
      .withIndex("by_ownerId_and_month", (q) =>
        q.eq("ownerId", ownerId).eq("month", month)
      )
      .take(MAX_ACTIVITY_ROWS + 1),
    MAX_ACTIVITY_ROWS,
    "imported transactions this month"
  );
}

export async function validateActivity(
  ctx: MutationCtx,
  ownerId: Id<"users">,
  month: string,
  values: ActivityValues
) {
  validateStatementValues(month, values);
  const [accounts, categories] = await Promise.all([
    accountsFor(ctx, ownerId),
    activityCategories(ctx, ownerId),
  ]);
  const source = accounts.find((account) => account.id === values.accountId);
  const destination = accounts.find(
    (account) => account.id === values.destinationId
  );
  if (!source || (values.destinationId !== null && !destination))
    throw new ConvexError("Choose an available account.");
  const kind = categoryKind(values.kind);
  if (
    kind
      ? !categories.some(
          (item) => item.id === values.categoryId && item.kind === kind
        )
      : values.categoryId !== null
  )
    throw new ConvexError("Choose a category that matches this activity.");
  if (
    source.kind === "credit" &&
    values.kind !== "expense" &&
    values.kind !== "refund"
  )
    throw new ConvexError("Choose a bank account for this activity.");
  if (source.id === destination?.id)
    throw new ConvexError("Choose two different accounts.");
  if (values.kind === "cardPayment" && destination?.kind !== "credit")
    throw new ConvexError("Choose the credit card you repaid.");
  if (
    values.kind === "transfer" &&
    (!destination || destination.kind === "credit")
  )
    throw new ConvexError("Choose another bank account for the transfer.");
  if (
    values.kind === "savings" &&
    destination &&
    destination.kind !== "savings"
  )
    throw new ConvexError("Choose a savings account as the destination.");
  if (
    destination &&
    !["transfer", "savings", "cardPayment"].includes(values.kind)
  )
    throw new ConvexError("This activity has a single account.");
}

export function validateStatementValues(
  month: string,
  row: { date: string; amountCents: number; description: string }
) {
  checkDate(row.date);
  if (row.date.slice(0, 7) !== month)
    throw new ConvexError("Choose a date in the selected month.");
  checkMoney(row.amountCents);
  if (row.amountCents <= 0)
    throw new ConvexError("Enter an amount greater than zero.");
  if (!row.description.trim() || row.description.length > 160)
    throw new ConvexError("Enter a description up to 160 characters.");
}

export async function ownedActivity(
  ctx: MutationCtx,
  ownerId: Id<"users">,
  id: Id<"moneyActivityEntries">,
  revision: number
) {
  const entry = await ctx.db.get(id);
  if (!entry || entry.ownerId !== ownerId || entry.revision !== revision)
    throw new ConvexError(
      "This transaction changed. Reopen it before editing."
    );
  return entry;
}

export async function pendingImport(
  ctx: MutationCtx,
  ownerId: Id<"users">,
  id: Id<"moneyActivityImports">
) {
  const row = await ctx.db.get(id);
  if (!row || row.ownerId !== ownerId || row.status !== "pending")
    throw new ConvexError(
      "This imported transaction has already been reviewed."
    );
  return row;
}

export function matchedImports(
  ctx: Ctx,
  ownerId: Id<"users">,
  entryId: Id<"moneyActivityEntries">
) {
  return ctx.db
    .query("moneyActivityImports")
    .withIndex("by_ownerId_and_entryId", (q) =>
      q.eq("ownerId", ownerId).eq("entryId", entryId)
    )
    .take(3);
}

export async function attachImport(
  ctx: MutationCtx,
  row: Doc<"moneyActivityImports">,
  entry: ActivityValues,
  entryId: Id<"moneyActivityEntries">
) {
  if (!matchesStatement(entry, row))
    throw new ConvexError("Match the imported date, amount and account.");
  const alreadyMatched = await matchedImports(ctx, row.ownerId, entryId);
  if (alreadyMatched.some((item) => item.accountId === row.accountId))
    throw new ConvexError(
      "This activity already matches an imported row for that account."
    );
  await ctx.db.patch(row._id, { status: "matched", entryId });
}

export async function invalidateReview(
  ctx: MutationCtx,
  ownerId: Id<"users">,
  month: string,
  earliestDate: string
) {
  const record = await activityMonth(ctx, ownerId, month);
  if (record?.reviewedThrough && earliestDate <= record.reviewedThrough)
    await ctx.db.patch(record._id, {
      reviewedThrough: null,
      revision: record.revision + 1,
    });
}
