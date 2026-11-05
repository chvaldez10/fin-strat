import { ConvexError, v } from "convex/values";
import { ownedDocument } from "./moneyFlowAccess";
import { assertWorkspaceLease } from "./workspaceLease";
import type { MutationCtx, QueryCtx } from "../_generated/server";
import type { Doc, Id } from "../_generated/dataModel";
import { isYearMonth, addMonths } from "../../src/features/money-flow/months";
import { parseDateOnly } from "../../src/lib/date-only";
import { schedulePayments } from "../../src/features/money-flow/planner/recurrence";
import type {
  PaymentValues,
  Schedule,
} from "../../src/features/money-flow/planner/types";

export const canvasWriteSession = v.optional(
  v.object({
    documentId: v.id("moneyFlowDocuments"),
    accountId: v.string(),
    sessionId: v.string(),
  })
);
export async function checkCanvasWrite(
  ctx: MutationCtx,
  session:
    | {
        documentId: Id<"moneyFlowDocuments">;
        accountId: string;
        sessionId: string;
      }
    | undefined
) {
  if (session) {
    const document = await ownedDocument(ctx, session.documentId);
    await assertWorkspaceLease(
      ctx,
      document,
      session.accountId,
      session.sessionId
    );
  }
}

export const MAX_SERIES = 1000,
  MAX_MONTH_PAYMENTS = 1000,
  MAX_ACCOUNTS = 50;
