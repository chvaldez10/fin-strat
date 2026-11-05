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
import { selectClass, localToday } from "./planner-form";

export function SubscriptionsPage() {
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
    .filter((item) => item.isSubscription);
  const charges =
    data?.entries.filter(
      (item) =>
        item.isSubscription && item.month === month && item.status !== "skipped"
    ) ?? [];
  const cost = charges.reduce((sum, item) => sum + (item.amountCents ?? 0), 0),
    unknown = charges.filter((item) => item.amountCents === null).length;
  return (
    <PlannerShell
      page="subscriptions"
      title="Subscriptions & memberships"
      description="Know what renews, when it is charged, and which account pays for it."
      actions={
        <Button disabled={!data?.ready} onClick={() => setEditor("new")}>
          <Plus aria-hidden="true" />
          Add subscription
        </Button>
      }
    >
      {!data?.ready ? (
        <PlannerLoading error={planner.error} onRetry={planner.retry} />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-border bg-card p-5">
              <p className="text-xs text-muted-foreground">
                Active subscriptions
              </p>
              <p className="mt-2 text-3xl font-semibold">
                {schedules.filter((item) => item.status === "active").length}
              </p>
            </div>
            <div className="rounded-2xl border border-border bg-card p-5">
              <p className="text-xs text-muted-foreground">
                Charges scheduled this month
              </p>
              <p className="mt-2 text-3xl font-semibold tabular-nums">
                {formatMoney(cost)}
              </p>
              <p className="mt-2 text-xs text-muted-foreground">
                {unknown
                  ? `${unknown} unknown amounts excluded.`
                  : "Includes charges to credit cards."}
              </p>
            </div>
            <div className="rounded-2xl border border-border bg-muted/30 p-5 text-sm text-muted-foreground">
              Card-billed subscriptions are paid through your card statement.
              Their costs are shown here without duplicating cash commitments in
              the planner.
            </div>
          </div>
          <div className="flex flex-wrap justify-between gap-3">
            <MonthPicker
              aria-label="Subscription month"
              value={month}
              onValueChange={planner.setMonth}
            />
            <select
              aria-label="Subscription status"
              className={`${selectClass} w-auto!`}
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="active">Active</option>
              <option value="all">All statuses</option>
              <option value="paused">Paused</option>
              <option value="cancelled">Cancelled</option>
            </select>
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
                    .filter((payment) => payment.values.dueDate >= from);
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
                            ? `Next charge: ${displayDate(next)}, ${next.slice(0, 4)}`
                            : "No upcoming charge on this schedule"}
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
                          Edit subscription
                        </Button>
                      </div>
                    </div>
                  );
                })}
              {!schedules.filter(
                (item) => status === "all" || item.status === status
              ).length && (
                <div className="p-8 text-center">
                  <h2 className="font-semibold">
                    No subscriptions in this view
                  </h2>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Add a service or membership. Multiple accounts with the same
                    provider are supported.
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
              subscription
              onClose={() => setEditor(null)}
            />
          )}
        </>
      )}
    </PlannerShell>
  );
}
