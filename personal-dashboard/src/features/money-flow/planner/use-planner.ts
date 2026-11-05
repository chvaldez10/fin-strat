"use client";
import { useEffect, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import type { FunctionReturnType } from "convex/server";
import { usePlannerMonth } from "./use-planner-month";

export type PlannerData = FunctionReturnType<typeof api.moneyPlanner.getMonth>;
export function usePlanner() {
  const { month, setMonth } = usePlannerMonth();
  const data = useQuery(api.moneyPlanner.getMonth, month ? { month } : "skip");
  const openMonth = useMutation(api.moneyPlanner.openMonth);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  const ready = data?.ready,
    scheduleRevision = data?.scheduleRevision;
  useEffect(() => {
    if (!month || ready) return;
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
  return {
    month,
    setMonth,
    data,
    error,
    retry: () => setAttempt((value) => value + 1),
  };
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
