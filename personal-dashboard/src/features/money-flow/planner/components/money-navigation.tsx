"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { MONEY_PATH, monthLink } from "../../routes";

const pages = [
  { key: "canvas", label: "All accounts", suffix: "" },
  { key: "month", label: "Monthly plan", suffix: "/planner" },
  { key: "recurring", label: "Recurring payments", suffix: "/recurring" },
  { key: "subscriptions", label: "Subscriptions", suffix: "/subscriptions" },
  { key: "accounts", label: "Accounts", suffix: "/accounts" },
] as const;
export type MoneyPage = (typeof pages)[number]["key"];

export function moneyPageForPathname(pathname: string): MoneyPage {
  const segment = pathname.slice(MONEY_PATH.length).split("/")[1];
  return pages.find((item) => item.suffix === `/${segment}`)?.key ?? "canvas";
}

/** All Money views use these same destinations and selected-month links. */
export function MoneyNavigation({
  page,
  month,
  workspaceName,
  account,
}: Readonly<{
  page: MoneyPage;
  month: string;
  workspaceName: string;
  account?: string;
}>) {
  const pathname = usePathname();
  const destinations = pages.map((item) => ({
    ...item,
    label: item.key === "canvas" ? workspaceName : item.label,
    href: monthLink(`${MONEY_PATH}${item.suffix}`, month, account),
  }));
  return (
    <nav
      aria-label="Money pages"
      className="shrink-0 border-b border-border bg-background px-4 sm:px-6"
    >
      <div className="hidden items-center gap-6 lg:flex">
        {destinations.map((item) => (
          <Link
            key={item.key}
            href={item.href}
            prefetch={true}
            onNavigate={(event) => {
              if (pathname === `${MONEY_PATH}${item.suffix}`)
                event.preventDefault();
            }}
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
              aria-label={`Money pages: ${destinations.find((item) => item.key === page)?.label}`}
            >
              <span className="min-w-0 truncate">
                {destinations.find((item) => item.key === page)?.label}
              </span>
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
            {destinations.map((item) => (
              <DropdownMenuItem key={item.key} asChild className="min-h-11">
                <Link
                  href={item.href}
                  prefetch={true}
                  onNavigate={(event) => {
                    if (pathname === `${MONEY_PATH}${item.suffix}`)
                      event.preventDefault();
                  }}
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
