"use client";

import { Button } from "@/components/ui/button";
import { formatMoney } from "../../calculations";
import { addMonths } from "../../months";
import { FREQUENCIES, schedulePayments } from "../recurrence";
import type { FinancialAccount, Payment } from "../types";
import type { PlannerData } from "../use-planner";
import { displayDate, paymentAmount } from "../../formatting";

type ScheduleRecord = PlannerData["schedules"][number];
export type CollectionSchedule = Readonly<
  ScheduleRecord & {
    current: ScheduleRecord;
    versions: PlannerData["scheduleVersions"];
  }
>;

type ScheduleListProps = Readonly<{
  items: readonly CollectionSchedule[];
  chargesBySeries: ReadonlyMap<string, readonly Payment[]>;
  accounts: readonly FinancialAccount[];
  month: string;
  nextLabel: string;
  editLabel: string;
  onEdit: (item: ScheduleRecord) => void;
}>;

function nextPaymentDate(item: CollectionSchedule, month: string) {
  const dates = Array.from({ length: 12 }, (_, offset) =>
    addMonths(month as `${number}-${number}`, offset + 1)
  )
    .flatMap((value) =>
      item.versions.flatMap((version) => schedulePayments(version, value))
    )
    .map((payment) => payment.values.dueDate)
    .sort((left, right) => left.localeCompare(right));
  return dates[0];
}

export function ScheduleCollectionList({
  items,
  chargesBySeries,
  ...props
}: ScheduleListProps) {
  return (
    <div className="divide-y divide-border">
      {items.map((item) => (
        <ScheduleCollectionRow
          key={item._id}
          item={item}
          charges={chargesBySeries.get(item.seriesId) ?? []}
          {...props}
        />
      ))}
    </div>
  );
}

function ScheduleCollectionRow({
  item,
  charges,
  accounts,
  month,
  nextLabel,
  editLabel,
  onEdit,
}: Readonly<
  Omit<ScheduleListProps, "items" | "chargesBySeries"> & {
    item: CollectionSchedule;
    charges: readonly Payment[];
  }
>) {
  const ordered = charges.toSorted((left, right) =>
    left.dueDate.localeCompare(right.dueDate)
  );
  const next = ordered.length === 0 ? nextPaymentDate(item, month) : undefined;
  const account = accounts.find((value) => value.id === item.accountId);
  return (
    <div className="flex flex-wrap items-center justify-between gap-5 p-5">
      <div className="min-w-0">
        <h2 className="font-semibold">{item.name}</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {FREQUENCIES[item.frequency]} ·{" "}
          {account?.name ?? "Account not assigned"} · {item.status}
        </p>
        {ordered.length > 0 ? (
          <ul
            aria-label="Scheduled this month"
            className="mt-2 flex flex-wrap gap-2"
          >
            {ordered.map((charge) => (
              <li
                key={charge._id}
                className="rounded-md bg-muted px-2 py-1 text-xs tabular-nums"
              >
                <time dateTime={charge.dueDate}>
                  {displayDate(charge.dueDate)}
                </time>
                {" · "}
                {charge.estimated && charge.amountCents !== null ? "≈ " : ""}
                {paymentAmount(charge.amountCents)}
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-xs text-muted-foreground">
            {next
              ? `${nextLabel}: ${displayDate(next)}, ${next.slice(0, 4)}`
              : "No upcoming payment on this schedule"}
          </p>
        )}
      </div>
      <div className="flex items-center gap-4">
        <div className="text-right">
          <p className="font-semibold tabular-nums">
            {paymentAmount(item.amountCents)}
          </p>
          {item.amountCents !== null && (
            <p className="text-xs text-muted-foreground">Per payment</p>
          )}
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
