import { useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import { formatMoney } from "../../calculations";
import type { ActivityEntry } from "../activity-data";
import { ActivityDeleteConfirmation } from "./activity-delete-confirmation";
import { usePlannerAction } from "./planner-form";
import { useCanvasWriteContext } from "./planner-write-context";

export function ActivityEntryRemoval({
  entry,
  revision = entry.revision,
  presentation = "sheet",
  onClose,
  onRemoved,
}: Readonly<{
  entry: ActivityEntry;
  revision?: number;
  presentation?: "sheet" | "canvas";
  onClose: () => void;
  onRemoved: () => void;
}>) {
  const remove = useMutation(api.plannerActivity.removeEntry);
  const canvas = useCanvasWriteContext();
  const action = usePlannerAction();
  return (
    <ActivityDeleteConfirmation
      title="Delete transaction?"
      description={`${entry.description} · ${formatMoney(entry.amountCents)} · ${entry.date}`}
      presentation={presentation}
      pending={action.busy}
      error={action.error}
      onClose={onClose}
      onDelete={() =>
        void action.run(
          () =>
            remove({
              id: entry._id,
              expectedRevision: revision,
              canvas: canvas?.identity,
            }),
          onRemoved
        )
      }
    >
      Deleting this transaction updates the monthly totals. Any matched import
      returns to Needs review.
    </ActivityDeleteConfirmation>
  );
}
