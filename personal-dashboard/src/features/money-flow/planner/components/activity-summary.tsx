"use client";

import Link from "next/link";
import { ArrowUpRight, ChevronDown, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { formatMoney } from "../../calculations";
import type { ActivityData } from "../activity-data";
import type {
  ActivitySummary as Totals,
  IncomeDisplay,
} from "../activity-projection";
import type { FinancialAccount, Payment } from "../types";
import { monthLink } from "../use-planner-month";
import { MONEY_PATH } from "./money-navigation";

export type ActivityFilter = {
  type?: "income" | "spending" | "savings" | "used" | "transfers";
  categoryId?: string;
  accountId?: string;
};

export function ActivitySummary({
  month,
  data,
  totals,
  income,
  accounts,
  scheduled,
  canLog,
  onLog,
  onIncome,
  onEditIncome,
  onPlan,
  onReview,
  onActivity,
  onImport,
  onScheduled,
  onTransfers,
  onAccount,
}: Readonly<{
  month: string;
  data: ActivityData;
  totals: Totals;
  income: IncomeDisplay;
  accounts: FinancialAccount[];
  scheduled: Payment[];
  canLog: boolean;
  onLog?: () => void;
  onIncome?: () => void;
  onEditIncome: () => void;
  onPlan: () => void;
  onReview: () => void;
  onActivity: (filter?: ActivityFilter) => void;
  onImport: () => void;
  onScheduled: () => void;
  onTransfers: () => void;
  onAccount: () => void;
}>) {
  const snapshots = accounts.filter((item) => item.balanceUpdatedAt !== null);
  const banks = snapshots.filter((item) => item.kind !== "credit");
  const cards = snapshots.filter((item) => item.kind === "credit");
  const cash = banks.reduce((sum, item) => sum + item.balanceCents, 0);
  const owed = cards.reduce((sum, item) => sum + item.balanceCents, 0);
  const outflows = scheduled.filter(
    (row) =>
      row.kind !== "income" &&
      row.kind !== "transfer" &&
      accounts.find((account) => account.id === row.accountId)?.kind !==
        "credit"
  );
  const upcoming = outflows.reduce(
    (sum, row) => sum + (row.amountCents ?? 0),
    0
  );
  const provisional = outflows.some(
    (row) => row.estimated || row.amountCents === null
  );
  const limit = totals.limitRemaining;
  const showingPlan = income.label !== "Income received";
  const net =
    income.amountCents === null ? null : income.amountCents - totals.used;
  const stats = [
    {
      label: "Income",
      cents: income.amountCents,
      detail: showingPlan
        ? `${income.label} · ${income.detail}`
        : income.detail,
      open: onEditIncome,
    },
    {
      label: "Used",
      cents: totals.used,
      open: () => onActivity({ type: "used" }),
      detail:
        limit !== null && limit < 0
          ? `${formatMoney(Math.abs(limit))} over spending limit`
          : `${formatMoney(totals.spent)} expenses · ${formatMoney(totals.saved)} savings`,
      warn: limit !== null && limit < 0,
    },
    {
      label: "Net",
      cents: net,
      detail: showingPlan
        ? `Using ${income.label.toLowerCase()}`
        : "Income − Used",
      warn: net !== null && net < 0,
    },
  ];
  return (
    <section
      className="shrink-0 border-b border-border bg-background"
      aria-label="Monthly activity overview"
    >
      <div className="grid grid-cols-3 divide-x divide-border">
        {stats.map((item) => {
          const Tile = item.open ? "button" : "div";
          return (
            <Tile
              key={item.label}
              type={item.open ? "button" : undefined}
              onClick={item.open}
              className={cn(
                "min-w-0 border-b border-border px-3 py-2.5 text-left sm:px-6 sm:py-3",
                item.open &&
                  "hover:bg-muted/40 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring"
              )}
            >
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                {item.label}
                {item.open && (
                  <ArrowUpRight
                    className="size-3 shrink-0 opacity-60"
                    aria-hidden="true"
                  />
                )}
              </span>
              <span
                className={cn(
                  "block wrap-anywhere text-lg font-semibold tracking-tight tabular-nums sm:text-2xl",
                  item.warn && "text-destructive"
                )}
              >
                {item.cents === null
                  ? "Amount unknown"
                  : formatMoney(item.cents)}
              </span>
              {item.detail && (
                <span
                  className={cn(
                    "block text-xs text-muted-foreground",
                    item.warn && "text-destructive"
                  )}
                >
                  {item.detail}
                </span>
              )}
            </Tile>
          );
        })}
      </div>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-2 text-xs text-muted-foreground sm:px-6">
        <Link
          className="rounded-sm hover:text-foreground focus-visible:outline-ring"
          href={monthLink(`${MONEY_PATH}/accounts`, month)}
        >
          Bank balances {banks.length ? formatMoney(cash) : "—"} · Card debt{" "}
          {cards.length ? formatMoney(owed) : "—"}
        </Link>
        <button
          type="button"
          className="rounded-sm hover:text-foreground focus-visible:outline-ring"
          onClick={onScheduled}
        >
          Scheduled outflows {provisional ? "≈ " : ""}
          {formatMoney(upcoming)}
        </button>
        <button
          type="button"
          className="rounded-sm hover:text-foreground focus-visible:outline-ring"
          onClick={onReview}
        >
          {data.plan?.reviewedThrough
            ? `Reviewed through ${data.plan.reviewedThrough}`
            : "Review bank activity"}
        </button>
      </div>
      <div className="flex flex-wrap items-center gap-2 px-4 pb-2 sm:px-6">
        {accounts.length ? (
          onLog && (
            <Button
              size="sm"
              className="min-h-9"
              disabled={!canLog}
              onClick={onLog}
            >
              <Plus aria-hidden="true" /> Log money out
            </Button>
          )
        ) : (
          <Button size="sm" onClick={onAccount}>
            <Plus aria-hidden="true" /> Add account
          </Button>
        )}
        <Button
          size="sm"
          className="min-h-9"
          variant="outline"
          onClick={() => onActivity()}
        >
          Activity
        </Button>
        {data.pending.length > 0 && (
          <Button
            size="sm"
            className="min-h-9"
            variant="outline"
            onClick={onReview}
          >
            Review ({data.pending.length})
          </Button>
        )}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="sm" className="min-h-9" variant="ghost">
              More <ChevronDown aria-hidden="true" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            {onIncome && (
              <DropdownMenuItem disabled={!canLog} onSelect={onIncome}>
                Log income
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onSelect={onPlan}>
              Monthly amounts
            </DropdownMenuItem>
            <DropdownMenuItem
              disabled={!accounts.length || !canLog}
              onSelect={onImport}
            >
              Import CSV
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={onReview}>
              Review bank activity
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={onScheduled}>
              Scheduled payments
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={onTransfers}>
              Transfers
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href={monthLink(`${MONEY_PATH}/upcoming`, month)}>
                Scheduled canvas
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </section>
  );
}
