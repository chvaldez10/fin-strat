"use client";

import Link from "next/link";
import { ChevronDown, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { monthLink } from "../use-planner-month";

export const MONEY_PATH = "/dashboard/watchlist/money-flow";
const pages = [
  { key: "canvas", label: "Canvas", suffix: "" },
  { key: "month", label: "Monthly details", suffix: "/planner" },
  { key: "recurring", label: "Recurring payments", suffix: "/recurring" },
  { key: "subscriptions", label: "Subscriptions", suffix: "/subscriptions" },
  { key: "accounts", label: "Accounts", suffix: "/accounts" },
] as const;
export type MoneyPage = (typeof pages)[number]["key"];

/** All Money views use these same destinations and selected-month links. */
export function MoneyNavigation({
  page,
  month,
}: Readonly<{
  page: MoneyPage;
  month: string;
}>) {
  return (
    <nav
      aria-label="Money pages"
      className="shrink-0 border-b border-border bg-background px-4 sm:px-6"
    >
      <div className="hidden items-center gap-6 lg:flex">
        {pages.map((item) => (
          <Link
            key={item.key}
            href={monthLink(`${MONEY_PATH}${item.suffix}`, month)}
            aria-current={page === item.key ? "page" : undefined}
            className={cn(
              "inline-flex min-h-12 items-center border-b-2 border-transparent text-sm font-medium text-muted-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring",
              page === item.key && "border-foreground text-foreground"
            )}
          >
            {item.label}
          </Link>
        ))}
      </div>
      <div className="py-2 lg:hidden">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="w-full justify-between px-0"
              aria-label={`Money pages: ${pages.find((item) => item.key === page)?.label}`}
            >
              {pages.find((item) => item.key === page)?.label}
              <ChevronDown
                className="size-4 text-muted-foreground"
                aria-hidden="true"
              />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="start"
            className="w-(--radix-dropdown-menu-trigger-width)"
          >
            {pages.map((item) => (
              <DropdownMenuItem key={item.key} asChild className="min-h-11">
                <Link
                  href={monthLink(`${MONEY_PATH}${item.suffix}`, month)}
                  aria-current={page === item.key ? "page" : undefined}
                >
                  {item.label}
                  {page === item.key && (
                    <Check className="ml-auto size-4" aria-hidden="true" />
                  )}
                </Link>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </nav>
  );
}
