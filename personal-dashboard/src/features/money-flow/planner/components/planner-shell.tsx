"use client";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { usePlannerMonth } from "../use-planner-month";
import { MoneyNavigation, type MoneyPage } from "./money-navigation";
export { MONEY_PATH } from "./money-navigation";

export function PlannerShell({
  page,
  title,
  description,
  actions,
  children,
}: {
  page: Exclude<MoneyPage, "canvas">;
  title: string;
  description: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  const { month } = usePlannerMonth();
  return (
    <div className="-m-4 md:-m-6">
      <MoneyNavigation page={page} month={month} />
      <div className="mx-auto w-full max-w-7xl space-y-6 px-4 py-6 pb-12 sm:px-6">
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
              {description}
            </p>
          </div>
          {actions && (
            <div className="flex shrink-0 items-center gap-2">{actions}</div>
          )}
        </header>
        {children}
      </div>
    </div>
  );
}
export function PlannerLoading({
  error,
  onRetry,
}: {
  error: string;
  onRetry: () => void;
}) {
  return (
    <div className="rounded-2xl border border-border p-8">
      <p aria-live="polite" className="text-sm text-muted-foreground">
        {error || "Loading your monthly planner…"}
      </p>
      {error && (
        <Button variant="outline" className="mt-4" onClick={onRetry}>
          Retry loading
        </Button>
      )}
    </div>
  );
}
