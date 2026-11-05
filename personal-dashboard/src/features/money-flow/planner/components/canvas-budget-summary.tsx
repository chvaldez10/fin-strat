import { plannerTotals } from "../totals";
import type { PlannerData } from "../use-planner";
import { MonthlyBudgetSummary } from "./monthly-budget-summary";

export function CanvasBudgetSummary({
  data,
  month,
}: Readonly<{
  data: PlannerData;
  month: string;
}>) {
  const totals = plannerTotals(
    data.entries,
    data.accounts,
    month,
    data.carryInCents,
    data.settlements
  );
  return (
    <MonthlyBudgetSummary
      totals={totals}
      className="shrink-0 rounded-none border-x-0 border-t-0"
    />
  );
}
