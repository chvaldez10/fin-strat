"use client";
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { formatMoney } from "../../calculations";
import { formatYearMonth } from "../../months";

export function YearView({ year }: { year: number }) {
  const rows = useQuery(api.plannerYear.get, { year });
  if (!rows)
    return (
      <p className="p-5 text-sm text-muted-foreground">Loading year view…</p>
    );
  return (
    <section className="overflow-hidden rounded-2xl border border-border">
      <div className="p-5">
        <h2 className="font-semibold">{year} at a glance</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Monthly allocations and recurring plans. Use the monthly planner for
          paid dates and carried bills. Unknown amounts are not treated as
          confirmed zeroes.
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[650px] text-sm">
          <caption className="sr-only">
            Optional yearly allocation overview
          </caption>
          <thead className="bg-muted/30">
            <tr>
              {[
                "Month",
                "Income",
                "Expenses / cards",
                "Savings",
                "Remaining salary",
              ].map((label) => (
                <th
                  key={label}
                  className="px-5 py-3 text-left text-xs font-medium"
                >
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.map((row) => (
              <tr key={row.month}>
                <th scope="row" className="px-5 py-3 text-left font-medium">
                  {formatYearMonth(row.month as `${number}-${number}`)}
                </th>
                {[row.salary, row.expenses, row.savings, row.remaining].map(
                  (value, i) => (
                    <td key={i} className="px-5 py-3 tabular-nums">
                      {formatMoney(value)}
                      {i === 3 && row.unknown > 0 ? " *" : ""}
                    </td>
                  )
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
