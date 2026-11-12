import { useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { formatMoney } from "../../calculations";
import type { Payment } from "../types";
import { ActivityDeleteConfirmation } from "./activity-delete-confirmation";
import { usePlannerAction } from "./planner-form";
import { useCanvasWriteContext } from "./planner-write-context";

export function ActivityScheduledRemoval({
  item,
  onClose,
  onRemoved,
}: Readonly<{
  item: Payment;
  onClose: () => void;
  onRemoved: () => void;
}>) {
  const setStatus = useMutation(api.plannerPayments.setStatus);
  const canvas = useCanvasWriteContext();
  const action = usePlannerAction();
  const title =
    item.kind === "income"
      ? "Delete scheduled income?"
      : "Delete scheduled payment?";
  const amount =
    item.amountCents === null
      ? "Amount unknown"
      : formatMoney(item.amountCents);
  return (
    <ActivityDeleteConfirmation
      title={title}
      description={`${item.name} · ${amount} · ${item.dueDate}`}
      pending={action.busy}
      error={action.error}
      onClose={onClose}
      onDelete={() =>
        void action.run(
          () =>
            setStatus({
              id: item._id as Id<"moneyPlannerPayments">,
              expectedRevision: item.revision,
              canvas: canvas?.identity,
              status: "skipped",
              paidOn: null,
            }),
          onRemoved
        )
      }
    >
      This removes the selected occurrence from the plan. Future occurrences
      stay scheduled.
    </ActivityDeleteConfirmation>
  );
}
