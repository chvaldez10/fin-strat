import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";
import { formatMoney } from "../../calculations";
import type { plannerTotals } from "../totals";

/** Shared financial hierarchy for the canvas and monthly details. */
export function MonthlyBudgetSummary({
  totals,
  className,
  ...props
}: ComponentProps<"section"> & { totals: ReturnType<typeof plannerTotals> }) {
  const overBudget = totals.remaining < 0;
  return (
    <section
      aria-label="Monthly salary coverage"
      className={cn("rounded-xl border border-border bg-card", className)}
      {...props}
    >
      <dl className="grid grid-cols-2 sm:grid-cols-4">
        {[
          { label: "Income", amount: totals.salary },
          { label: "Expenses", amount: totals.expenses },
          { label: "Savings", amount: totals.savings },
          {
            label: overBudget
              ? "Over budget"
              : totals.unknown
                ? "Known remaining"
                : "Remaining",
            amount: Math.abs(totals.remaining),
          },
        ].map((stat, index) => (
          <div
            key={stat.label}
            className={cn(
              "min-w-0 px-4 py-4 sm:px-5",
              index === 3 && "rounded-br-xl bg-muted/40 sm:rounded-r-xl"
            )}
          >
            <dt className="text-xs text-muted-foreground">{stat.label}</dt>
            <dd
              className={cn(
                "mt-1 text-xl font-semibold tracking-tight tabular-nums sm:text-2xl",
                index === 3 && overBudget && "text-destructive"
              )}
            >
              {formatMoney(stat.amount)}
            </dd>
          </div>
        ))}
      </dl>
      {overBudget && (
        <output className="block px-4 pb-3 text-sm text-destructive sm:px-5">
          Expenses and savings exceed your income.
        </output>
      )}
      {(totals.unknown > 0 || totals.estimated > 0) && (
        <p
          aria-live="polite"
          className="border-t border-border px-4 py-2 text-xs text-muted-foreground sm:px-5"
        >
          Provisional: {totals.unknown} unknown amounts and {totals.estimated}{" "}
          estimates. Unknown amounts are excluded.
        </p>
      )}
    </section>
  );
}
