"use client";

import { useMemo, useState, type ReactNode } from "react";
import { localToday } from "../../formatting";
import { MONEY_PATH, monthLink } from "../../routes";
import { ALL_ACCOUNTS, activityAccountKey } from "../activity-canvas-account";
import { HOUSEHOLD_CATEGORY } from "../activity";
import type { ActivityData, ActivityFilter } from "../activity-data";
import { deriveActivityWorkspace } from "../activity-workspace-data";
import type { FinancialAccount, Payment, Schedule } from "../types";
import { ActivityCanvas } from "./activity-canvas";
import {
  reviewList,
  type ActivityDraft,
  type ActivityListPanel,
  type ActivityListView,
  type ActivityPanel,
} from "./activity-panels";
import { ActivitySummary } from "./activity-summary";
import { ActivityWorkspaceSheets } from "./activity-workspace-sheets";
import type { CanvasFrameState } from "./planner-canvas-frame";

export function ActivityWorkspace({
  month,
  onMonthChange,
  data,
  accounts,
  plans,
  schedules,
  frame,
  account,
  openExpenses,
  accountControl,
  onAccountCreated,
}: Readonly<{
  month: string;
  onMonthChange: (month: string) => void;
  data: ActivityData;
  accounts: FinancialAccount[];
  plans: Payment[];
  schedules: Schedule[];
  frame?: CanvasFrameState;
  account?: FinancialAccount;
  openExpenses: boolean;
  accountControl?: ReactNode;
  onAccountCreated?: (id: string) => void;
}>) {
  const [selection, setSelection] = useState<{
    month: string;
    accountId: string | undefined;
    panel: ActivityPanel;
  } | null>(null);
  const accountId = account?.id;
  const accountDetailsLink = (id: string) =>
    monthLink(
      `${MONEY_PATH}/accounts/${encodeURIComponent(id)}`,
      month,
      account ? activityAccountKey(account) : ALL_ACCOUNTS
    );
  const panel =
    selection?.month === month && selection.accountId === accountId
      ? selection.panel
      : null;
  const show = (next: ActivityPanel | null) =>
    setSelection(next ? { month, accountId, panel: next } : null);
  const today = localToday();
  const asOf = month === today.slice(0, 7) ? today : month + "-31";
  const workspace = useMemo(
    () =>
      deriveActivityWorkspace(data, accounts, plans, schedules, asOf, account),
    [data, accounts, plans, schedules, asOf, account]
  );
  const canLog = accounts.length > 0 && month <= today.slice(0, 7);
  const log = (draft: ActivityDraft, back?: ActivityListPanel) => {
    if (!accounts.length) show({ kind: "account" });
    else if (canLog)
      show({
        kind: "entry",
        draft: { ...draft, accountId: draft.accountId ?? accountId },
        back,
      });
  };
  const showActivity = (
    filter?: ActivityFilter,
    view: ActivityListView = "recorded"
  ) => show({ kind: "list", view, filter });
  return (
    <>
      <ActivityCanvas
        frame={frame}
        month={month}
        onMonthChange={onMonthChange}
        account={account}
        openExpenses={openExpenses}
        accountControl={accountControl}
        hasAccounts={accounts.length > 0}
        workspace={workspace}
        onActivity={showActivity}
        onLogBill={
          canLog ? () => log({ category: HOUSEHOLD_CATEGORY }) : undefined
        }
        summary={
          <ActivitySummary
            workspace={workspace}
            account={account}
            canLog={canLog}
            hasAccounts={accounts.length > 0}
            onLogExpense={() => log({ kind: "expense" })}
            onLogIncome={() => log({ kind: "income" })}
            onLogSavings={() => log({ kind: "savings" })}
            onActivity={showActivity}
            onReview={() => show(reviewList)}
            onPlan={() => show({ kind: "plan" })}
            onImport={() => show({ kind: "import" })}
            onScheduled={() => show({ kind: "list", view: "scheduled" })}
            onAccount={() => show({ kind: "account" })}
            onUpdateAccount={() => show({ kind: "account", accountId })}
          />
        }
      />
      <ActivityWorkspaceSheets
        panel={panel}
        month={month}
        data={data}
        accounts={accounts}
        workspace={workspace}
        accountId={accountId}
        canLog={canLog}
        accountDetailsLink={accountDetailsLink}
        onAccountCreated={onAccountCreated}
        onShow={show}
        onLog={log}
      />
    </>
  );
}
