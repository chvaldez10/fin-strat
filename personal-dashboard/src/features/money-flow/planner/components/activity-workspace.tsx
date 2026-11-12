"use client";

import { useMemo, useState } from "react";
import { useMutation } from "convex/react";
import {
  ChevronLeft,
  ChevronRight,
  EyeOff,
  List,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import { api } from "@convex/_generated/api";
import { MonthPicker } from "@/components/ui/month-picker";
import { Button } from "@/components/ui/button";
import { formatMoney } from "../../calculations";
import { AccountSwitcher } from "../../components/account-switcher";
import { ElementToolbar } from "../../components/element-toolbar";
import { summarizeActivity, type ActivityCategory } from "../activity";
import type {
  ActivityData,
  ActivityEntry,
  ImportedActivity,
} from "../activity-data";
import {
  displayActivityIncome,
  activityExpenseAccounts,
  breakdownCategoryId,
  breakdownCategoryPlacementKey,
  expenseAccountElementId,
  overviewCategoryId,
  overviewCategoryPosition,
  projectActivityCanvas,
  visibleActivityBuckets,
  type ActivityCanvasView,
} from "../activity-projection";
import type { PlannerLayoutValues } from "../use-planner-layout";
import type { FinancialAccount, Payment } from "../types";
import { AccountEditor } from "./account-editor";
import {
  ActivityEntryEditor,
  type ActivityDraft,
} from "./activity-entry-editor";
import { ActivityEntryRemoval } from "./activity-entry-removal";
import { ActivityImportEditor } from "./activity-import-editor";
import { ActivityImportReview } from "./activity-import-review";
import { ActivityIncomeInspector } from "./activity-income-inspector";
import {
  ActivityListSheet,
  type ActivityListView,
} from "./activity-list-sheet";
import { ActivityPlanEditor } from "./activity-plan-editor";
import { ActivityScheduledRemoval } from "./activity-scheduled-removal";
import { ActivitySummary, type ActivityFilter } from "./activity-summary";
import { PaymentEditor } from "./payment-editor";
import {
  PlannerCanvasFrame,
  type CanvasElementAction,
  type CanvasFrameState,
  type CanvasLayoutActions,
} from "./planner-canvas-frame";
import {
  FormError,
  PlannerSheet,
  PlannerSheetHost,
  usePlannerAction,
} from "./planner-form";
import { localToday } from "../../formatting";

type ListPanel = {
  kind: "list";
  view: ActivityListView;
  filter?: ActivityFilter;
  notice?: string;
  hideAccountCard?: () => void;
};
type Panel =
  | ListPanel
  | { kind: "entry"; draft: ActivityDraft; back?: ListPanel }
  | { kind: "delete-entry"; entry: ActivityEntry; back?: ListPanel }
  | {
      kind: "hide-card";
      name: string;
      from: ActivityCanvasView;
      hide: () => void;
      back?: ListPanel;
    }
  | { kind: "delete-scheduled"; payment: Payment; back?: ListPanel }
  | { kind: "import"; back?: ListPanel }
  | { kind: "review"; row: ImportedActivity; back?: ListPanel }
  | { kind: "plan"; categoryId?: string }
  | { kind: "add-element" }
  | { kind: "income" }
  | { kind: "account"; accountId?: string; back?: ListPanel }
  | { kind: "scheduled-payment"; payment: Payment; back: ListPanel };

const reviewList: ListPanel = { kind: "list", view: "review" };
const activityTools = [
  { kind: "income", label: "Log income" },
  { kind: "expense", label: "Log expense" },
  { kind: "account", label: "Log savings" },
] as const;
const viewNames: Record<ActivityCanvasView, string> = {
  overview: "Monthly overview",
  expenses: "Expenses",
  savings: "Savings",
};

export function ActivityWorkspace({
  month,
  onMonthChange,
  data,
  accounts,
  plans,
  frame,
}: Readonly<{
  month: string;
  onMonthChange: (month: string) => void;
  data: ActivityData;
  accounts: FinancialAccount[];
  plans: Payment[];
  frame?: CanvasFrameState;
}>) {
  const [selection, setSelection] = useState<{
    month: string;
    panel: Panel;
  } | null>(null);
  const [view, setView] = useState<ActivityCanvasView>("overview");
  const saveView = useMutation(api.moneyFlow.saveView);
  const bankAction = usePlannerAction();
  const panel = selection?.month === month ? selection.panel : null;
  const listPanel =
    panel?.kind === "list"
      ? panel
      : panel && "back" in panel
        ? panel.back
        : null;
  const show = (next: Panel | null) =>
    setSelection(next ? { month, panel: next } : null);
  const close = () => show(null);
  const openView = (next: ActivityCanvasView) => {
    close();
    setView(next);
  };
  const totals = useMemo(
    () =>
      summarizeActivity(
        data.entries,
        data.categories,
        data.plan?.allocations ?? {},
        data.plan?.spendingLimitCents ?? null
      ),
    [data.entries, data.categories, data.plan]
  );
  const scheduled = useMemo(() => {
    const recorded = new Set<string>(
      data.entries.flatMap((entry) => (entry.planId ? [entry.planId] : []))
    );
    return plans.filter(
      (item) => item.status === "pending" && !recorded.has(item._id)
    );
  }, [data.entries, plans]);
  const receivedIncome = data.entries
    .filter((entry) => entry.kind === "income")
    .toSorted((a, b) => b.date.localeCompare(a.date));
  const scheduledIncome = useMemo(
    () =>
      scheduled
        .filter((item) => item.kind === "income")
        .toSorted((a, b) => a.dueDate.localeCompare(b.dueDate)),
    [scheduled]
  );
  const income = useMemo(
    () => displayActivityIncome(totals.income, scheduledIncome),
    [totals.income, scheduledIncome]
  );
  const expenseAccounts = useMemo(
    () => activityExpenseAccounts(accounts, scheduled, data.entries),
    [accounts, scheduled, data.entries]
  );
  const banks = accounts.filter(
    (account) => account.kind !== "credit" && account.legacyAccountId
  );
  const bank =
    banks.find(
      (account) =>
        account.legacyAccountId === frame?.root.view.selectedAccountId
    ) ??
    banks.find((account) => account.kind === "chequing") ??
    banks[0];
  const selectBank = (accountId: string) => {
    if (
      !frame ||
      !frame.account.legacyAccountId ||
      accountId === bank?.legacyAccountId
    )
      return;
    const anchorId = frame.account.legacyAccountId;
    void bankAction.run(() =>
      saveView({
        documentId: frame.root._id,
        accountId: anchorId,
        sessionId: frame.access.sessionId,
        view: { ...frame.root.view, selectedAccountId: accountId },
      })
    );
  };
  const project = (positions: PlannerLayoutValues["positions"]) =>
    projectActivityCanvas({
      totals,
      income,
      accounts: expenseAccounts,
      bank,
      view,
      positions,
    });
  const canLog = accounts.length > 0 && month <= localToday().slice(0, 7);
  const log = (draft: ActivityDraft, back?: ListPanel) => {
    if (!accounts.length) show({ kind: "account" });
    else if (canLog) show({ kind: "entry", draft, back });
  };
  const showActivity = (filter?: ActivityFilter) =>
    show({ kind: "list", view: "recorded", filter });
  const showBreakdownActivity = () =>
    showActivity({ type: view === "expenses" ? "spending" : "savings" });
  const showCategoryActivity = (category: ActivityCategory) =>
    showActivity({ categoryId: category.id });
  const expenseAccountForElement = (id: string) =>
    expenseAccounts.find(
      ({ account }) => expenseAccountElementId(account.id) === id
    )?.account;
  const bucketForElement = (id: string) =>
    totals.buckets.find(
      (bucket) =>
        breakdownCategoryId(bucket.id) === id ||
        overviewCategoryId(bucket.id) === id
    );
  const placeCategory = (
    category: ActivityCategory,
    layout: CanvasLayoutActions
  ) => {
    if (view === "overview") {
      layout.place(overviewCategoryId(category.id), (positions) =>
        overviewCategoryPosition(category.kind, positions)
      );
      return;
    }
    const id = breakdownCategoryId(category.id);
    layout.place(
      breakdownCategoryPlacementKey(category.id),
      () => ({ x: 0, y: 0 }),
      id
    );
    if (layout.isHidden(id)) layout.setHidden(id, false);
  };
  const hideCategoryCard = (
    id: string,
    category: ActivityCategory,
    layout: CanvasLayoutActions,
    onHidden?: () => void
  ) =>
    show({
      kind: "hide-card",
      name: category.name,
      from: view,
      hide: () => {
        if (view === "overview") layout.remove(id);
        else layout.setHidden(id, true);
        onHidden?.();
      },
    });
  const openExpenseAccount = (
    accountId: string,
    layout?: CanvasLayoutActions
  ) => {
    const details = expenseAccounts.find(
      (item) => item.account.id === accountId
    );
    if (!details) return;
    const hasPlans =
      details.charges.length > 0 || details.repayments.length > 0;
    show({
      kind: "list",
      view: !details.hasRecorded && hasPlans ? "scheduled" : "recorded",
      filter: { type: "spending", accountId },
      hideAccountCard: layout
        ? () => layout.setHidden(expenseAccountElementId(accountId), true)
        : undefined,
    });
  };
  function elementActions(
    id: string,
    edit: () => void,
    layout: CanvasLayoutActions
  ): CanvasElementAction[] {
    if (id === "recorded-income") {
      const actions: CanvasElementAction[] = [
        { label: "Edit income", icon: Pencil, onSelect: edit },
      ];
      const [entry] = receivedIncome;
      if (receivedIncome.length === 1 && entry)
        return [
          ...actions,
          {
            label: "Delete recorded income…",
            icon: Trash2,
            destructive: true,
            onSelect: () => show({ kind: "delete-entry", entry }),
          },
        ];
      if (receivedIncome.length > 1)
        actions.push({
          label: "View income transactions",
          icon: List,
          onSelect: () => showActivity({ type: "income" }),
        });
      const [payment] = scheduledIncome;
      if (!receivedIncome.length && scheduledIncome.length === 1 && payment)
        actions.push({
          label: "Delete scheduled income…",
          icon: Trash2,
          destructive: true,
          onSelect: () => show({ kind: "delete-scheduled", payment }),
        });
      return actions;
    }
    if (id === "overview-expenses" || id === "overview-savings") {
      const target = id === "overview-expenses" ? "expenses" : "savings";
      return [
        {
          label: `Open ${target}`,
          icon: ChevronRight,
          onSelect: () => openView(target),
        },
        {
          label: "View transactions",
          icon: List,
          onSelect: () =>
            showActivity({
              type: target === "expenses" ? "spending" : "savings",
            }),
        },
      ];
    }
    if (id === "expenses-center" || id === "savings-center")
      return [
        {
          label: "View transactions",
          icon: List,
          onSelect: showBreakdownActivity,
        },
        {
          label: "Back to Overview",
          icon: ChevronLeft,
          onSelect: () => openView("overview"),
        },
      ];
    const account = expenseAccountForElement(id);
    if (account)
      return [
        {
          label: "View account activity",
          icon: List,
          onSelect: () => openExpenseAccount(account.id, layout),
        },
        {
          label: "Update balance",
          icon: Pencil,
          onSelect: () => show({ kind: "account", accountId: account.id }),
        },
        {
          label: "Hide card…",
          icon: EyeOff,
          onSelect: () =>
            show({
              kind: "hide-card",
              name: account.name,
              from: "expenses",
              hide: () => layout.setHidden(id, true),
            }),
        },
      ];
    if (id === "center")
      return [
        {
          label: bank ? "Update balance" : "Add account",
          icon: bank ? Pencil : Plus,
          onSelect: () => show({ kind: "account", accountId: bank?.id }),
        },
      ];
    const bucket = bucketForElement(id);
    if (!bucket) return [];
    return [
      { label: "Edit monthly amount", icon: Pencil, onSelect: edit },
      {
        label: "View transactions",
        icon: List,
        onSelect: () => showCategoryActivity(bucket),
      },
      {
        label: "Hide card…",
        icon: EyeOff,
        onSelect: () => hideCategoryCard(id, bucket, layout),
      },
    ];
  }
  const heading = (
    <>
      {view !== "overview" && (
        <Button variant="ghost" size="sm" onClick={() => openView("overview")}>
          <ChevronLeft aria-hidden="true" /> Overview
        </Button>
      )}
      <h1 className="mr-2 text-sm font-semibold">{viewNames[view]}</h1>
      {view !== "overview" && (
        <Button variant="outline" size="sm" onClick={showBreakdownActivity}>
          <List aria-hidden="true" /> View transactions
        </Button>
      )}
      {view === "overview" && frame && bank && (
        <div className="w-full sm:w-auto">
          <AccountSwitcher
            accounts={banks.map((item) => ({
              id: item.legacyAccountId!,
              name: item.name,
              institution: item.institution,
              accountType: item.kind === "savings" ? "savings" : "chequing",
            }))}
            selectedAccountId={bank.legacyAccountId!}
            onAccountChange={selectBank}
            ariaLabel="Overview bank"
            disabled={bankAction.busy}
          />
          <FormError message={bankAction.error} />
        </div>
      )}
    </>
  );
  const incomeEditor = (
    presentation: "canvas" | "sheet",
    dismiss: () => void
  ) => (
    <ActivityIncomeInspector
      key={`${month}-income`}
      month={month}
      presentation={presentation}
      received={receivedIncome}
      categories={data.categories}
      accounts={accounts}
      scheduled={scheduledIncome}
      canLog={canLog}
      onClose={dismiss}
      onLogScheduled={(planned) => {
        dismiss();
        log({ planned });
      }}
    />
  );
  const summary = (
    <ActivitySummary
      month={month}
      data={data}
      totals={totals}
      income={income}
      accounts={accounts}
      scheduled={scheduled}
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
        <PlannerCanvasFrame
          {...frame}
          scope="activity"
          viewKey={view}
          header={heading}
          summary={summary}
          tools={(moveControl, layout) => {
            const hiddenAccounts =
              view === "expenses" && panel?.kind === "add-element"
                ? expenseAccounts.filter(({ account }) =>
                    layout.isHidden(expenseAccountElementId(account.id))
                  )
                : [];
            return (
              <>
                <ElementToolbar
                  addLabel=""
                  draggable={false}
                  showToolLabels
                  tools={canLog ? activityTools : []}
                  onAddElement={(kind) => {
                    if (kind === "account") log({ kind: "savings" });
                    else if (kind === "income" || kind === "expense")
                      log({ kind });
                  }}
                >
                  <Button
                    size="sm"
                    className="shrink-0"
                    onClick={() => show({ kind: "add-element" })}
                  >
                    <Plus aria-hidden="true" /> Add element
                  </Button>
                  {moveControl}
                </ElementToolbar>
                {panel?.kind === "add-element" && (
                  <ActivityPlanEditor
                    month={month}
                    data={data}
                    presentation="canvas"
                    beforeForm={
                      hiddenAccounts.length > 0 && (
                        <section className="mb-5 space-y-2 rounded-xl border p-3">
                          <h3 className="text-sm font-medium">
                            Restore hidden accounts
                          </h3>
                          {hiddenAccounts.map(({ account }) => (
                            <Button
                              key={account.id}
                              variant="outline"
                              size="sm"
                              className="h-auto min-h-8 w-full justify-start whitespace-normal text-left"
                              onClick={() => {
                                layout.setHidden(
                                  expenseAccountElementId(account.id),
                                  false
                                );
                                close();
                              }}
                            >
                              <Plus aria-hidden="true" /> Restore {account.name}
                            </Button>
                          ))}
                        </section>
                      )
                    }
                    add={{
                      kind:
                        view === "overview"
                          ? undefined
                          : view === "expenses"
                            ? "expense"
                            : "savings",
                      onPlace: (category) => placeCategory(category, layout),
                    }}
                    onClose={close}
                    onView={showCategoryActivity}
                  />
                )}
              </>
            );
          }}
          project={project}
          elementActions={elementActions}
          onActivate={(id, layout) => {
            if (id === "overview-expenses") {
              openView("expenses");
              return true;
            }
            if (id === "overview-savings") {
              openView("savings");
              return true;
            }
            if (id === "expenses-center" || id === "savings-center") {
              showBreakdownActivity();
              return true;
            }
            if (id === "center") {
              show({ kind: "account", accountId: bank?.id });
              return true;
            }
            const account = expenseAccountForElement(id);
            if (account) {
              openExpenseAccount(account.id, layout);
              return true;
            }
            return false;
          }}
          inspect={(id, dismiss, layout) => {
            if (panel && panel.kind !== "hide-card") return null;
            if (id === "recorded-income")
              return incomeEditor("canvas", dismiss);
            const bucket = bucketForElement(id);
            return bucket ? (
              <ActivityPlanEditor
                key={`${month}-${id}`}
                month={month}
                data={data}
                bucket={bucket}
                presentation="canvas"
                onHide={() => hideCategoryCard(id, bucket, layout, dismiss)}
                onClose={dismiss}
                onLog={
                  canLog
                    ? (category) => {
                        dismiss();
                        log({ category });
                      }
                    : undefined
                }
                onView={(category) => {
                  dismiss();
                  showCategoryActivity(category);
                }}
              />
            ) : null;
          }}
        />
      ) : (
        <div>
          <div className="flex flex-wrap items-center gap-3 border-b px-4 py-3 sm:px-6">
            {heading}
            <MonthPicker
              aria-label="Activity month"
              value={month}
              onValueChange={onMonthChange}
            />
          </div>
          {summary}
          <div className="grid gap-3 px-4 py-5 sm:grid-cols-2 lg:grid-cols-3">
            {view === "expenses" &&
              expenseAccounts.map(({ account, spent }) => (
                <Button
                  key={account.id}
                  variant="outline"
                  className="h-auto min-h-16 justify-between whitespace-normal text-left"
                  onClick={() => openExpenseAccount(account.id)}
                >
                  <span>{account.name}</span>
                  <span>{formatMoney(spent)} spent</span>
                </Button>
              ))}
            {visibleActivityBuckets(totals, view).map((bucket) => (
              <Button
                key={bucket.id}
                variant="outline"
                className="h-auto min-h-16 justify-between whitespace-normal text-left"
                onClick={() => show({ kind: "plan", categoryId: bucket.id })}
              >
                <span>{bucket.name}</span>
                <span>{formatMoney(bucket.actual)}</span>
              </Button>
            ))}
          </div>
        </div>
      )}
      {panel?.kind === "income" && incomeEditor("sheet", close)}
      {panel?.kind === "plan" && (
        <ActivityPlanEditor
          month={month}
          data={data}
          bucket={totals.buckets.find((item) => item.id === panel.categoryId)}
          onClose={close}
          onLog={canLog ? (category) => log({ category }) : undefined}
          onView={showCategoryActivity}
        />
      )}
      {panel &&
        panel.kind !== "add-element" &&
        panel.kind !== "income" &&
        panel.kind !== "plan" && (
          <PlannerSheetHost>
            {listPanel && (
              <ActivityListSheet
                key={`${month}-${listPanel.view}-${listPanel.filter?.accountId ?? listPanel.filter?.categoryId ?? listPanel.filter?.type ?? "all"}`}
                month={month}
                data={data}
                accounts={accounts}
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
                      <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border p-3">
                        <p className="text-sm text-muted-foreground">
                          {account.balanceUpdatedAt === null
                            ? "Balance not recorded"
                            : `${formatMoney(account.balanceCents)} recorded balance${account.kind === "credit" ? " owed" : ""}`}
                        </p>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            show({
                              kind: "account",
                              accountId: account.id,
                              back: listPanel,
                            })
                          }
                        >
                          Update balance
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
                onReview={(row) =>
                  show({ kind: "review", row, back: listPanel })
                }
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
                        (category) =>
                          category.id === listPanel.filter?.categoryId
                      ),
                    },
                    listPanel
                  )
                }
              />
            )}
            {panel?.kind === "entry" && (
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
            {panel?.kind === "delete-entry" && (
              <ActivityEntryRemoval
                entry={panel.entry}
                onClose={() => show(panel.back ?? null)}
                onRemoved={() => show(panel.back ?? null)}
              />
            )}
            {panel?.kind === "hide-card" && (
              <PlannerSheet
                title="Hide card?"
                description={panel.name}
                onClose={() => show(panel.back ?? null)}
              >
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    The card will disappear from {viewNames[panel.from]}. Its
                    recorded transactions still count toward Used.
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
                      Hide card
                    </Button>
                  </div>
                </div>
              </PlannerSheet>
            )}
            {panel?.kind === "delete-scheduled" && (
              <ActivityScheduledRemoval
                item={panel.payment}
                onClose={() => show(panel.back ?? null)}
                onRemoved={() => show(panel.back ?? null)}
              />
            )}
            {panel?.kind === "import" && (
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
            {panel?.kind === "review" && (
              <ActivityImportReview
                row={panel.row}
                data={data}
                accountName={
                  accounts.find((item) => item.id === panel.row.accountId)
                    ?.name ?? "Account"
                }
                onClose={() => show(panel.back ?? reviewList)}
                onDone={() => show(panel.back ?? reviewList)}
                onLog={() =>
                  log({ imported: panel.row }, panel.back ?? reviewList)
                }
              />
            )}
            {panel?.kind === "account" && (
              <AccountEditor
                month={month}
                item={accounts.find(
                  (account) => account.id === panel.accountId
                )}
                onClose={() => show(panel.back ?? null)}
              />
            )}
            {panel?.kind === "scheduled-payment" && (
              <PaymentEditor
                month={month}
                accounts={accounts}
                item={panel.payment}
                lockedKind
                onClose={() => show(panel.back)}
              />
            )}
          </PlannerSheetHost>
        )}
    </>
  );
}
