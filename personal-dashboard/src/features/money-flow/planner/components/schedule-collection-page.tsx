"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { MonthPicker } from "@/components/ui/month-picker";
import { Plus } from "lucide-react";
import { usePlanner, type PlannerData } from "../use-planner";
import { formatMoney } from "../../calculations";
import { PlannerShell, PlannerLoading } from "./planner-shell";
import { ScheduleEditor } from "./schedule-editor";
import { ScheduleCollectionList } from "./schedule-collection-list";
import { localToday } from "../../formatting";
import type { Payment } from "../types";
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
      "Schedule regular bills like mortgage, insurance and utilities.",
    add: "Add recurring payment",
    edit: "Edit recurring payment",
    month: "Recurring payment month",
    status: "Recurring payment status",
    next: "Next payment",
    empty: "No recurring payments in this view",
  },
  subscriptions: {
    title: "Subscriptions",
    description: "Schedule charges for services and memberships.",
    add: "Add subscription",
    edit: "Edit subscription",
    month: "Subscription month",
    status: "Subscription status",
    next: "Next charge",
    empty: "No subscriptions in this view",
  },
} as const;

/** Separate page categories share the same schedule records and editor. */
export function ScheduleCollectionPage({
  category,
}: Readonly<{
  category: keyof typeof categories;
}>) {
  const copy = categories[category];
  const subscription = category === "subscriptions";
  const planner = usePlanner(),
    { data, month } = planner;
  const [editor, setEditor] = useState<
      PlannerData["schedules"][number] | "new" | null
    >(null),
    [status, setStatus] = useState("active");
  const today = localToday();
  const asOf = month === today.slice(0, 7) ? today : `${month}-31`;
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
  const chargesBySeries = new Map<string, Payment[]>();
  for (const charge of charges) {
    if (charge.seriesId === null) continue;
    const group = chargesBySeries.get(charge.seriesId);
    if (group) group.push(charge);
    else chargesBySeries.set(charge.seriesId, [charge]);
  }
  const visibleSchedules = schedules.filter(
    (item) => status === "all" || item.status === status
  );
  const activeCount = schedules.filter(
    (item) => item.status === "active"
  ).length;
  return (
    <PlannerShell
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
              <span className="font-medium text-foreground">{activeCount}</span>{" "}
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
            {visibleSchedules.length === 0 ? (
              <div className="p-8 text-center">
                <h2 className="font-semibold">{copy.empty}</h2>
              </div>
            ) : (
              <ScheduleCollectionList
                items={visibleSchedules}
                chargesBySeries={chargesBySeries}
                accounts={data.accounts}
                month={month}
                nextLabel={copy.next}
                editLabel={copy.edit}
                onEdit={setEditor}
              />
            )}
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
