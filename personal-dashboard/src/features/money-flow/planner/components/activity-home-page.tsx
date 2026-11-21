"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
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
  activityCanvasAccount,
  activityAccountKey,
  activityAccountName,
} from "../activity-canvas-account";
import { useCanvasAccount } from "../use-canvas-account";

export function ActivityHomePage({
  openExpenses,
}: Readonly<{ openExpenses: boolean }>) {
  const planner = usePlanner();
  const metadata = usePlannerMetadata();
  const choice = useCanvasAccount();
  const { selectAccount } = choice;
  const [createdAccountId, setCreatedAccountId] = useState<string | null>(null);
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
  const createdAccount = data?.accounts.find(
    (item) => item._id === createdAccountId
  );
  const createdAccountKey =
    createdAccount && activityAccountKey(createdAccount);
  useEffect(() => {
    if (createdAccountKey) selectAccount(createdAccountKey);
  }, [createdAccountKey, selectAccount]);
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
  const accounts = data?.accounts ?? [];
  const account = activityCanvasAccount(
    accounts,
    choice.accountId,
    metadata.root?.view.selectedAccountId
  );
  const accountControl = accounts.length > 0 && (
    <AccountSwitcher
      ariaLabel="Choose activity account"
      accounts={accounts.map((item) => ({
        id: activityAccountKey(item),
        name: activityAccountName(item),
        institution: item.institution,
        accountType: item.kind,
      }))}
      allAccounts={{ id: ALL_ACCOUNTS, label: "All accounts" }}
      selectedAccountId={account ? activityAccountKey(account) : ALL_ACCOUNTS}
      onAccountChange={(id) => {
        setCreatedAccountId(null);
        selectAccount(id);
      }}
    />
  );
  if (anchor && metadata.root) {
    return (
      <PlannerCanvasPage
        key={anchor.id}
        accountId={anchor.id}
        accountControl={accountControl}
        activity={{
          data: activity,
          account,
          openExpenses,
          onAccountCreated: setCreatedAccountId,
        }}
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
      schedules={data.scheduleVersions}
      account={account}
      openExpenses={openExpenses}
      accountControl={accountControl}
      onAccountCreated={setCreatedAccountId}
    />
  );
}
