"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useQueries } from "convex/react";
import { Button } from "@/components/ui/button";
import { api } from "@convex/_generated/api";
import type { ActivityData } from "../activity-data";
import { usePlanner, usePlannerMetadata } from "../use-planner";
import { MONEY_PATH, monthLink } from "../../routes";
import { ActivityWorkspace } from "./activity-workspace";
import { PlannerCanvasPage } from "./planner-canvas-page";
import { PlannerLoading } from "./planner-shell";
import { AccountSwitcher } from "../../components/account-switcher";
import {
  ALL_ACCOUNTS,
  activityCanvasBank,
  activityCanvasBanks,
  bankWorkspaceName,
} from "../activity-canvas-account";
import { useCanvasAccount } from "../use-canvas-account";

export function ActivityHomePage() {
  const planner = usePlanner();
  const metadata = usePlannerMetadata();
  const choice = useCanvasAccount();
  const { month } = planner;
  const requests = useMemo(() => {
    const queries: Parameters<typeof useQueries>[0] = {};
    if (month)
      queries.activity = {
        query: api.plannerActivity.getMonth,
        args: { month },
      };
    return queries;
  }, [month]);
  const activity = useQueries(requests).activity as
    ActivityData | Error | undefined;
  const data = planner.data;
  if (activity instanceof Error)
    return (
      <div className="space-y-3 p-4 sm:p-6">
        <PlannerLoading
          error="Monthly activity could not load."
          onRetry={() => window.location.reload()}
        />
        <Button variant="outline" asChild>
          <Link href={monthLink(`${MONEY_PATH}/upcoming`, month)}>
            Open scheduled canvas
          </Link>
        </Button>
      </div>
    );
  if (metadata.isLoading)
    return <PlannerLoading error={planner.error} onRetry={planner.retry} />;
  const anchor = metadata.accounts[0];
  if (anchor && metadata.root) {
    const banks = activityCanvasBanks(data?.accounts ?? []);
    const bank = activityCanvasBank(
      banks,
      choice.accountId,
      metadata.root.view.selectedAccountId
    );
    return (
      <PlannerCanvasPage
        key={anchor.id}
        accountId={anchor.id}
        accountControl={
          <AccountSwitcher
            ariaLabel="Switch money workspace"
            accounts={banks.map((item) => ({
              id: item.legacyAccountId!,
              name: bankWorkspaceName(item),
              institution: item.institution,
              accountType: item.kind === "savings" ? "savings" : "chequing",
            }))}
            allAccounts={{ id: ALL_ACCOUNTS, label: "All accounts" }}
            selectedAccountId={bank?.legacyAccountId ?? ALL_ACCOUNTS}
            onAccountChange={choice.selectAccount}
          />
        }
        activity={{ data: activity, bank }}
      />
    );
  }
  if (!activity || !data?.ready)
    return <PlannerLoading error={planner.error} onRetry={planner.retry} />;
  return (
    <ActivityWorkspace
      month={planner.month}
      onMonthChange={planner.setMonth}
      data={activity}
      accounts={data.accounts}
      plans={data.entries}
    />
  );
}
