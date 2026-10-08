"use client";

import { memo } from "react";
import {
  ArrowDownLeft,
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  Landmark,
  Table2,
  TrendingDown,
  TrendingUp,
  Workflow,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatMoney } from "../calculations";
import { formatYearMonth } from "../months";
import type {
  MoneyFlowTotals,
  MoneyFlowAccountWorkspace,
  MoneyFlowViewMode,
  YearMonth,
} from "../types";
import { AccountSwitcher } from "./account-switcher";

type MoneySummaryProps = {
  totals: MoneyFlowTotals;
  month: YearMonth;
  viewMode: MoneyFlowViewMode;
  accounts: MoneyFlowAccountWorkspace[];
  selectedAccountId: string;
  canGoPrevious: boolean;
  canGoNext: boolean;
  onPreviousMonth: () => void;
  onNextMonth: () => void;
  onViewModeChange: (mode: MoneyFlowViewMode) => void;
  onAccountChange: (accountId: string) => void;
};

export const MoneySummary = memo(function MoneySummary({
  totals,
  month,
  viewMode,
  accounts,
  selectedAccountId,
  canGoPrevious,
  canGoNext,
  onPreviousMonth,
  onNextMonth,
  onViewModeChange,
  onAccountChange,
}: MoneySummaryProps) {
  const selectedAccount =
    accounts.find((account) => account.id === selectedAccountId) ?? accounts[0];
  const projectedPositive = totals.projectedBalanceCents >= 0;
  const items = [
    {
      label: "Opening balance",
      value: totals.startingBalanceCents,
      icon: Landmark,
    },
    {
      label: "Monthly inflow",
      value: totals.monthlyInflowCents,
      icon: ArrowDownLeft,
      valueClassName: "text-emerald-700 dark:text-emerald-400",
    },
    {
      label: "Monthly outflow",
      value: totals.monthlyOutflowCents,
      icon: ArrowUpRight,
      valueClassName: "text-rose-700 dark:text-rose-400",
    },
    {
      label: "Ending balance",
      value: totals.projectedBalanceCents,
      icon: projectedPositive ? TrendingUp : TrendingDown,
      valueClassName: projectedPositive
        ? "text-foreground"
        : "text-destructive",
    },
  ];

  return (
    <header className="shrink-0 border-b border-border bg-background">
      <div className="grid min-h-14 min-w-0 gap-2 border-b border-border px-3 py-2 sm:flex sm:flex-wrap sm:items-center sm:justify-between sm:gap-3 md:px-4">
        <div className="grid min-w-0 grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-1 sm:flex sm:flex-wrap sm:gap-2">
          <div className="col-span-3 min-w-0 sm:col-span-1">
            <AccountSwitcher
              accounts={accounts}
              selectedAccountId={selectedAccountId}
              onAccountChange={onAccountChange}
            />
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            disabled={!canGoPrevious}
            onClick={onPreviousMonth}
            aria-label="Previous month"
          >
            <ChevronLeft />
          </Button>
          <div className="min-w-0 text-center sm:min-w-36">
            <p className="text-sm font-semibold">{formatYearMonth(month)}</p>
            <p className="text-xs text-muted-foreground">
              {selectedAccount?.institution ?? "Account"} forecast
            </p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            disabled={!canGoNext}
            onClick={onNextMonth}
            aria-label="Next month"
          >
            <ChevronRight />
          </Button>
        </div>

        <div className="flex min-w-0 items-center rounded-md border border-border p-0.5 sm:w-auto">
          <Button
            type="button"
            variant={viewMode === "canvas" ? "secondary" : "ghost"}
            size="sm"
            className="flex-1 sm:flex-none"
            onClick={() => onViewModeChange("canvas")}
          >
            <Workflow />
            Canvas
          </Button>
          <Button
            type="button"
            variant={viewMode === "table" ? "secondary" : "ghost"}
            size="sm"
            className="flex-1 sm:flex-none"
            onClick={() => onViewModeChange("table")}
          >
            <Table2 />
            Table
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-4">
        {items.map((item) => {
          const Icon = item.icon;

          return (
            <div
              key={item.label}
              className="flex min-w-0 items-center gap-2 border-b border-border px-3 py-2.5 even:border-l sm:gap-3 sm:px-4 sm:py-3 xl:border-b-0 xl:border-l-0 xl:border-r"
            >
              <Icon className="size-4 shrink-0 text-muted-foreground" />
              <div className="min-w-0">
                <p className="truncate text-[0.68rem] font-medium uppercase tracking-[0.12em] text-muted-foreground">
                  {item.label}
                </p>
                <p
                  className={cn(
                    "mt-0.5 truncate text-base font-semibold sm:text-lg",
                    item.valueClassName
                  )}
                >
                  {formatMoney(item.value)}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </header>
  );
});
