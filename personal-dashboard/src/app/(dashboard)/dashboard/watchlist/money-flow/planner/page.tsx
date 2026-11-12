import type { Metadata } from "next";
import { MonthlyPlannerPage } from "@/features/money-flow/planner/components/monthly-planner-page";
export const metadata: Metadata = {
  title: "Monthly plan | Personal Dashboard",
  description:
    "Monthly payment checklist, carryover, subscriptions and salary allocation.",
};
export default function Page() {
  return <MonthlyPlannerPage />;
}
