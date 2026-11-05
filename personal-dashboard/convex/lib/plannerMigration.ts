import { ConvexError } from "convex/values";
import type { MutationCtx } from "../_generated/server";
import type { Id } from "../_generated/dataModel";
import {
  formatDateOnly,
  calendarDate,
  daysInCalendarMonth,
} from "../../src/lib/date-only";
import { accountsFor, seriesFor, checkMoney } from "./planner";

/** Copy legacy financial intent once. Original graph records remain intact. */
export async function importLegacyPlan(ctx: MutationCtx, ownerId: Id<"users">) {
  const root = await ctx.db
    .query("moneyFlowDocuments")
    .withIndex("by_owner", (q) => q.eq("ownerId", ownerId))
    .unique();
  if (!root) return;
  const oldAccounts = await ctx.db
    .query("moneyFlowAccounts")
    .withIndex("by_owner_document", (q) =>
      q.eq("ownerId", ownerId).eq("documentId", root._id)
    )
    .take(26);
  if (oldAccounts.length > 25)
    throw new ConvexError(
      "Review the legacy plan before importing more than 25 accounts."
    );
  const accounts = await accountsFor(ctx, ownerId);
  const series = await seriesFor(ctx, ownerId);
  const layouts = await Promise.all(
    oldAccounts.map((old) =>
      ctx.db
        .query("moneyPlannerLayouts")
        .withIndex("by_ownerId_and_accountId", (q) =>
          q.eq("ownerId", ownerId).eq("accountId", old.accountId)
        )
        .unique()
    )
  );
  // Validate and prepare the whole bounded import before starting writes.
  const writes: Array<() => Promise<unknown>> = [];
  let count = series.length;
  for (const old of oldAccounts) {
    const account = old.workspace;
    checkMoney(account.openingBalanceCents, true);
    if (!accounts.some((item) => item.id === old.accountId))
      writes.push(() =>
        ctx.db.insert("moneyPlannerAccounts", {
          ownerId,
          id: old.accountId,
          name: account.name,
          institution: account.institution,
          kind: account.accountType,
          balanceCents: account.openingBalanceCents,
          balanceUpdatedAt: null,
          legacyAccountId: old.accountId,
          revision: 0,
        })
      );
    const positions: Record<string, { x: number; y: number }> = {};
    for (const transfer of account.transfers) {
      checkMoney(transfer.baseMonthlyAmountCents);
      for (const value of Object.values(transfer.monthOverrides ?? {}))
        checkMoney(value);
      const incoming = transfer.targetNodeId === account.centerNodeId;
      const outgoing = transfer.sourceNodeId === account.centerNodeId;
      if ((!incoming && !outgoing) || (incoming && transfer.linkedTransferId))
        continue;
      const node = account.nodes.find(
        (item) =>
          item.id === (incoming ? transfer.sourceNodeId : transfer.targetNodeId)
      );
      const legacyKey = `${old.accountId}:${transfer.id}`;
      const prior = series.find((item) => item.legacyKey === legacyKey);
      const seriesId = prior?.seriesId ?? crypto.randomUUID();
      if (node) positions[seriesId] = node.position;
      if (prior) continue;
      if (++count > 1000)
        throw new ConvexError(
          "This plan has too many schedules for automatic migration. The original canvas data is preserved."
        );
      const target = oldAccounts.find(
        (item) => item.accountId === transfer.counterpartyAccountId
      );
      const kind = incoming
        ? "income"
        : transfer.linkedTransferId
          ? target?.workspace.accountType === "savings"
            ? "savings"
            : "transfer"
          : node?.kind === "account"
            ? "savings"
            : "expense";
      const [endYear, endMonth] = (transfer.endMonth ?? "2000-01")
        .split("-")
        .map(Number);
      writes.push(() =>
        ctx.db.insert("moneyPlannerSeries", {
          ownerId,
          seriesId,
          name: transfer.label || node?.label || "Imported payment",
          kind,
          isSubscription: false,
          amountCents: transfer.baseMonthlyAmountCents,
          estimated: false,
          accountId: old.accountId,
          counterpartyId: transfer.counterpartyAccountId ?? null,
          frequency: "monthly",
          startDate: transfer.startDate ?? `${transfer.startMonth}-01`,
          endDate:
            transfer.endDate ??
            (transfer.endMonth
              ? formatDateOnly(
                  calendarDate(
                    endYear,
                    endMonth - 1,
                    daysInCalendarMonth(endYear, endMonth - 1)
                  )
                )
              : null),
          secondDay: null,
          notes:
            "Imported monthly plan. Payment status has not been confirmed.",
          status: "active",
          effectiveFrom: transfer.startDate ?? `${transfer.startMonth}-01`,
          effectiveTo: null,
          revision: 0,
          legacyKey,
          monthOverrides: transfer.monthOverrides,
        })
      );
    }
    const layout = layouts.find((item) => item?.accountId === old.accountId);
    if (!layout) {
      const central = account.nodes.find(
        (item) => item.id === account.centerNodeId
      );
      writes.push(() =>
        ctx.db.insert("moneyPlannerLayouts", {
          ownerId,
          accountId: old.accountId,
          positions: {
            ...positions,
            center: central?.position ?? { x: 500, y: 240 },
          },
          viewport: account.viewport,
          revision: 0,
        })
      );
    }
  }
  await Promise.all(writes.map((write) => write()));
}

export async function assertLegacyNotMigrated(
  ctx: MutationCtx,
  ownerId: Id<"users">
) {
  const migrated = await ctx.db
    .query("moneyPlannerSettings")
    .withIndex("by_ownerId", (q) => q.eq("ownerId", ownerId))
    .unique();
  if (migrated)
    throw new ConvexError(
      "This plan now uses the monthly planner. Reopen Money to edit the shared payment records."
    );
}
