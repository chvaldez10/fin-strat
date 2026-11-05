import type { plannerTotals } from "../totals";
import { MonthlyBudgetSummary } from "./monthly-budget-summary";

export function MonthlySalarySummary({
  totals,
}: {
  totals: ReturnType<typeof plannerTotals>;
}) {
  return <MonthlyBudgetSummary totals={totals} />;
}
