import type { plannerTotals } from "../totals";
import { MonthlyBudgetSummary } from "./monthly-budget-summary";

export function MonthlySalarySummary({
  totals,
}: Readonly<{
  totals: ReturnType<typeof plannerTotals>;
}>) {
  return <MonthlyBudgetSummary totals={totals} />;
}
