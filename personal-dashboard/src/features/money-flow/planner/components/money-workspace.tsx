"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { usePlanner, usePlannerMetadata } from "../use-planner";
import { useCanvasAccount } from "../use-canvas-account";
import {
  activityCanvasBank,
  activityCanvasBanks,
  bankWorkspaceName,
} from "../activity-canvas-account";
import { MoneyNavigation, moneyPageForPathname } from "./money-navigation";

/** Navigation stays outside the route's loading boundary and page lifecycle. */
export function MoneyWorkspace({
  children,
}: Readonly<{ children: ReactNode }>) {
  const pathname = usePathname();
  const { month, data } = usePlanner();
  const { root } = usePlannerMetadata();
  const { accountId } = useCanvasAccount();
  const bank = activityCanvasBank(
    activityCanvasBanks(data?.accounts ?? []),
    accountId,
    root?.view.selectedAccountId
  );
  const page = moneyPageForPathname(pathname);
  return (
    <div
      className={cn(
        "-m-4 flex min-h-0 min-w-0 flex-1 flex-col md:-m-6",
        page === "canvas" && "h-[calc(100dvh-4rem)] flex-none"
      )}
    >
      <MoneyNavigation
        page={page}
        month={month}
        workspaceName={bankWorkspaceName(bank)}
        account={accountId}
      />
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
