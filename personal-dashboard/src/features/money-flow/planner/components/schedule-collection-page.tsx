"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { MonthPicker } from "@/components/ui/month-picker";
import { Plus } from "lucide-react";
import { usePlanner, type PlannerData } from "../use-planner";
import { schedulePayments, FREQUENCIES } from "../recurrence";
import { addMonths } from "../../months";
import { formatMoney } from "../../calculations";
import { PlannerShell, PlannerLoading } from "./planner-shell";
import { ScheduleEditor } from "./schedule-editor";
import { displayDate, paymentAmount } from "./payment-list";
import { localToday } from "./planner-form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const categories = {
  recurring: {
    title: "Recurring payments",
    description:
      "Plan regular bills such as mortgage, insurance, utilities and car payments.",
    add: "Add recurring payment",
    edit: "Edit recurring payment",
    count: "Active recurring payments",
    month: "Recurring payment month",
    status: "Recurring payment status",
    next: "Next payment",
    empty: "No recurring payments in this view",
    hint: "Add a regular bill. Services such as YouTube Premium belong on the Subscriptions page.",
  },
  subscriptions: {
    title: "Subscriptions & memberships",
    description:
      "Keep services such as YouTube Premium separate from your regular household bills.",
    add: "Add subscription",
    edit: "Edit subscription",
    count: "Active subscriptions",
    month: "Subscription month",
    status: "Subscription status",
    next: "Next charge",
    empty: "No subscriptions in this view",
    hint: "Add a service or membership. Multiple accounts with the same provider are supported.",
  },
} as const;

/** Separate page categories share the same schedule records and editor. */
export function ScheduleCollectionPage({
  category,
}: {
  category: keyof typeof categories;
}) {
  const copy = categories[category];
  const subscription = category === "subscriptions";
  const planner = usePlanner(),
    { data, month } = planner;
  const [editor, setEditor] = useState<
      PlannerData["schedules"][number] | "new" | null
    >(null),
    [status, setStatus] = useState("active");
  const asOf =
    month === localToday().slice(0, 7) ? localToday() : `${month}-31`;
  const schedules = (data?.schedules ?? [])
    .map((current) => {
      const versions =
        data?.scheduleVersions.filter(
          (item) => item.seriesId === current.seriesId
        ) ?? [];
      const display =
        versions.find(
          (item) =>
            item.effectiveFrom <= asOf &&
            (!item.effectiveTo || item.effectiveTo > asOf)
        ) ?? current;
      return { ...display, current, versions };
    })
    .filter(
      (item) => item.kind === "expense" && item.isSubscription === subscription
    );
  const charges =
    data?.entries.filter(
      (item) =>
        item.seriesId !== null &&
        item.kind === "expense" &&
        item.isSubscription === subscription &&
        item.month === month &&
        item.status !== "skipped"
    ) ?? [];
  const cost = charges.reduce((sum, item) => sum + (item.amountCents ?? 0), 0),
    unknown = charges.filter((item) => item.amountCents === null).length;
  return (
    <PlannerShell
      page={category}
      title={copy.title}
      description={copy.description}
      actions={
        <Button disabled={!data?.ready} onClick={() => setEditor("new")}>
          <Plus aria-hidden="true" />
          {copy.add}
        </Button>
      }
    >
      {!data?.ready ? (
        <PlannerLoading error={planner.error} onRetry={planner.retry} />
      ) : (
        <>
          <div className="flex flex-wrap items-baseline gap-x-8 gap-y-2 border-b border-border pb-5">
            <p className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground">
                {schedules.filter((item) => item.status === "active").length}
              </span>{" "}
              active
            </p>
            <p className="text-sm text-muted-foreground">
              Scheduled this month{" "}
              <span className="ml-2 text-xl font-semibold text-foreground tabular-nums">
                {formatMoney(cost)}
              </span>
            </p>
            {unknown > 0 && (
              <p className="text-xs text-muted-foreground">
                {unknown} unknown amounts excluded
              </p>
            )}
          </div>
          <div className="flex flex-wrap justify-between gap-3">
            <MonthPicker
              aria-label={copy.month}
              className="w-auto min-w-44"
              value={month}
              onValueChange={planner.setMonth}
            />
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger aria-label={copy.status} className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="paused">Paused</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <section className="overflow-hidden rounded-2xl border border-border">
            <div className="divide-y divide-border">
              {schedules
                .filter((item) => status === "all" || item.status === status)
                .map((item) => {
                  const from =
                    month === localToday().slice(0, 7)
                      ? localToday()
                      : `${month}-01`;
                  const dates = Array.from({ length: 13 }, (_, i) =>
                    addMonths(month as `${number}-${number}`, i)
                  )
                    .flatMap((m) =>
                      item.versions.flatMap((version) =>
                        schedulePayments(version, m)
                      )
                    )
                    .filter((payment) => payment.values.dueDate >= from)
                    .sort((a, b) =>
                      a.values.dueDate.localeCompare(b.values.dueDate)
                    );
                  const next = dates[0]?.values.dueDate,
                    account = data.accounts.find(
                      (a) => a.id === item.accountId
                    );
                  return (
                    <div
                      key={item._id}
                      className="flex flex-wrap items-center justify-between gap-5 p-5"
                    >
                      <div className="min-w-0">
                        <h2 className="font-semibold">{item.name}</h2>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {FREQUENCIES[item.frequency]} ·{" "}
                          {account?.name ?? "Account not assigned"} ·{" "}
                          {item.status}
                        </p>
                        <p className="mt-2 text-xs text-muted-foreground">
                          {next
                            ? `${copy.next}: ${displayDate(next)}, ${next.slice(0, 4)}`
                            : "No upcoming payment on this schedule"}
                        </p>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="font-semibold tabular-nums">
                            {paymentAmount(item.amountCents)}
                          </p>
                          {item.frequency === "yearly" &&
                            item.amountCents !== null && (
                              <p className="mt-1 text-xs text-muted-foreground">
                                {formatMoney(Math.round(item.amountCents / 12))}
                                /month equivalent
                              </p>
                            )}
                          {item.estimated && (
                            <p className="text-xs text-muted-foreground">
                              Estimated
                            </p>
                          )}
                        </div>
                        <Button
                          variant="outline"
                          onClick={() => setEditor(item.current)}
                        >
                          {copy.edit}
                        </Button>
                      </div>
                    </div>
                  );
                })}
              {!schedules.filter(
                (item) => status === "all" || item.status === status
              ).length && (
                <div className="p-8 text-center">
                  <h2 className="font-semibold">{copy.empty}</h2>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {copy.hint}
                  </p>
                </div>
              )}
            </div>
          </section>
          {editor && (
            <ScheduleEditor
              month={month}
              accounts={data.accounts}
              item={editor === "new" ? undefined : editor}
              subscription={subscription}
              expenseOnly
              onClose={() => setEditor(null)}
            />
          )}
        </>
      )}
    </PlannerShell>
  );
}
