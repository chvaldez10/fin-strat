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
import type { FinancialAccount } from "../types";
import { MONEY_PATH, monthLink } from "../../routes";

export type ActivityFilter = {
  type?: "income" | "spending" | "savings" | "used" | "transfers";
  categoryId?: string;
  accountId?: string;
  paymentGroup?: Readonly<{
    id: string;
    name: string;
    paymentIds: readonly string[];
  }>;
};

export function ActivitySummary({
  month,
  data,
  totals,
  income,
  accounts,
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
      <div className="flex flex-wrap items-center gap-2 px-4 py-2 sm:px-6">
        {accounts.length ? (
          onLog && (
            <Button
              size="sm"
              className="min-h-9"
              disabled={!canLog}
              onClick={onLog}
            >
              <Plus aria-hidden="true" /> Log expense
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
          Transactions
        </Button>
        {data.pending.length > 0 && (
          <Button
            size="sm"
            className="min-h-9"
            variant="outline"
            onClick={onReview}
          >
            Review imports ({data.pending.length})
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
            <DropdownMenuItem onSelect={onScheduled}>
              Upcoming payments
            </DropdownMenuItem>
            <DropdownMenuItem
              disabled={!accounts.length || !canLog}
              onSelect={onImport}
            >
              Import CSV
            </DropdownMenuItem>
            {data.pending.length === 0 && (
              <DropdownMenuItem onSelect={onReview}>
                Review imports
              </DropdownMenuItem>
            )}
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
