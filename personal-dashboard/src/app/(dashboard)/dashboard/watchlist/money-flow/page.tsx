import type { Metadata } from "next";
import { CanvasHomePage } from "@/features/money-flow/planner/components/canvas-home-page";

export const metadata: Metadata = {
  title: "Money Flow | Personal Dashboard",
  description:
    "Monthly salary, expenses, savings, recurring payments and carryover.",
};

export default function MoneyFlowPage() {
  return (
    <div className="-m-4 min-w-0 overflow-hidden md:-m-6">
      <CanvasHomePage />
    </div>
  );
}
