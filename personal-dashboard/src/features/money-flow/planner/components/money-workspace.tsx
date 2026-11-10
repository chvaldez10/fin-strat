"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { usePlanner } from "../use-planner";
import { MoneyNavigation, moneyPageForPathname } from "./money-navigation";

/** Navigation stays outside the route's loading boundary and page lifecycle. */
export function MoneyWorkspace({
  children,
}: Readonly<{ children: ReactNode }>) {
  const pathname = usePathname();
  const { month } = usePlanner();
  const page = moneyPageForPathname(pathname);
  return (
    <div
      className={cn(
        "-m-4 flex min-h-0 min-w-0 flex-1 flex-col md:-m-6",
        page === "canvas" && "h-[calc(100dvh-4rem)] flex-none"
      )}
    >
      <MoneyNavigation page={page} month={month} />
      <div
        className={cn(
          "min-w-0",
          page === "canvas" && "flex min-h-0 flex-1 flex-col"
        )}
      >
        {children}
      </div>
    </div>
  );
}
