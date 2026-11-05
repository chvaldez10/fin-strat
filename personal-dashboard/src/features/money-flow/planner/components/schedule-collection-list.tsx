"use client";

import { Button } from "@/components/ui/button";
import { formatMoney } from "../../calculations";
import { addMonths } from "../../months";
import { FREQUENCIES, schedulePayments } from "../recurrence";
import type { FinancialAccount } from "../types";
import type { PlannerData } from "../use-planner";
import { displayDate, paymentAmount } from "./payment-list";

type ScheduleRecord = PlannerData["schedules"][number];
export type CollectionSchedule = Readonly<
  ScheduleRecord & {
    current: ScheduleRecord;
    versions: PlannerData["scheduleVersions"];
  }
>;

type ScheduleListProps = Readonly<{
  items: readonly CollectionSchedule[];
  accounts: readonly FinancialAccount[];
  month: string;
  today: string;
  nextLabel: string;
  editLabel: string;
  onEdit: (item: ScheduleRecord) => void;
}>;

function nextPaymentDate(
  item: CollectionSchedule,
  month: string,
  today: string
) {
  const from = month === today.slice(0, 7) ? today : `${month}-01`;
  const dates = Array.from({ length: 13 }, (_, offset) =>
    addMonths(month as `${number}-${number}`, offset)
  )
    .flatMap((value) =>
      item.versions.flatMap((version) => schedulePayments(version, value))
    )
    .filter((payment) => payment.values.dueDate >= from)
    .map((payment) => payment.values.dueDate)
    .sort((left, right) => left.localeCompare(right));
  return dates[0];
}

export function ScheduleCollectionList({ items, ...props }: ScheduleListProps) {
  return (
    <div className="divide-y divide-border">
      {items.map((item) => (
        <ScheduleCollectionRow key={item._id} item={item} {...props} />
      ))}
    </div>
  );
}

function ScheduleCollectionRow({
  item,
  accounts,
  month,
  today,
  nextLabel,
  editLabel,
  onEdit,
}: Readonly<Omit<ScheduleListProps, "items"> & { item: CollectionSchedule }>) {
  const next = nextPaymentDate(item, month, today);
  const account = accounts.find((value) => value.id === item.accountId);
  return (
    <div className="flex flex-wrap items-center justify-between gap-5 p-5">
      <div className="min-w-0">
        <h2 className="font-semibold">{item.name}</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {FREQUENCIES[item.frequency]} ·{" "}
          {account?.name ?? "Account not assigned"} · {item.status}
        </p>
        <p className="mt-2 text-xs text-muted-foreground">
          {next
            ? `${nextLabel}: ${displayDate(next)}, ${next.slice(0, 4)}`
            : "No upcoming payment on this schedule"}
        </p>
      </div>
      <div className="flex items-center gap-4">
        <div className="text-right">
          <p className="font-semibold tabular-nums">
            {paymentAmount(item.amountCents)}
          </p>
          {item.frequency === "yearly" && item.amountCents !== null && (
            <p className="mt-1 text-xs text-muted-foreground">
              {formatMoney(Math.round(item.amountCents / 12))}/month equivalent
            </p>
          )}
          {item.estimated && (
            <p className="text-xs text-muted-foreground">Estimated</p>
          )}
        </div>
        <Button variant="outline" onClick={() => onEdit(item.current)}>
          {editLabel}
        </Button>
      </div>
    </div>
  );
}
