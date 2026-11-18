import Link from "next/link";
import { EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ActivityData } from "../activity-data";
import type { ActivityWorkspaceData } from "../activity-workspace-data";
import type { FinancialAccount } from "../types";
import { AccountEditor } from "./account-editor";
import { ActivityEntryEditor } from "./activity-entry-editor";
import { ActivityEntryRemoval } from "./activity-entry-removal";
import { ActivityImportEditor } from "./activity-import-editor";
import { ActivityImportReview } from "./activity-import-review";
import { ActivityIncomeInspector } from "./activity-income-inspector";
import { ActivityListSheet } from "./activity-list-sheet";
import { ActivityPlanEditor } from "./activity-plan-editor";
import { ActivityScheduledRemoval } from "./activity-scheduled-removal";
import { PaymentEditor } from "./payment-editor";
import { PlannerSheet, PlannerSheetHost } from "./planner-form";
import {
  activityViewNames,
  reviewList,
  type ActivityDraft,
  type ActivityListPanel,
  type ActivityPanel,
} from "./activity-panels";

export function ActivityWorkspaceSheets({
  panel,
  month,
  data,
  accounts,
  workspace,
  bankId,
  canLog,
  accountDetailsLink,
  onShow: show,
  onLog: log,
}: Readonly<{
  panel: ActivityPanel | null;
  month: string;
  data: ActivityData;
  accounts: FinancialAccount[];
  workspace: ActivityWorkspaceData;
  bankId?: string;
  canLog: boolean;
  accountDetailsLink: (accountId: string) => string;
  onShow: (panel: ActivityPanel | null) => void;
  onLog: (draft: ActivityDraft, back?: ActivityListPanel) => void;
}>) {
  if (!panel || panel.kind === "add-element") return null;
  const close = () => show(null);
  const {
    activity,
    workspaceAccounts,
    scheduled,
    totals,
    receivedIncome,
    scheduledIncome,
  } = workspace;
  const showCategoryActivity = (category: { id: string }) =>
    show({
      kind: "list",
      view: "recorded",
      filter: { categoryId: category.id },
    });
  if (panel.kind === "income")
    return (
      <ActivityIncomeInspector
        key={month + "-" + (bankId ?? "all")}
        month={month}
        presentation="sheet"
        received={receivedIncome}
        scheduled={scheduledIncome}
        categories={data.categories}
        accounts={accounts}
        defaultAccountId={bankId}
        canLog={canLog}
        onClose={close}
        onLogScheduled={(planned) => log({ planned })}
      />
    );
  if (panel.kind === "plan")
    return (
      <ActivityPlanEditor
        month={month}
        data={data}
        bucket={totals.buckets.find((item) => item.id === panel.categoryId)}
        onClose={close}
        onLog={canLog ? (category) => log({ category }) : undefined}
        onView={showCategoryActivity}
      />
    );

  const listPanel = panel.kind === "list" ? panel : panel.back;
  return (
    <PlannerSheetHost>
      {listPanel && (
        <ActivityListSheet
          key={`${month}-${listPanel.view}-${listPanel.filter?.paymentGroup?.id ?? listPanel.filter?.accountId ?? listPanel.filter?.categoryId ?? listPanel.filter?.type ?? "all"}`}
          month={month}
          data={listPanel.filter?.paymentGroup ? data : activity}
          accounts={workspaceAccounts}
          scheduled={scheduled}
          initialView={listPanel.view}
          active={panel.kind === "list"}
          filter={listPanel.filter}
          header={
            listPanel.filter?.accountId &&
            (() => {
              const account = accounts.find(
                (item) => item.id === listPanel.filter?.accountId
              );
              if (!account) return null;
              const hide = listPanel.hideAccountCard;
              return (
                <div className="flex flex-wrap items-center gap-2">
                  <Button size="sm" variant="outline" asChild>
                    <Link href={accountDetailsLink(account.id)}>
                      Account details
                    </Link>
                  </Button>
                  {hide && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        show({
                          kind: "hide-card",
                          name: account.name,
                          from: "expenses",
                          hide,
                          back: listPanel,
                        })
                      }
                    >
                      <EyeOff aria-hidden="true" /> Hide card…
                    </Button>
                  )}
                </div>
              );
            })()
          }
          notice={listPanel.notice}
          canLog={canLog}
          onClose={close}
          onEdit={(entry) => log({ entry }, listPanel)}
          onDelete={(entry) =>
            show({
              kind: "delete-entry",
              entry,
              back: listPanel,
            })
          }
          onRecord={(planned) => log({ planned }, listPanel)}
          onEditScheduled={(payment) =>
            show({
              kind: "scheduled-payment",
              payment,
              back: listPanel,
            })
          }
          onDeleteScheduled={(payment) =>
            show({
              kind: "delete-scheduled",
              payment,
              back: listPanel,
            })
          }
          onReview={(row) => show({ kind: "review", row, back: listPanel })}
          onImport={() => show({ kind: "import", back: listPanel })}
          onLog={() =>
            log(
              {
                accountId: listPanel.filter?.accountId,
                kind:
                  listPanel.filter?.type === "income"
                    ? "income"
                    : listPanel.filter?.type === "savings"
                      ? "savings"
                      : "expense",
                category: data.categories.find(
                  (category) => category.id === listPanel.filter?.categoryId
                ),
              },
              listPanel
            )
          }
        />
      )}
      {panel.kind === "entry" && (
        <ActivityEntryEditor
          month={month}
          draft={panel.draft}
          accounts={accounts}
          categories={data.categories}
          scheduled={scheduled}
          onClose={() => show(panel.back ?? null)}
          onSaved={() => show(panel.back ?? null)}
        />
      )}
      {panel.kind === "delete-entry" && (
        <ActivityEntryRemoval
          entry={panel.entry}
          onClose={() => show(panel.back ?? null)}
          onRemoved={() => show(panel.back ?? null)}
        />
      )}
      {(panel.kind === "hide-card" || panel.kind === "remove-category") && (
        <PlannerSheet
          title={
            panel.kind === "remove-category"
              ? "Remove from canvas?"
              : "Hide card?"
          }
          description={panel.name}
          onClose={() => show(panel.back ?? null)}
        >
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {panel.kind === "remove-category"
                ? "The category card will disappear from this workspace. Its transactions and monthly amount are kept. Use Add element to bring it back."
                : `The card will disappear from ${activityViewNames[panel.from]}. Its recorded transactions still count toward Used.`}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => show(panel.back ?? null)}
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  panel.hide();
                  close();
                }}
              >
                {panel.kind === "remove-category"
                  ? "Remove from canvas"
                  : "Hide card"}
              </Button>
            </div>
          </div>
        </PlannerSheet>
      )}
      {panel.kind === "delete-scheduled" && (
        <ActivityScheduledRemoval
          item={panel.payment}
          onClose={() => show(panel.back ?? null)}
          onRemoved={() => show(panel.back ?? null)}
        />
      )}
      {panel.kind === "import" && (
        <ActivityImportEditor
          month={month}
          accounts={accounts}
          onClose={() => show(panel.back ?? reviewList)}
          onImported={(result) =>
            show({
              ...reviewList,
              notice: `${result.added} added for review · ${result.duplicates} already imported`,
            })
          }
        />
      )}
      {panel.kind === "review" && (
        <ActivityImportReview
          row={panel.row}
          data={data}
          accountName={
            accounts.find((item) => item.id === panel.row.accountId)?.name ??
            "Account"
          }
          onClose={() => show(panel.back ?? reviewList)}
          onDone={() => show(panel.back ?? reviewList)}
          onLog={() => log({ imported: panel.row }, panel.back ?? reviewList)}
        />
      )}
      {panel.kind === "account" && (
        <AccountEditor
          month={month}
          item={accounts.find((account) => account.id === panel.accountId)}
          onClose={() => show(panel.back ?? null)}
        />
      )}
      {panel.kind === "scheduled-payment" && (
        <PaymentEditor
          month={month}
          accounts={accounts}
          item={panel.payment}
          lockedKind
          onClose={() => show(panel.back)}
        />
      )}
    </PlannerSheetHost>
  );
}
