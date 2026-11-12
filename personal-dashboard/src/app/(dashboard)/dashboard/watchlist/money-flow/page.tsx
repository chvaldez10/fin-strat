import type { Metadata } from "next";
import { ActivityHomePage } from "@/features/money-flow/planner/components/activity-home-page";

export const metadata: Metadata = {
  title: "Money Flow | Personal Dashboard",
  description:
    "Monthly spending, savings and account activity across your bank and credit cards.",
};

export default function MoneyFlowPage() {
  return <ActivityHomePage />;
}
