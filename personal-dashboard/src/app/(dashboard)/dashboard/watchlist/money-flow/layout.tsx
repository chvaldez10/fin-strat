import type { ReactNode } from "react";
import { MoneyWorkspace } from "@/features/money-flow/planner/components/money-workspace";
import { PlannerProvider } from "@/features/money-flow/planner/components/planner-provider";

export default function MoneyLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return (
    <PlannerProvider>
      <MoneyWorkspace>{children}</MoneyWorkspace>
    </PlannerProvider>
  );
}
