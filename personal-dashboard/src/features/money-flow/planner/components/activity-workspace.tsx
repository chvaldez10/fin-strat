"use client";

import { useMemo, useState, type ReactNode } from "react";
import { MonthPicker } from "@/components/ui/month-picker";
import { localToday } from "../../formatting";
import { MONEY_PATH, monthLink } from "../../routes";
import { ALL_ACCOUNTS, bankWorkspaceName } from "../activity-canvas-account";
import type { ActivityData } from "../activity-data";
import { deriveActivityWorkspace } from "../activity-workspace-data";
import type { FinancialAccount, Payment } from "../types";
import { ActivityCanvas } from "./activity-canvas";
import {
  reviewList,
  type ActivityDraft,
  type ActivityFilter,
  type ActivityListPanel,
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
  frame,
  bank,
  accountControl,
}: Readonly<{
  month: string;
  onMonthChange: (month: string) => void;
  data: ActivityData;
  accounts: FinancialAccount[];
  plans: Payment[];
  frame?: CanvasFrameState;
  bank?: FinancialAccount;
  accountControl?: ReactNode;
}>) {
  const [selection, setSelection] = useState<{
    month: string;
    bankId: string | undefined;
    panel: ActivityPanel;
  } | null>(null);
  const bankId = bank?.id;
  const accountDetailsLink = (accountId: string) =>
    monthLink(
      `${MONEY_PATH}/accounts/${encodeURIComponent(accountId)}`,
      month,
      bank?.legacyAccountId ?? ALL_ACCOUNTS
    );
  const panel =
    selection?.month === month && selection.bankId === bankId
      ? selection.panel
      : null;
  const show = (next: ActivityPanel | null) =>
    setSelection(next ? { month, bankId, panel: next } : null);
  const workspace = useMemo(
    () => deriveActivityWorkspace(data, accounts, plans, bankId),
    [data, accounts, plans, bankId]
  );
  const canLog = accounts.length > 0 && month <= localToday().slice(0, 7);
  const log = (draft: ActivityDraft, back?: ActivityListPanel) => {
    if (!accounts.length) show({ kind: "account" });
    else if (canLog)
      show({
        kind: "entry",
        draft: { ...draft, accountId: draft.accountId ?? bankId },
        back,
      });
  };
  const showActivity = (filter?: ActivityFilter) =>
    show({ kind: "list", view: "recorded", filter });
  const summary = (
    <ActivitySummary
      month={month}
      data={workspace.activity}
      totals={workspace.totals}
      income={workspace.income}
      accounts={workspace.workspaceAccounts}
      canLog={canLog}
      onLog={frame ? undefined : () => log({ kind: "expense" })}
      onIncome={frame ? undefined : () => log({ kind: "income" })}
      onEditIncome={() => show({ kind: "income" })}
      onActivity={showActivity}
      onReview={() => show(reviewList)}
      onPlan={() => show({ kind: "plan" })}
      onImport={() => show({ kind: "import" })}
      onScheduled={() => show({ kind: "list", view: "scheduled" })}
      onTransfers={() =>
        show({ kind: "list", view: "recorded", filter: { type: "transfers" } })
      }
      onAccount={() => show({ kind: "account" })}
    />
  );
  return (
    <>
      {frame ? (
        <ActivityCanvas
          frame={frame}
          data={data}
          accounts={accounts}
          workspace={workspace}
          bank={bank}
          accountControl={accountControl}
          summary={summary}
          canLog={canLog}
          adding={panel?.kind === "add-element"}
          canInspect={
            !panel ||
            panel.kind === "hide-card" ||
            panel.kind === "remove-category"
          }
          accountDetailsLink={accountDetailsLink}
          onShow={show}
          onLog={log}
        />
      ) : (
        <div>
          <div className="flex flex-wrap items-center gap-3 border-b px-4 py-3 sm:px-6">
            <h1 className="mr-2 text-sm font-semibold">
              {bankWorkspaceName(bank)}
            </h1>
            <MonthPicker
              aria-label="Activity month"
              value={month}
              onValueChange={onMonthChange}
            />
          </div>
          {summary}
        </div>
      )}
      <ActivityWorkspaceSheets
        panel={panel}
        month={month}
        data={data}
        accounts={accounts}
        workspace={workspace}
        bankId={bankId}
        canLog={canLog}
        accountDetailsLink={accountDetailsLink}
        onShow={show}
        onLog={log}
      />
    </>
  );
}
