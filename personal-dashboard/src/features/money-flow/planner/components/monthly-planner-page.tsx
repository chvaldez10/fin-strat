"use client";
import { useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  ChevronDown,
  MoreHorizontal,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { MonthPicker } from "@/components/ui/month-picker";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatMoney } from "../../calculations";
import { addMonths } from "../../months";
import { usePlanner, type PlannerData } from "../use-planner";
import { MONEY_PATH, monthLink } from "../../routes";
import { plannerTotals } from "../totals";
import type { Payment } from "../types";
import { PlannerShell, PlannerLoading } from "./planner-shell";

import { PaymentList } from "./payment-list";
import { paymentAmount, displayDate } from "../../formatting";
import { PaymentEditor } from "./payment-editor";
import { ScheduleEditor } from "./schedule-editor";
import { MonthReviewEditor } from "./month-review-editor";
import { RecurringList } from "./recurring-list";
import { MonthlySalarySummary } from "./monthly-salary-summary";

const YearView = dynamic(
  () => import("./year-view").then((module) => module.YearView),
  {
    loading: () => <p>Loading year view…</p>,
  }
);
type Editor =
  | { type: "payment"; item?: Payment }
  | {
      type: "schedule";
      item?: PlannerData["schedules"][number];
    }
  | { type: "review" }
  | null;
const monthlyScheduleKinds = ["income", "savings", "transfer"] as const;

