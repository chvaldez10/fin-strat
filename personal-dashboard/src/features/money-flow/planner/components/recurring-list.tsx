"use client";
import type { PlannerData } from "../use-planner";
import { FREQUENCIES } from "../recurrence";
import { paymentAmount } from "./payment-list";
import { Button } from "@/components/ui/button";

export function RecurringList({
  items,
  onEdit,
}: {
  items: PlannerData["schedules"];
  onEdit: (item: PlannerData["schedules"][number]) => void;
}) {
  return (
    <div className="divide-y divide-border">
      {items.length ? (
        items.map((item) => (
          <div
            key={item._id}
            className="flex flex-wrap items-center justify-between gap-3 px-5 py-4"
          >
            <div className="min-w-0">
              <p className="font-medium">{item.name}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {FREQUENCIES[item.frequency]} · {item.status}
                {item.estimated ? " · estimate" : ""}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm tabular-nums">
                {paymentAmount(item.amountCents)}
              </span>
              <Button variant="outline" size="sm" onClick={() => onEdit(item)}>
                Edit schedule
              </Button>
            </div>
          </div>
        ))
      ) : (
        <p className="p-5 text-sm text-muted-foreground">
          No schedules in this group yet. Add a schedule to plan the dates and
          amounts each month.
        </p>
      )}
    </div>
  );
}
