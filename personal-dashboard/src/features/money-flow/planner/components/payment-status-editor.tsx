"use client";
import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import type { Payment } from "../types";
import { paymentStatusLabels } from "../payment-status-labels";
import { useCanvasWriteContext } from "./planner-write-context";
import { PlannerSheet, usePlannerAction, FormError } from "./planner-form";
import { MoneyField as Field } from "../../components/money-field";
import { localToday } from "../../formatting";

export function PaymentStatusEditor({
  item,
  onClose,
}: Readonly<{
  item: Payment;
  onClose: () => void;
}>) {
  const canvas = useCanvasWriteContext();
  const labels = paymentStatusLabels(item.kind);
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
      title={labels.title}
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
          <Field label={labels.date}>
            <DatePicker
              aria-label={labels.date}
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
            {action.busy ? "Saving…" : labels.save}
          </Button>
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => void update("pending")}
            >
              {labels.undo}
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
