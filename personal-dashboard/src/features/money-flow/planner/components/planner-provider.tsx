"use client";

import { useMemo, type ReactNode } from "react";
import { useMoneyFlowPlan } from "../../persistence/use-money-flow-plan";
import { PlannerContext, usePlannerState } from "../use-planner";

/** One live subscription remains mounted while moving between Money pages. */
export function PlannerProvider({
  children,
}: Readonly<{ children: ReactNode }>) {
  const planner = usePlannerState();
  const metadata = useMoneyFlowPlan();
  const value = useMemo(() => ({ planner, metadata }), [planner, metadata]);
  return <PlannerContext value={value}>{children}</PlannerContext>;
}
