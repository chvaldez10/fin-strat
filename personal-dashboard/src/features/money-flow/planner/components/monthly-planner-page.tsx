"use client";
import { useState } from "react";
import dynamic from "next/dynamic";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  CalendarCheck2,
  Plus,
  Repeat2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { MonthPicker } from "@/components/ui/month-picker";
import { formatMoney } from "../../calculations";
import { addMonths, formatYearMonth } from "../../months";
import { usePlanner, type PlannerData } from "../use-planner";
import { plannerTotals } from "../totals";
import type { Payment, PaymentValues } from "../types";
import { PlannerShell, PlannerLoading } from "./planner-shell";
import { PaymentList, paymentAmount, displayDate } from "./payment-list";
import { PaymentEditor } from "./payment-editor";
import { PaymentStatusEditor } from "./payment-status-editor";
import { ScheduleEditor } from "./schedule-editor";
import { MonthReviewEditor } from "./month-review-editor";
import { RecurringList } from "./recurring-list";
import { selectClass } from "./planner-form";
import { MonthlySalarySummary } from "./monthly-salary-summary";

const YearView = dynamic(
  () => import("./year-view").then((module) => module.YearView),
  { loading: () => <p>Loading year view…</p> }
);
type Editor =
  | { type: "payment"; item?: Payment; initial?: Partial<PaymentValues> }
  | { type: "status"; item: Payment }
  | {
      type: "schedule";
      item?: PlannerData["schedules"][number];
      income?: boolean;
    }
  | { type: "review" }
  | null;
