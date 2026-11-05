import type { Metadata } from "next";
import { MonthlyPlannerPage } from "@/features/money-flow/planner/components/monthly-planner-page";

export const metadata: Metadata = {
  title: "Money Flow | Personal Dashboard",
  description:
    "Monthly salary, expenses, savings, recurring payments and carryover.",
};

export default function MoneyFlowPage() {
  return <MonthlyPlannerPage />;
}
