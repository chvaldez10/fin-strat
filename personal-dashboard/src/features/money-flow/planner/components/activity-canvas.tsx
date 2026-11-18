import { useCallback, useMemo, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronLeft,
  ChevronRight,
  EyeOff,
  List,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ElementToolbar } from "../../components/element-toolbar";
import { bankWorkspaceName } from "../activity-canvas-account";
import {
  breakdownCategoryId,
  breakdownCategoryPlacementKey,
  expenseAccountElementId,
  incomeEntryElementId,
  incomePaymentElementId,
  overviewCategoryId,
  overviewCategoryPosition,
  projectActivityCanvas,
  type ActivityCanvasView,
} from "../activity-projection";
import type { ActivityCategory } from "../activity";
import type { ActivityData } from "../activity-data";
import type { ActivityWorkspaceData } from "../activity-workspace-data";
import type { FinancialAccount } from "../types";
import type { CanvasPositions } from "../../canvas-types";
import { ActivityIncomeInspector } from "./activity-income-inspector";
import { ActivityPlanEditor } from "./activity-plan-editor";
import {
  activityViewNames,
  type ActivityDraft,
  type ActivityFilter,
  type ActivityPanel,
} from "./activity-panels";
import {
  PlannerCanvasFrame,
  type CanvasElementAction,
  type CanvasFrameState,
  type CanvasLayoutActions,
} from "./planner-canvas-frame";

