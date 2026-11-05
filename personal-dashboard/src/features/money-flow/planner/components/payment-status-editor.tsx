"use client";
import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import type { Payment } from "../types";
import { useCanvasWriteContext } from "./planner-write-context";
import {
  PlannerSheet,
  Field,
  usePlannerAction,
  localToday,
  FormError,
} from "./planner-form";

export function PaymentStatusEditor({
  item,
  onClose,
}: {
  item: Payment;
  onClose: () => void;
}) {
  const canvas = useCanvasWriteContext();
  const [paidOn, setPaidOn] = useState(item.paidOn ?? localToday()),
    action = usePlannerAction(),
    save = useMutation(api.plannerPayments.setStatus);
  const update = (status: Payment["status"]) =>
    action.run(
      () =>
        save({
          canvas: canvas?.identity,
          id: item._id as Id<"moneyPlannerPayments">,
          expectedRevision: item.revision,
          status,
          paidOn: status === "paid" ? paidOn : null,
        }),
      onClose
    );
  return (
    <PlannerSheet
      title={
        item.kind === "income"
          ? "Record income received"
          : item.kind === "savings"
            ? "Record savings completed"
            : "Record payment"
      }
      description={item.name}
      onClose={onClose}
      pending={action.busy}
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void update("paid");
        }}
      >
        <fieldset disabled={action.busy} className="space-y-5">
          <legend className="sr-only">Payment status</legend>
          <Field
            label={
              item.kind === "income"
                ? "Received on"
                : item.kind === "savings"
                  ? "Completed on"
                  : "Paid on"
            }
          >
            <DatePicker
              aria-label="Paid on"
              className="w-full"
              value={paidOn}
              onValueChange={setPaidOn}
            />
          </Field>
          <p className="text-sm text-muted-foreground">
            This records the date. The amount remains in this month's
            allocation, and account balances are not changed automatically.
          </p>
          <FormError message={action.error} />
          <Button type="submit" className="w-full">
            {action.busy ? "Saving…" : "Save paid date"}
          </Button>
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => void update("pending")}
            >
              Mark unpaid
            </Button>
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => void update("skipped")}
            >
              Skip this payment
            </Button>
          </div>
        </fieldset>
      </form>
    </PlannerSheet>
  );
}
