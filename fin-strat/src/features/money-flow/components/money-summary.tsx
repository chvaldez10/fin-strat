"use client";

import { memo } from "react";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Landmark,
  TrendingDown,
  TrendingUp,
  WalletCards,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatMoney } from "../calculations";
import type { MoneyFlowTotals } from "../types";

type MoneySummaryProps = {
  totals: MoneyFlowTotals;
};

export const MoneySummary = memo(function MoneySummary({
  totals,
}: MoneySummaryProps) {
  const projectedPositive = totals.projectedBalanceCents >= 0;
  const items = [
    {
      label: "Starting balance",
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
      label: "Projected balance",
      value: totals.projectedBalanceCents,
      icon: projectedPositive ? TrendingUp : TrendingDown,
      valueClassName: projectedPositive
        ? "text-foreground"
        : "text-destructive",
    },
  ];

  return (
    <header className="grid shrink-0 border-b border-border bg-background sm:grid-cols-2 xl:grid-cols-[1.25fr_repeat(4,1fr)]">
      <div className="hidden border-r border-border px-5 py-3 xl:block">
        <div className="flex items-center gap-2">
          <WalletCards className="size-4 text-muted-foreground" />
          <p className="text-sm font-semibold">Monthly money flow</p>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          Direct movement through Chequing
        </p>
      </div>
      {items.map((item) => {
        const Icon = item.icon;

        return (
          <div
            key={item.label}
            className="flex min-w-0 items-center gap-3 border-b border-border px-4 py-3 sm:border-r xl:border-b-0"
          >
            <Icon className="size-4 shrink-0 text-muted-foreground" />
            <div className="min-w-0">
              <p className="truncate text-[0.68rem] font-medium uppercase tracking-[0.12em] text-muted-foreground">
                {item.label}
              </p>
              <p
                className={cn(
                  "mt-0.5 truncate text-lg font-semibold",
                  item.valueClassName
                )}
              >
                {formatMoney(item.value)}
              </p>
            </div>
          </div>
        );
      })}
    </header>
  );
});
