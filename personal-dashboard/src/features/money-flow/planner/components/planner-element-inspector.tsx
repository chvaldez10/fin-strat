"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { FinancialAccount, Payment } from "../types";
import { PlannerSheet } from "./planner-form";
import { PaymentEditor } from "./payment-editor";
import { PaymentStatusEditor } from "./payment-status-editor";
import { displayDate, paymentAmount } from "./payment-list";

export function PlannerElementInspector({
  items,
  accounts,
  month,
  onClose,
}: {
  items: Payment[];
  accounts: FinancialAccount[];
  month: string;
  onClose: () => void;
}) {
  const [editing, setEditing] = useState<Payment | null>(null),
    [status, setStatus] = useState<Payment | null>(null);
  return (
    <PlannerSheet
      title={items[0]?.name ?? "Element payments"}
      description="These are the same payment records used by the monthly planner and account pages."
      onClose={onClose}
    >
      <div className="space-y-4">
        {items.map((item) => (
          <div key={item._id} className="rounded-xl border border-border p-4">
            <p className="font-medium">
              {displayDate(item.dueDate)} · {paymentAmount(item.amountCents)}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {item.paidOn
                ? `Paid ${item.paidOn}`
                : item.status === "skipped"
                  ? "Skipped"
                  : "Not paid"}
              {item.statementMonth ? ` · Statement ${item.statementMonth}` : ""}
            </p>
            <div className="mt-3 flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setEditing(item)}
              >
                Edit payment
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setStatus(item)}
              >
                Paid date
              </Button>
            </div>
          </div>
        ))}
      </div>
      {editing && (
        <PaymentEditor
          month={month}
          accounts={accounts}
          item={editing}
          onClose={() => setEditing(null)}
        />
      )}{" "}
      {status && (
        <PaymentStatusEditor item={status} onClose={() => setStatus(null)} />
      )}
    </PlannerSheet>
  );
}