const activityTools = [
  { kind: "income", label: "Log income" },
  { kind: "expense", label: "Log expense" },
  { kind: "account", label: "Log savings" },
] as const;
export function ActivityCanvas({
  frame,
  data,
  accounts,
  workspace,
  bank,
  accountControl,
  summary,
  canLog,
  adding,
  canInspect,
  accountDetailsLink,
  onShow: show,
  onLog: log,
}: Readonly<{
  frame: CanvasFrameState;
  data: ActivityData;
  accounts: FinancialAccount[];
  workspace: ActivityWorkspaceData;
  bank?: FinancialAccount;
  accountControl?: ReactNode;
  summary: ReactNode;
  canLog: boolean;
  adding: boolean;
  canInspect: boolean;
  accountDetailsLink: (accountId: string) => string;
  onShow: (panel: ActivityPanel | null) => void;
  onLog: (draft: ActivityDraft) => void;
}>) {
  const router = useRouter();
  const { month } = frame;
  const bankId = bank?.id;
  const [viewSelection, setViewSelection] = useState<{
    bankId: string | undefined;
    view: ActivityCanvasView;
  }>();
  const view =
    viewSelection?.bankId === bankId
      ? (viewSelection?.view ?? "overview")
      : "overview";
  const close = () => show(null);
  const openView = (next: ActivityCanvasView) => {
    close();
    setViewSelection({ bankId, view: next });
  };
  const {
    totals,
    receivedIncome,
    scheduledIncome,
    expenseAccounts,
    recurringExpenses,
  } = workspace;
  const {
    expenseAccountsByElement,
    recurringByElement,
    bucketsByElement,
    receivedIncomeByElement,
    scheduledIncomeByElement,
  } = useMemo(
    () => ({
      expenseAccountsByElement: new Map(
        expenseAccounts.map(({ account }) => [
          expenseAccountElementId(account.id),
          account,
        ])
      ),
      recurringByElement: new Map(
        recurringExpenses.map((group) => [group.id, group])
      ),
      bucketsByElement: new Map(
        totals.buckets.flatMap((bucket) => [
          [overviewCategoryId(bucket.id), bucket] as const,
          [breakdownCategoryId(bucket.id), bucket] as const,
        ])
      ),
      receivedIncomeByElement: new Map(
        receivedIncome.map((entry) => [incomeEntryElementId(entry._id), entry])
      ),
      scheduledIncomeByElement: new Map(
        scheduledIncome.map((payment) => [
          incomePaymentElementId(payment._id),
          payment,
        ])
      ),
    }),
    [
      totals,
      receivedIncome,
      scheduledIncome,
      expenseAccounts,
      recurringExpenses,
    ]
  );
  const project = useCallback(
    (positions: CanvasPositions) =>
      projectActivityCanvas({
        totals,
        receivedIncome,
        scheduledIncome,
        recurringExpenses,
        accounts: expenseAccounts,
        bank,
        view,
        positions,
      }),
    [
      totals,
      receivedIncome,
      scheduledIncome,
      recurringExpenses,
      expenseAccounts,
      bank,
      view,
    ]
  );
  const showActivity = (filter?: ActivityFilter) =>
    show({ kind: "list", view: "recorded", filter });
  const showBreakdownActivity = () =>
    showActivity({ type: view === "expenses" ? "spending" : "savings" });
  const showCategoryActivity = (category: ActivityCategory) =>
    showActivity({ categoryId: category.id });
  const placeCategory = (
    category: ActivityCategory,
    layout: CanvasLayoutActions
  ) => {
    const id = breakdownCategoryId(category.id);
    if (layout.isHidden(id)) layout.setHidden(id, false);
    if (view === "overview") {
      layout.place(overviewCategoryId(category.id), (positions) =>
        overviewCategoryPosition(category.kind, positions)
      );
      return;
    }
    layout.place(
      breakdownCategoryPlacementKey(category.id),
      () => ({ x: 0, y: 0 }),
      id
    );
  };
  const hideCategoryCard = (
    category: ActivityCategory,
    layout: CanvasLayoutActions,
    onHidden?: () => void
  ) =>
    show({
      kind: "remove-category",
      name: category.name,
      from: view,
      hide: () => {
        layout.setHidden(breakdownCategoryId(category.id), true);
        onHidden?.();
      },
    });
  const openRecurringExpense = (group: (typeof recurringExpenses)[number]) =>
    show({
      kind: "list",
      view: group.pendingCount ? "scheduled" : "recorded",
      filter: { type: "spending", paymentGroup: group },
    });
  const openExpenseAccount = (
    accountId: string,
    layout?: CanvasLayoutActions
  ) => {
    show({
      kind: "list",
      view: "recorded",
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
    if (id === "recorded-income")
      return canLog
        ? [
            {
              label: "Log income",
              icon: Plus,
              onSelect: () => log({ kind: "income" }),
            },
          ]
        : [];
    const entry = receivedIncomeByElement.get(id);
    const payment = scheduledIncomeByElement.get(id);
    if (entry || payment)
      return [
        { label: "Edit income", icon: Pencil, onSelect: edit },
        {
          label: entry ? "Delete recorded income…" : "Delete scheduled income…",
          icon: Trash2,
          destructive: true,
          onSelect: () =>
            entry
              ? show({ kind: "delete-entry", entry })
              : payment && show({ kind: "delete-scheduled", payment }),
        },
      ];
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
    const account = expenseAccountsByElement.get(id);
    if (account)
      return [
        {
          label: "View account activity",
          icon: List,
          onSelect: () => openExpenseAccount(account.id, layout),
        },
        {
          label: "View account details",
          icon: ChevronRight,
          onSelect: () => router.push(accountDetailsLink(account.id)),
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
      return bank
        ? [
            {
              label: "Update balance",
              icon: Pencil,
              onSelect: () => show({ kind: "account", accountId: bank.id }),
            },
          ]
        : [
            {
              label: "View transactions",
              icon: List,
              onSelect: () => showActivity(),
            },
          ];
    const group = recurringByElement.get(id);
    if (group)
      return [
        {
          label: "View payments",
          icon: List,
          onSelect: () => openRecurringExpense(group),
        },
        {
          label: "Hide card…",
          icon: EyeOff,
          onSelect: () =>
            show({
              kind: "hide-card",
              name: group.name,
              from: "expenses",
              hide: () => layout.setHidden(id, true),
            }),
        },
      ];
    const bucket = bucketsByElement.get(id);
    if (!bucket) return [];
    return [
      { label: "Edit monthly amount", icon: Pencil, onSelect: edit },
      {
        label: "View transactions",
        icon: List,
        onSelect: () => showCategoryActivity(bucket),
      },
      {
        label: "Remove from canvas…",
        icon: EyeOff,
        onSelect: () => hideCategoryCard(bucket, layout),
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
      <h1
        className={
          view === "overview" && accountControl
            ? "sr-only"
            : "mr-2 text-sm font-semibold"
        }
      >
        {view === "overview"
          ? bankWorkspaceName(bank)
          : activityViewNames[view]}
      </h1>
      {view !== "overview" && (
        <Button variant="outline" size="sm" onClick={showBreakdownActivity}>
          <List aria-hidden="true" /> View transactions
        </Button>
      )}
      {accountControl && (
        <div className="w-full sm:w-auto">{accountControl}</div>
      )}
    </>
  );
  return (
    <PlannerCanvasFrame
      {...frame}
      scope="activity"
      viewKey={view}
      layoutNamespace={bankId ? `bank:${bankId}:` : ""}
      header={heading}
      summary={summary}
      tools={(moveControl, layout) => {
        const hiddenCards =
          view === "expenses" && adding
            ? [
                ...expenseAccounts.map(({ account }) => ({
                  id: expenseAccountElementId(account.id),
                  name: account.name,
                })),
                ...recurringExpenses,
              ].filter(({ id }) => layout.isHidden(id))
            : [];
        return (
          <>
            <ElementToolbar
              addLabel=""
              showToolLabels
              tools={canLog ? activityTools : []}
              onAddElement={(kind) => {
                if (kind === "account") log({ kind: "savings" });
                else if (kind === "income" || kind === "expense") log({ kind });
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
            {adding && (
              <ActivityPlanEditor
                month={month}
                data={data}
                presentation="canvas"
                beforeForm={
                  <>
                    {view === "overview" && canLog && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="mb-4"
                        onClick={() => log({ kind: "income" })}
                      >
                        <Plus aria-hidden="true" /> Log income
                      </Button>
                    )}
                    {hiddenCards.length > 0 && (
                      <section className="mb-5 space-y-2 rounded-xl border p-3">
                        <h3 className="text-sm font-medium">
                          Restore hidden cards
                        </h3>
                        {hiddenCards.map(({ id, name }) => (
                          <Button
                            key={id}
                            variant="outline"
                            size="sm"
                            className="h-auto min-h-8 w-full justify-start whitespace-normal text-left"
                            onClick={() => {
                              layout.setHidden(id, false);
                              close();
                            }}
                          >
                            <Plus aria-hidden="true" /> Restore {name}
                          </Button>
                        ))}
                      </section>
                    )}
                  </>
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
          if (bank) show({ kind: "account", accountId: bank.id });
          else showActivity();
          return true;
        }
        if (id === "recorded-income") {
          log({ kind: "income" });
          return true;
        }
        const account = expenseAccountsByElement.get(id);
        if (account) {
          openExpenseAccount(account.id, layout);
          return true;
        }
        const group = recurringByElement.get(id);
        if (group) {
          openRecurringExpense(group);
          return true;
        }
        return false;
      }}
      inspect={(id, dismiss, layout) => {
        if (!canInspect) return null;
        const entry = receivedIncomeByElement.get(id);
        const payment = scheduledIncomeByElement.get(id);
        if (entry || payment) {
          return (
            <ActivityIncomeInspector
              key={id}
              month={month}
              received={entry ? [entry] : []}
              scheduled={payment ? [payment] : []}
              categories={data.categories}
              accounts={accounts}
              defaultAccountId={bankId}
              canLog={canLog}
              onClose={dismiss}
              onLogScheduled={(planned) => {
                dismiss();
                log({ planned });
              }}
            />
          );
        }
        const bucket = bucketsByElement.get(id);
        return bucket ? (
          <ActivityPlanEditor
            key={`${month}-${id}`}
            month={month}
            data={data}
            bucket={bucket}
            presentation="canvas"
            onHide={() => hideCategoryCard(bucket, layout, dismiss)}
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
  );
}
