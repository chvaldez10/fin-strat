"use client";
import Link from "next/link";
import type { ReactNode } from "react";
import { CalendarDays, CreditCard, Repeat2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { usePlannerMonth, monthLink } from "../use-planner-month";

export const MONEY_PATH = "/dashboard/watchlist/money-flow";
const pages = [
  { key: "month", label: "Monthly planner", suffix: "", icon: CalendarDays },
  {
    key: "subscriptions",
    label: "Subscriptions",
    suffix: "/subscriptions",
    icon: Repeat2,
  },
  { key: "accounts", label: "Accounts", suffix: "/accounts", icon: CreditCard },
] as const;
export function PlannerShell({
  page,
  title,
  description,
  actions,
  children,
}: {
  page: "month" | "subscriptions" | "accounts";
  title: string;
  description: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  const { month } = usePlannerMonth();
  return (
    <div className="mx-auto w-full max-w-7xl space-y-7 pb-12">
      <header className="space-y-5">
        <nav
          aria-label="Money pages"
          className="flex w-fit max-w-full gap-1 overflow-x-auto rounded-xl border border-border bg-muted/40 p-1"
        >
          {pages.map((item) => (
            <Link
              key={item.key}
              href={monthLink(`${MONEY_PATH}${item.suffix}`, month)}
              aria-current={page === item.key ? "page" : undefined}
              className={cn(
                "inline-flex min-h-10 shrink-0 items-center gap-2 rounded-lg px-3 text-sm font-medium text-muted-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring",
                page === item.key && "bg-background text-foreground shadow-sm"
              )}
            >
              <item.icon className="size-4" aria-hidden="true" />
              {item.key === "month" ? (
                <>
                  <span className="sm:hidden">Month</span>
                  <span className="hidden sm:inline">{item.label}</span>
                </>
              ) : (
                item.label
              )}
            </Link>
          ))}
        </nav>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
              Money
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
              {title}
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              {description}
            </p>
          </div>
          {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
        </div>
      </header>
      {children}
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
