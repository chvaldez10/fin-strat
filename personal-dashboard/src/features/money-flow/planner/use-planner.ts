"use client";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import type { FunctionReturnType } from "convex/server";
import { usePlannerMonth } from "./use-planner-month";
import type { useMoneyFlowPlan } from "../persistence/use-money-flow-plan";

export type PlannerData = FunctionReturnType<typeof api.moneyPlanner.getMonth>;
export const PlannerContext = createContext<Readonly<{
  planner: ReturnType<typeof usePlannerState>;
  metadata: ReturnType<typeof useMoneyFlowPlan>;
}> | null>(null);

export function usePlanner() {
  const context = useContext(PlannerContext);
  if (!context)
    throw new Error("usePlanner requires the Money planner provider.");
  return context.planner;
}

export function usePlannerMetadata() {
  const context = useContext(PlannerContext);
  if (!context)
    throw new Error("usePlannerMetadata requires the Money planner provider.");
  return context.metadata;
}

/** Owned by the persistent Money layout, not by individual route pages. */
export function usePlannerState() {
  const { month, setMonth } = usePlannerMonth();
  const data = useQuery(api.moneyPlanner.getMonth, month ? { month } : "skip");
  // This is a scheduled-month planner, not a completion ledger. Historical
  // pending rows returned by the legacy query must not accumulate as debt.
  // Stored completion history remains intact for recovery and old clients.
  const visibleData = useMemo(
    () =>
      data
        ? {
            ...data,
            entries: data.entries.filter(
              (item) => item.month === month && item.status !== "skipped"
            ),
          }
        : undefined,
    [data, month]
  );
  const openMonth = useMutation(api.moneyPlanner.openMonth);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  const ready = data?.ready,
    scheduleRevision = data?.scheduleRevision;
  useEffect(() => {
    if (!month || ready !== false) return;
    let stopped = false;
    void openMonth({ month }).then(
      () => {
        if (!stopped) setError("");
      },
      (cause: unknown) => {
        if (!stopped) setError(errorMessage(cause));
      }
    );
    return () => {
      stopped = true;
    };
  }, [month, ready, scheduleRevision, attempt, openMonth]);
  const retry = useCallback(() => setAttempt((value) => value + 1), []);
  return useMemo(
    () => ({
      month,
      setMonth,
      data: visibleData,
      error,
      retry,
    }),
    [month, setMonth, visibleData, error, retry]
  );
}
export function errorMessage(error: unknown) {
  if (
    error &&
    typeof error === "object" &&
    "data" in error &&
    typeof error.data === "string"
  )
    return error.data;
  return error instanceof Error
    ? error.message.replace(/\[CONVEX[^\]]*\]\s*/g, "")
    : "The change could not be saved. Your input is still here.";
}