export function checkMonth(month: string) {
  if (!isYearMonth(month) || month < "1900-01" || month > "2200-12")
    throw new ConvexError("Choose a month between 1900 and 2200.");
}
export function checkDate(date: string) {
  if (!parseDateOnly(date)) throw new ConvexError("Choose a valid date.");
  checkMonth(date.slice(0, 7));
}
export function checkMoney(value: number | null, negative = false) {
  if (
    value !== null &&
    (!Number.isSafeInteger(value) ||
      Math.abs(value) > 1_000_000_000_000 ||
      (!negative && value < 0))
  )
    throw new ConvexError(
      "Enter a valid amount with at most two decimal places."
    );
}
export async function bounded<T>(
  rows: Promise<T[]>,
  limit: number,
  label: string
) {
  const result = await rows;
  if (result.length > limit)
    throw new ConvexError(
      `Too many ${label} to load safely. Narrow or archive older records first.`
    );
  return result;
}
export function settingsFor(ctx: QueryCtx | MutationCtx, ownerId: Id<"users">) {
  return ctx.db
    .query("moneyPlannerSettings")
    .withIndex("by_ownerId", (q) => q.eq("ownerId", ownerId))
    .unique();
}
export function accountsFor(ctx: QueryCtx | MutationCtx, ownerId: Id<"users">) {
  return bounded(
    ctx.db
      .query("moneyPlannerAccounts")
      .withIndex("by_ownerId", (q) => q.eq("ownerId", ownerId))
      .take(MAX_ACCOUNTS + 1),
    MAX_ACCOUNTS,
    "accounts"
  );
}
export function seriesFor(ctx: QueryCtx | MutationCtx, ownerId: Id<"users">) {
  return bounded(
    ctx.db
      .query("moneyPlannerSeries")
      .withIndex("by_ownerId", (q) => q.eq("ownerId", ownerId))
      .take(MAX_SERIES + 1),
    MAX_SERIES,
    "recurring schedule versions"
  );
}
export function monthFor(
  ctx: QueryCtx | MutationCtx,
  ownerId: Id<"users">,
  month: string
) {
  return ctx.db
    .query("moneyPlannerMonths")
    .withIndex("by_ownerId_and_month", (q) =>
      q.eq("ownerId", ownerId).eq("month", month)
    )
    .unique();
}
export async function checkPayment(
  ctx: QueryCtx | MutationCtx,
  ownerId: Id<"users">,
  values: PaymentValues
) {
  if (
    !values.name.trim() ||
    values.name.length > 120 ||
    values.notes.length > 2000
  )
    throw new ConvexError(
      "Enter a name (up to 120 characters) and notes up to 2000 characters."
    );
  checkDate(values.dueDate);
  checkMoney(values.amountCents);
  checkMoney(values.statementAmountCents);
  if (values.statementMonth) checkMonth(values.statementMonth);
  const accounts = await accountsFor(ctx, ownerId);
  const source = accounts.find((a) => a.id === values.accountId);
  const target = accounts.find((a) => a.id === values.counterpartyId);
  if ((values.accountId && !source) || (values.counterpartyId && !target))
    throw new ConvexError("The selected account is unavailable.");
  if (values.isSubscription && values.kind !== "expense")
    throw new ConvexError("Subscriptions must be expenses.");
  if (values.kind !== "expense" && source?.kind === "credit")
    throw new ConvexError(
      "Choose a bank account for income, savings or repayments."
    );
  if (values.kind === "cardPayment" && target?.kind !== "credit")
    throw new ConvexError("Choose the credit account being paid.");
  if (
    values.kind !== "cardPayment" &&
    (values.statementMonth || values.statementAmountCents !== null)
  )
    throw new ConvexError("Statement fields belong to credit-card payments.");
  if (
    values.kind === "transfer" &&
    (!source || !target || source.id === target.id || target.kind === "credit")
  )
    throw new ConvexError("Choose two different bank accounts for a transfer.");
}
export async function ownedPayment(
  ctx: MutationCtx,
  ownerId: Id<"users">,
  id: Id<"moneyPlannerPayments">,
  revision: number
) {
  const item = await ctx.db.get(id);
  if (!item || item.ownerId !== ownerId)
    throw new ConvexError("Payment unavailable.");
  if (item.revision !== revision)
    throw new ConvexError(
      "This payment changed in another window. Reopen it before saving."
    );
  return item;
}
export async function materializeMonth(
  ctx: MutationCtx,
  settings: Doc<"moneyPlannerSettings">,
  month: string
) {
  checkMonth(month);
  const record = await monthFor(ctx, settings.ownerId, month);
  if (record?.closed || record?.generatedRevision === settings.scheduleRevision)
    return;
  const schedules = await seriesFor(ctx, settings.ownerId);
  const generated = schedules.flatMap((schedule) =>
    schedulePayments(schedule, month)
  );
  if (generated.length > MAX_MONTH_PAYMENTS)
    throw new ConvexError("This month has more than 1000 payments.");
  const existing = await bounded(
    ctx.db
      .query("moneyPlannerPayments")
      .withIndex("by_ownerId_and_month", (q) =>
        q.eq("ownerId", settings.ownerId).eq("month", month)
      )
      .take(MAX_MONTH_PAYMENTS + 1),
    MAX_MONTH_PAYMENTS,
    "monthly payments"
  );
  const desired = new Map(generated.map((item) => [item.occurrenceKey, item]));
  await Promise.all(
    existing.map(async (old) => {
      if (!old.seriesId || old.modified || old.status !== "pending") return;
      const next = desired.get(old.occurrenceKey);
      if (!next) await ctx.db.delete(old._id);
      else if (
        Object.entries(next.values).some(
          ([key, value]) => old[key as keyof typeof next.values] !== value
        )
      )
        await ctx.db.patch(old._id, {
          ...next.values,
          revision: old.revision + 1,
        });
    })
  );
  await Promise.all(
    [...desired.values()].map(async (next) => {
      // The unique key follows the original occurrence, including rescheduled
      // instances now displayed in another month. Never generate a second copy.
      const prior = await ctx.db
        .query("moneyPlannerPayments")
        .withIndex("by_ownerId_and_occurrenceKey", (q) =>
          q
            .eq("ownerId", settings.ownerId)
            .eq("occurrenceKey", next.occurrenceKey)
        )
        .unique();
      if (!prior)
        await ctx.db.insert("moneyPlannerPayments", {
          ownerId: settings.ownerId,
          ...next.values,
          occurrenceKey: next.occurrenceKey,
          seriesId: next.seriesId,
          originalDate: next.originalDate,
          month,
          status: "pending",
          paidOn: null,
          modified: false,
          carryForward: month >= settings.startMonth,
          revision: 0,
        });
    })
  );
  if (record)
    await ctx.db.patch(record._id, {
      generatedRevision: settings.scheduleRevision,
    });
  else
    await ctx.db.insert("moneyPlannerMonths", {
      ownerId: settings.ownerId,
      month,
      carryInCents: null,
      carryOutCents: null,
      closed: false,
      revision: 0,
      generatedRevision: settings.scheduleRevision,
    });
}
export function paymentShape(schedule: Schedule): PaymentValues {
  return {
    name: schedule.name,
    kind: schedule.kind,
    isSubscription: schedule.isSubscription,
    amountCents: schedule.amountCents,
    estimated: schedule.estimated,
    accountId: schedule.accountId,
    counterpartyId: schedule.counterpartyId,
    notes: schedule.notes,
    dueDate: schedule.startDate,
    statementMonth: null,
    statementAmountCents: null,
  };
}
export { addMonths };