export function MonthlyPlannerPage() {
  const planner = usePlanner();
  const { data, month } = planner;
  const [editor, setEditor] = useState<Editor>(null);
  const [showYear, setYear] = useState(false);
  const [account, setAccount] = useState("all");
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
      .filter((item) => account === "all" || item.accountId === account)
      .sort((a, b) => a.dueDate.localeCompare(b.dueDate)) ?? [];
  return (
    <PlannerShell
      title="Monthly plan"
      description="Review scheduled income and payments for the selected month."
      actions={
        <>
          <Button
            onClick={() => setEditor({ type: "payment" })}
            disabled={!data?.ready}
          >
            <Plus aria-hidden="true" /> Add one-time payment
          </Button>
          <DropdownMenu modal={false}>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                aria-label="Monthly plan options"
                disabled={!data?.ready}
              >
                <MoreHorizontal aria-hidden="true" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem asChild>
                <Link href={monthLink(`${MONEY_PATH}/upcoming`, month)}>
                  Open scheduled canvas
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuCheckboxItem
                checked={showYear}
                onCheckedChange={setYear}
              >
                Show year view
              </DropdownMenuCheckboxItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </>
      }
    >
      {!data?.ready || !totals ? (
        <PlannerLoading error={planner.error} onRetry={planner.retry} />
      ) : (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                aria-label="Previous month"
                onClick={() => move(-1)}
                disabled={month === "1900-01"}
              >
                <ArrowLeft />
              </Button>
              <MonthPicker
                aria-label="Planner month"
                className="w-auto min-w-44"
                value={month}
                onValueChange={(value) => {
                  close();
                  planner.setMonth(value);
                }}
              />
              <Button
                variant="ghost"
                size="icon"
                aria-label="Next month"
                onClick={() => move(1)}
                disabled={month === "2200-12"}
              >
                <ArrowRight />
              </Button>
            </div>
            <span className="text-xs text-muted-foreground">
              All accounts · CAD
            </span>
          </div>
          <MonthlySalarySummary totals={totals} />
          <section
            className="overflow-hidden rounded-xl border border-border bg-card"
            aria-label="Monthly payments"
          >
            <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-5">
              <h2 className="text-sm font-semibold">
                Scheduled payments{" "}
                <span className="ml-1 font-normal text-muted-foreground">
                  {filtered.length}
                </span>
              </h2>
              <Select value={account} onValueChange={setAccount}>
                <SelectTrigger aria-label="Filter by account" className="w-44">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All accounts</SelectItem>
                  {data.accounts.map((item) => (
                    <SelectItem key={item.id} value={item.id}>
                      {item.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <PaymentList
              items={filtered}
              accounts={data.accounts}
              month={month}
              onEdit={(item) => setEditor({ type: "payment", item })}
            />
          </section>
          <div className="divide-y divide-border border-y border-border">
            <details className="group">
              <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-3 py-3 text-sm font-medium outline-none focus-visible:ring-2 focus-visible:ring-ring [&::-webkit-details-marker]:hidden">
                <span>
                  Cash carryover{" "}
                  <span className="ml-2 font-normal text-muted-foreground">
                    {data.carryInCents === null
                      ? "Not confirmed"
                      : formatMoney(data.carryInCents)}
                  </span>
                </span>
                <ChevronDown
                  className="size-4 text-muted-foreground group-open:rotate-180"
                  aria-hidden="true"
                />
              </summary>
              <div className="flex flex-wrap items-center justify-between gap-3 pb-4 text-sm">
                <p className="text-muted-foreground">
                  After planned commitments:{" "}
                  <span className="font-medium text-foreground">
                    {totals.available === null
                      ? "Confirm cash carry-in"
                      : formatMoney(totals.available)}
                  </span>
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setEditor({ type: "review" })}
                >
                  {data.review?.closed
                    ? "Month reviewed"
                    : "Review month & carryover"}
                </Button>
              </div>
            </details>
            <details className="group">
              <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-3 py-3 text-sm font-medium outline-none focus-visible:ring-2 focus-visible:ring-ring [&::-webkit-details-marker]:hidden">
                Salary, savings & transfer schedules
                <ChevronDown
                  className="size-4 text-muted-foreground group-open:rotate-180"
                  aria-hidden="true"
                />
              </summary>
              <div className="space-y-3 pb-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setEditor({ type: "schedule" })}
                >
                  <Plus aria-hidden="true" /> Add schedule
                </Button>
                <RecurringList
                  items={data.schedules.filter((item) =>
                    monthlyScheduleKinds.some((kind) => kind === item.kind)
                  )}
                  onEdit={(item) => setEditor({ type: "schedule", item })}
                />
              </div>
            </details>
            <details className="group">
              <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-3 py-3 text-sm font-medium outline-none focus-visible:ring-2 focus-visible:ring-ring [&::-webkit-details-marker]:hidden">
                Coming next month
                <ChevronDown
                  className="size-4 text-muted-foreground group-open:rotate-180"
                  aria-hidden="true"
                />
              </summary>
              <div className="space-y-2 pb-4">
                {data.next.map((item) => (
                  <div
                    key={item.occurrenceKey}
                    className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm"
                  >
                    <span>{item.values.name}</span>
                    <span className="text-muted-foreground">
                      {displayDate(item.values.dueDate)} ·{" "}
                      {paymentAmount(item.values.amountCents)}
                    </span>
                  </div>
                ))}
                {!data.next.length && (
                  <p className="text-sm text-muted-foreground">
                    No recurring payments scheduled yet.
                  </p>
                )}
                <Button variant="ghost" size="sm" onClick={() => move(1)}>
                  Open next month <ArrowRight aria-hidden="true" />
                </Button>
              </div>
            </details>
          </div>
          {showYear && <YearView year={Number(month.slice(0, 4))} />}
          <p className="text-xs text-muted-foreground">
            Planned amounts, not a live bank balance. Credit-card charges count
            through their card repayments.
          </p>
          {editor?.type === "payment" && (
            <PaymentEditor
              month={month}
              accounts={data.accounts}
              item={editor.item}
              onClose={close}
            />
          )}
          {editor?.type === "schedule" && (
            <ScheduleEditor
              month={month}
              accounts={data.accounts}
              item={editor.item}
              allowedKinds={monthlyScheduleKinds}
              onClose={close}
            />
          )}
          {editor?.type === "review" && (
            <MonthReviewEditor
              month={month}
              data={data}
              suggestion={null}
              onClose={close}
            />
          )}
        </>
      )}
    </PlannerShell>
  );
}
