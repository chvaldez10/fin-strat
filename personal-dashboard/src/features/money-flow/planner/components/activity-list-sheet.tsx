"use client";

import { useMemo, useState, type ReactNode } from "react";
import { useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import { formatMoney } from "../../calculations";
import {
  ACTIVITY_LABELS,
  categoryKind,
  summarizeActivity,
  type ActivityKind,
} from "../activity";
import type {
  ActivityData,
  ActivityEntry,
  ImportedActivity,
} from "../activity-data";
import type { FinancialAccount, Payment } from "../types";
import { ActivityDeleteButton } from "./activity-delete-confirmation";
import { ActivitySelect } from "./activity-select";
import {
  FormError,
  PlannerSheet,
  localToday,
  usePlannerAction,
} from "./planner-form";
import type { ActivityFilter } from "./activity-summary";
import { useCanvasWriteContext } from "./planner-write-context";

export type ActivityListView = "recorded" | "review" | "scheduled";
function matchesFilter(kind: ActivityKind, type: ActivityFilter["type"]) {
  if (type === "spending") return kind === "expense" || kind === "refund";
  if (type === "used")
    return kind === "expense" || kind === "refund" || kind === "savings";
  if (type === "transfers")
    return kind === "transfer" || kind === "cardPayment";
  return !type || type === kind;
}
const tabs = [
  { id: "recorded", title: "Recorded" },
  { id: "review", title: "Needs review" },
  { id: "scheduled", title: "Scheduled" },
] as const;

function ReviewCoverage({
  month,
  plan,
}: Readonly<{ month: string; plan: ActivityData["plan"] }>) {
  const [date, setDate] = useState(plan?.reviewedThrough ?? "");
  const action = usePlannerAction();
  const save = useMutation(api.plannerActivity.saveMonth);
  const canvas = useCanvasWriteContext();
  return (
    <form
      className="space-y-2 rounded-xl border p-3"
      onSubmit={(event) => {
        event.preventDefault();
        const today = localToday();
        void action.run(() => {
          if (date > today)
            throw new Error("Choose a date that has already passed.");
          return save({
            month,
            change: { field: "review", date: date || null },
            expectedRevision: plan?.revision ?? 0,
            canvas: canvas?.identity,
          });
        });
      }}
    >
      <p className="text-sm font-medium">Reviewed through</p>
      <p className="text-xs text-muted-foreground">
        Set this after checking bank and card activity through that date.
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <DatePicker
          value={date}
          onValueChange={setDate}
          aria-label="Reviewed through"
          min={`${month}-01`}
          max={localToday()}
          clearable
          disabled={action.busy}
        />
        <Button
          type="submit"
          size="sm"
          variant="outline"
          disabled={action.busy}
        >
          {action.busy ? "Saving…" : "Save review date"}
        </Button>
      </div>
      <FormError message={action.error} />
    </form>
  );
}

export function ActivityListSheet({
  month,
  data,
  accounts,
  scheduled,
  initialView,
  active,
  filter,
  header,
  notice,
  canLog,
  onClose,
  onEdit,
  onDelete,
  onRecord,
  onEditScheduled,
  onDeleteScheduled,
  onReview,
  onImport,
  onLog,
}: Readonly<{
  month: string;
  data: ActivityData;
  accounts: FinancialAccount[];
  scheduled: Payment[];
  initialView: ActivityListView;
  active: boolean;
  filter?: ActivityFilter;
  header?: ReactNode;
  notice?: string;
  canLog: boolean;
  onClose: () => void;
  onEdit: (entry: ActivityEntry) => void;
  onDelete: (entry: ActivityEntry) => void;
  onRecord: (payment: Payment) => void;
  onEditScheduled?: (payment: Payment) => void;
  onDeleteScheduled: (payment: Payment) => void;
  onReview: (row: ImportedActivity) => void;
  onImport: () => void;
  onLog: () => void;
}>) {
  const [view, setView] = useState(initialView);
  const [account, setAccount] = useState(filter?.accountId ?? "all");
  const [limit, setLimit] = useState(30);
  const accountNames = useMemo(
    () => new Map(accounts.map((row) => [row.id, row.name])),
    [accounts]
  );
  const entries = useMemo(
    () =>
      data.entries
        .filter(
          (entry) =>
            matchesFilter(entry.kind, filter?.type) &&
            (!filter?.categoryId || filter.categoryId === entry.categoryId) &&
            (account === "all" ||
              entry.accountId === account ||
              entry.destinationId === account)
        )
        .sort(
          (a, b) =>
            b.date.localeCompare(a.date) || b._creationTime - a._creationTime
        ),
    [data.entries, filter, account]
  );
  const pending = data.pending
    .filter((row) => account === "all" || row.accountId === account)
    .toSorted((a, b) => b.date.localeCompare(a.date));
  const plans = scheduled
    .filter(
      (row) =>
        (matchesFilter(row.kind, filter?.type) ||
          (filter?.type === "spending" &&
            filter.accountId &&
            row.kind === "cardPayment" &&
            row.counterpartyId === filter.accountId)) &&
        (account === "all" ||
          row.accountId === account ||
          row.counterpartyId === account)
    )
    .toSorted((a, b) => a.dueDate.localeCompare(b.dueDate));
  const category = data.categories.find((row) => row.id === filter?.categoryId);
  const labels = {
    income: "Income received",
    savings: "Savings activity",
    spending: "Spending activity",
    used: "Expenses and savings",
    transfers: "Transfers",
  };
  const accountName = filter?.accountId
    ? accountNames.get(filter.accountId)
    : undefined;
  const title =
    accountName ??
    category?.name ??
    (filter?.type ? labels[filter.type] : "Monthly activity");
  const categoryNames = new Map(
    data.categories.map((item) => [item.id, item.name])
  );
  const rowCount = {
    recorded: entries.length,
    review: pending.length,
    scheduled: plans.length,
  }[view];
  const used =
    filter?.type === "used" && view === "recorded"
      ? summarizeActivity(entries, [], {}, null)
      : null;
  const rowClass =
    "flex w-full min-w-0 items-start justify-between gap-3 rounded-lg border p-3 text-left hover:bg-muted/50 focus-visible:outline-2 focus-visible:outline-ring";
  return (
    <PlannerSheet
      title={title}
      description={month}
      onClose={onClose}
      active={active}
    >
      <div className="space-y-4">
        {header}
        <div className="flex flex-wrap gap-1.5">
          {tabs.map((tab) => (
            <Button
              key={tab.id}
              size="sm"
              variant={view === tab.id ? "secondary" : "ghost"}
              aria-pressed={view === tab.id}
              onClick={() => {
                setView(tab.id);
                setLimit(30);
              }}
            >
              {tab.title}
              {tab.id === "review" && data.pending.length
                ? ` (${data.pending.length})`
                : ""}
              {tab.id === "scheduled" && plans.length
                ? ` (${plans.length})`
                : ""}
            </Button>
          ))}
        </div>
        {!filter?.accountId && (
          <ActivitySelect
            label="Account"
            value={account}
            options={[{ id: "all", name: "All accounts" }, ...accounts]}
            onChange={(value) => {
              setAccount(value);
              setLimit(30);
            }}
          />
        )}
        {view === "recorded" && (
          <>
            {used && (
              <div className="rounded-xl border px-3 py-2.5">
                <p className="font-medium tabular-nums">
                  {formatMoney(used.used)} used
                </p>
                <p className="text-sm text-muted-foreground">
                  {formatMoney(used.spent)} expenses · {formatMoney(used.saved)}{" "}
                  savings
                </p>
              </div>
            )}
            {filter?.type !== "transfers" && (
              <Button size="sm" onClick={onLog} disabled={!canLog}>
                Log activity
              </Button>
            )}
            {entries.length === 0 && (
              <p className="text-sm text-muted-foreground">
                No recorded transactions here yet.
              </p>
            )}
            <ul className="space-y-2">
              {entries.slice(0, limit).map((row) => (
                <li
                  key={row._id}
                  className="flex items-start gap-1 rounded-lg border p-1"
                >
                  <button
                    type="button"
                    className={`${rowClass} border-0`}
                    onClick={() => onEdit(row)}
                  >
                    <span className="min-w-0">
                      <span className="block break-words text-sm font-medium">
                        {row.description}
                      </span>
                      <span className="block text-xs text-muted-foreground">
                        {row.date} · {accountNames.get(row.accountId)}
                        {row.destinationId
                          ? ` → ${accountNames.get(row.destinationId)}`
                          : ""}
                      </span>
                      <span className="block text-xs text-muted-foreground">
                        {ACTIVITY_LABELS[row.kind]}
                        {row.eTransfer ? " · e-transfer" : ""}
                      </span>
                      {categoryKind(row.kind) && (
                        <span className="mt-1 inline-block max-w-full break-words rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                          {categoryNames.get(row.categoryId ?? "") ??
                            "Choose category"}
                        </span>
                      )}
                    </span>
                    <span className="shrink-0 text-sm font-medium tabular-nums">
                      {formatMoney(row.amountCents)}
                    </span>
                  </button>
                  <ActivityDeleteButton
                    label={`Delete ${row.description}`}
                    onClick={() => onDelete(row)}
                  >
                    Delete
                  </ActivityDeleteButton>
                </li>
              ))}
            </ul>
          </>
        )}
        {view === "review" && (
          <>
            {notice && (
              <output className="block text-sm text-muted-foreground">
                {notice}
              </output>
            )}
            <Button size="sm" onClick={onImport} disabled={!canLog}>
              Import CSV
            </Button>
            <ReviewCoverage
              key={data.plan?.reviewedThrough ?? "unreviewed"}
              month={month}
              plan={data.plan}
            />
            {!pending.length && (
              <p className="text-sm text-muted-foreground">
                No imported transactions waiting for review.
              </p>
            )}
            <ul className="space-y-2">
              {pending.slice(0, limit).map((row) => (
                <li key={row._id}>
                  <button
                    type="button"
                    className={rowClass}
                    onClick={() => onReview(row)}
                  >
                    <span className="min-w-0">
                      <span className="block break-words text-sm font-medium">
                        {row.description}
                      </span>
                      <span className="block text-xs text-muted-foreground">
                        {row.date} · {accountNames.get(row.accountId)} ·{" "}
                        {row.direction === "out" ? "Money out" : "Money in"}
                      </span>
                    </span>
                    <span className="shrink-0 text-sm font-medium tabular-nums">
                      {formatMoney(row.amountCents)}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </>
        )}
        {view === "scheduled" && (
          <>
            {!plans.length && (
              <p className="text-sm text-muted-foreground">
                No scheduled items to record this month.
              </p>
            )}
            <ul className="space-y-2">
              {plans.slice(0, limit).map((row) => (
                <li
                  key={row._id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg border p-3"
                >
                  <div className="min-w-0">
                    <p className="break-words text-sm font-medium">
                      {row.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {row.dueDate} ·{" "}
                      {row.amountCents === null
                        ? "Amount unknown"
                        : formatMoney(row.amountCents)}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {onEditScheduled && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onEditScheduled(row)}
                      >
                        Edit scheduled
                      </Button>
                    )}
                    <ActivityDeleteButton
                      label={`Delete scheduled ${row.name}`}
                      onClick={() => onDeleteScheduled(row)}
                    >
                      Delete
                    </ActivityDeleteButton>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={!canLog}
                      onClick={() => onRecord(row)}
                    >
                      Log transaction
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          </>
        )}
        {rowCount > limit && (
          <Button
            variant="outline"
            onClick={() => setLimit((value) => value + 30)}
          >
            Show more ({rowCount - limit})
          </Button>
        )}
      </div>
    </PlannerSheet>
  );
}