export function MonthlyPlannerPage() {
  const planner = usePlanner();
  const { data, month } = planner;
  const [editor, setEditor] = useState<Editor>(null),
    [showYear, setYear] = useState(false),
    [showRecurring, setRecurring] = useState(false);
  const [account, setAccount] = useState("all"),
    [status, setStatus] = useState("all");
  const totals = data
    ? plannerTotals(
        data.entries,
        data.accounts,
        month,
        data.carryInCents,
        data.settlements
      )
    : null;
  const close = () => setEditor(null);
  const move = (offset: number) => {
    close();
    planner.setMonth(addMonths(month as `${number}-${number}`, offset));
  };
  const filtered =
    data?.entries
      .filter(
        (item) =>
          (account === "all" || item.accountId === account) &&
          (status === "all" || item.status === status)
      )
      .sort((a, b) => a.dueDate.localeCompare(b.dueDate)) ?? [];
  return (
    <PlannerShell
      page="month"
      title="Your month, in balance."
      description="Keep bills, card payments and savings within your salary. One month at a time."
      actions={
        <>
          <Button
            variant="outline"
            onClick={() => setEditor({ type: "schedule", income: true })}
            disabled={!data?.ready}
          >
            Add salary
          </Button>
          <Button
            onClick={() => setEditor({ type: "payment" })}
            disabled={!data?.ready}
          >
            <Plus aria-hidden="true" />
            Add payment
          </Button>
        </>
      }
    >
      {!data?.ready || !totals ? (
        <PlannerLoading error={planner.error} onRetry={planner.retry} />
      ) : (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                aria-label="Previous month"
                onClick={() => move(-1)}
                disabled={month === "1900-01"}
              >
                <ArrowLeft />
              </Button>
              <MonthPicker
                aria-label="Planner month"
                value={month}
                onValueChange={(value) => {
                  close();
                  planner.setMonth(value);
                }}
              />
              <Button
                variant="outline"
                size="icon"
                aria-label="Next month"
                onClick={() => move(1)}
                disabled={month === "2200-12"}
              >
                <ArrowRight />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="ghost"
                aria-expanded={showYear}
                onClick={() => setYear((v) => !v)}
              >
                {showYear ? "Hide year view" : "Year view"}
              </Button>
              <Button
                variant="outline"
                onClick={() => setEditor({ type: "review" })}
              >
                <CalendarCheck2 aria-hidden="true" />
                {data.review?.closed ? "Month reviewed" : "Review month"}
              </Button>
            </div>
          </div>
          <MonthlySalarySummary totals={totals} />
          <section
            className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border bg-muted/20 p-5"
            aria-label="Monthly carryover"
          >
            <div>
              <p className="text-sm font-medium">Money from last month</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {data.carryInCents === null
                  ? "Confirm your carry-in cash to see remaining funds."
                  : `${formatMoney(data.carryInCents)} confirmed carry-in${data.previousConfirmed ? " from the previous review" : ""}.`}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-4">
              <div>
                <p className="text-xs text-muted-foreground">
                  Funds after commitments
                </p>
                <p className="mt-1 text-lg font-semibold tabular-nums">
                  {totals.available === null
                    ? "Not confirmed"
                    : formatMoney(totals.available)}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setEditor({ type: "review" })}
              >
                Update carryover
              </Button>
            </div>
          </section>
          <section className="overflow-hidden rounded-2xl border border-border bg-card">
            <div className="flex flex-wrap items-center justify-between gap-3 p-5">
              <div>
                <h2 className="font-semibold">
                  Payments for {formatYearMonth(month as `${number}-${number}`)}
                </h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  {formatMoney(totals.pending)} still to pay. Totals above
                  include all accounts.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <select
                  aria-label="Filter by account"
                  className={`${selectClass} w-auto! max-w-48`}
                  value={account}
                  onChange={(e) => setAccount(e.target.value)}
                >
                  <option value="all">All accounts</option>
                  {data.accounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name}
                    </option>
                  ))}
                </select>
                <select
                  aria-label="Filter by status"
                  className={`${selectClass} w-auto!`}
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                >
                  <option value="all">All statuses</option>
                  <option value="pending">Not paid</option>
                  <option value="paid">Paid</option>
                  <option value="skipped">Skipped</option>
                </select>
              </div>
            </div>
            <PaymentList
              items={filtered}
              accounts={data.accounts}
              month={month}
              onEdit={(item) => setEditor({ type: "payment", item })}
              onStatus={(item) => setEditor({ type: "status", item })}
            />
          </section>
          <section className="overflow-hidden rounded-2xl border border-border">
            <div className="flex flex-wrap items-center justify-between gap-3 p-5">
              <div>
                <h2 className="font-semibold">Recurring payments</h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  Set up the dates once. Adjust individual payments when
                  something changes.
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  onClick={() => setRecurring((v) => !v)}
                  aria-expanded={showRecurring}
                >
                  {showRecurring ? "Hide schedules" : "Manage recurring"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setEditor({ type: "schedule" })}
                >
                  <Repeat2 aria-hidden="true" />
                  Add recurring
                </Button>
              </div>
            </div>
            {showRecurring && (
              <RecurringList
                items={data.schedules}
                onEdit={(item) => setEditor({ type: "schedule", item })}
              />
            )}
          </section>
          <section className="rounded-2xl border border-border p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="font-semibold">Coming next month</h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  Next recurring dates. Unpaid bills stay linked to their
                  original payment.
                </p>
              </div>
              <Button
                variant="ghost"
                aria-label="Open next month"
                onClick={() => move(1)}
              >
                <ArrowUpRight />
              </Button>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {data.next.map((item) => (
                <div
                  key={item.occurrenceKey}
                  className="rounded-xl bg-muted/40 p-3"
                >
                  <p className="truncate text-sm font-medium">
                    {item.values.name}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {displayDate(item.values.dueDate)} ·{" "}
                    {paymentAmount(item.values.amountCents)}
                  </p>
                </div>
              ))}
              {!data.next.length && (
                <p className="text-sm text-muted-foreground">
                  Add recurring payments to see upcoming dates here.
                </p>
              )}
            </div>
          </section>
          {showYear && <YearView year={Number(month.slice(0, 4))} />}
          <p className="text-xs text-muted-foreground">
            Allocation totals help plan salary and cash commitments. They are
            not a reconciled bank balance. Credit-card charges are reflected
            through card repayments.
          </p>
          {editor?.type === "payment" && (
            <PaymentEditor
              month={month}
              accounts={data.accounts}
              item={editor.item}
              initial={editor.initial}
              onClose={close}
            />
          )}
          {editor?.type === "status" && (
            <PaymentStatusEditor item={editor.item} onClose={close} />
          )}
          {editor?.type === "schedule" && (
            <ScheduleEditor
              month={month}
              accounts={data.accounts}
              item={editor.item}
              income={editor.income}
              onClose={close}
            />
          )}
          {editor?.type === "review" && (
            <MonthReviewEditor
              month={month}
              data={data}
              suggestion={totals.suggestedCarryOut}
              onClose={close}
            />
          )}
        </>
      )}
    </PlannerShell>
  );
}
