"use client";
import { formatMoney } from "../../calculations";
import type { plannerTotals } from "../totals";
export function MonthlySalarySummary({
  totals,
}: {
  totals: ReturnType<typeof plannerTotals>;
}) {
  return (
    <>
      <section
        aria-label="Salary allocation"
        className="grid grid-cols-2 gap-3 xl:grid-cols-4"
      >
        {[
          {
            label: "Salary / income",
            value: totals.salary,
            helper: "This month's allocation",
            dark: false,
          },
          {
            label: "Expenses & card payments",
            value: totals.expenses,
            helper: "Includes paid and carried bills",
            dark: false,
          },
          {
            label: "Savings & investments",
            value: totals.savings,
            helper: "Allocated from your salary",
            dark: false,
          },
          {
            label:
              totals.remaining < 0
                ? "Over your salary"
                : totals.unknown
                  ? "Known salary remaining"
                  : "Salary remaining",
            value: totals.remaining < 0 ? -totals.remaining : totals.remaining,
            helper:
              totals.remaining < 0
                ? "Commitments exceed salary"
                : "Salary − expenses − savings",
            dark: true,
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className={`rounded-2xl border p-5 ${stat.dark ? (totals.remaining < 0 ? "border-destructive/30 bg-destructive/10" : "border-foreground bg-foreground text-background") : "border-border bg-card"}`}
          >
            <p
              className={`text-xs font-medium ${stat.dark && totals.remaining >= 0 ? "text-background/70" : "text-muted-foreground"}`}
            >
              {stat.label}
            </p>
            <p className="mt-3 text-2xl font-semibold tracking-tight tabular-nums sm:text-3xl">
              {formatMoney(stat.value)}
            </p>
            <p
              className={`mt-2 text-xs ${stat.dark && totals.remaining >= 0 ? "text-background/60" : "text-muted-foreground"}`}
            >
              {stat.helper}
            </p>
          </div>
        ))}
      </section>
      {(totals.unknown > 0 || totals.estimated > 0) && (
        <p
          className="rounded-xl border border-amber-500/25 bg-amber-500/5 px-4 py-3 text-sm"
          aria-live="polite"
        >
          Totals are provisional: {totals.unknown} unknown{" "}
          {totals.unknown === 1 ? "amount" : "amounts"} and {totals.estimated}{" "}
          estimates. Unknown amounts are excluded from the known total.
        </p>
      )}
    </>
  );
}
