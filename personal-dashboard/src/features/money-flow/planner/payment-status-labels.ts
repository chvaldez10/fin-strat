import type { PaymentKind } from "./types";

/** The stored completion status is shared; its meaning depends on the item. */
export function paymentStatusLabels(kind: PaymentKind) {
  if (kind === "income")
    return {
      done: "Received",
      pending: "Not received",
      action: "Mark received",
      date: "Received on",
      save: "Save received date",
      undo: "Mark not received",
      title: "Record income received",
      activity: "received",
    };
  if (kind === "savings" || kind === "transfer")
    return {
      done: "Completed",
      pending: "Not completed",
      action: "Mark completed",
      date: "Completed on",
      save: "Save completion date",
      undo: "Mark not completed",
      title:
        kind === "savings"
          ? "Record savings completed"
          : "Record transfer completed",
      activity: "completed",
    };
  return {
    done: "Paid",
    pending: "Not paid",
    action: "Mark paid",
    date: "Paid on",
    save: "Save paid date",
    undo: "Mark unpaid",
    title: "Record payment",
    activity: "paid",
  };
}
