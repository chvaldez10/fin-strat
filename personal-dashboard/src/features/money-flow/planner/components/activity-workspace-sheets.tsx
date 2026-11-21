import Link from "next/link";
import { Button } from "@/components/ui/button";
import type { ActivityData } from "../activity-data";
import {
  activityListRecords,
  type ActivityWorkspaceData,
} from "../activity-workspace-data";
import type { FinancialAccount } from "../types";
import { AccountEditor } from "./account-editor";
import { ActivityEntryEditor } from "./activity-entry-editor";
import { ActivityEntryRemoval } from "./activity-entry-removal";
import { ActivityImportEditor } from "./activity-import-editor";
import { ActivityImportReview } from "./activity-import-review";
import { ActivityListSheet } from "./activity-list-sheet";
import { ActivityPlanEditor } from "./activity-plan-editor";
import { ActivityScheduledRemoval } from "./activity-scheduled-removal";
import { PaymentEditor } from "./payment-editor";
import { PlannerSheetHost } from "./planner-form";
import {
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
  accountId,
  canLog,
  accountDetailsLink,
  onAccountCreated,
  onShow: show,
  onLog: log,
}: Readonly<{
  panel: ActivityPanel | null;
  month: string;
  data: ActivityData;
  accounts: FinancialAccount[];
  workspace: ActivityWorkspaceData;
  accountId?: string;
  canLog: boolean;
  accountDetailsLink: (accountId: string) => string;
  onAccountCreated?: (id: string) => void;
  onShow: (panel: ActivityPanel | null) => void;
  onLog: (draft: ActivityDraft, back?: ActivityListPanel) => void;
}>) {
  if (!panel) return null;
  const { scheduled, totals } = workspace;
  const showCategoryActivity = (category: { id: string }) =>
    show({
      kind: "list",
      view: "recorded",
      filter: { categoryId: category.id },
    });
  if (panel.kind === "plan")
    return (
      <ActivityPlanEditor
        month={month}
        data={data}
        bucket={totals.buckets.find((item) => item.id === panel.categoryId)}
        onClose={() => show(null)}
        onLog={canLog ? (category) => log({ category }) : undefined}
        onView={showCategoryActivity}
      />
    );

  const listPanel = panel.kind === "list" ? panel : panel.back;
  const filter = listPanel?.filter;
  const list = listPanel ? activityListRecords(workspace, filter) : undefined;
  const detailsAccount = accounts.find((item) => item.id === filter?.accountId);
  const bank =
    accounts.find((item) => item.id === accountId && item.kind !== "credit") ??
    accounts.find((item) => item.kind !== "credit");
  const cardPayment = filter?.type === "cardPayment";
  const incomingTransfer =
    filter?.type === "transfer" && filter.direction === "in";
  const transferSource = incomingTransfer
    ? accounts.find(
        (item) => item.id !== filter.accountId && item.kind !== "credit"
      )
    : undefined;
  return (
    <PlannerSheetHost>
      {listPanel && list && (
        <ActivityListSheet
          key={JSON.stringify([month, listPanel.view, filter])}
          month={month}
          data={
            listPanel.view === "review" && filter?.accountId
              ? data
              : list.activity
          }
          accounts={accounts}
          scopeAccountId={accountId}
          scheduled={list.scheduled}
          title={list.title}
          initialView={listPanel.view}
          active={panel.kind === "list"}
          filter={listPanel.filter}
          header={
            detailsAccount && (
              <Button size="sm" variant="outline" asChild>
                <Link href={accountDetailsLink(detailsAccount.id)}>
                  Account details
                </Link>
              </Button>
            )
          }
          notice={listPanel.notice}
          canLog={
            canLog &&
            (!cardPayment || !!bank) &&
            (!incomingTransfer || !!transferSource)
          }
          onClose={() => show(null)}
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
                accountId: cardPayment
                  ? bank?.id
                  : incomingTransfer
                    ? transferSource?.id
                    : filter?.accountId,
                destinationId: incomingTransfer
                  ? filter.accountId
                  : cardPayment
                    ? (filter?.accountId ??
                      accounts.find(
                        (item) =>
                          item.id === accountId && item.kind === "credit"
                      )?.id)
                    : undefined,
                kind: cardPayment
                  ? "cardPayment"
                  : filter?.type === "income" ||
                      filter?.type === "savings" ||
                      filter?.type === "transfer"
                    ? filter.type
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
          defaultAccountId={filter?.accountId ?? accountId}
          onClose={() => show(panel.back ?? reviewList)}
          onImported={(result) =>
            show({
              ...reviewList,
              filter: { accountId: result.accountId },
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
          onSaved={
            !panel.accountId && onAccountCreated
              ? (id) => {
                  show(null);
                  onAccountCreated(id);
                }
              : undefined
          }
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
