"use client";
import { useState } from "react";
import type { FinancialAccount, Payment } from "../types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CanvasInspector } from "../../components/canvas-inspector";
import { PaymentEditor } from "./payment-editor";
import { displayDate, paymentAmount } from "../../formatting";
import { CanvasPaymentForm } from "./canvas-payment-form";

export function PlannerElementInspector({
  items,
  accounts,
  month,
  onClose,
}: Readonly<{
  items: Payment[];
  accounts: FinancialAccount[];
  month: string;
  onClose: () => void;
}>) {
  const [editing, setEditing] = useState<Payment | null>(null);
  const [choice, setChoice] = useState<string | null>(null);
  const item = items.find((payment) => payment._id === choice) ?? items[0];
  if (!item) return null;
  const title =
    item.kind === "income"
      ? "Edit income"
      : item.kind === "savings"
        ? "Edit savings"
        : item.kind === "transfer"
          ? "Edit transfer"
          : "Edit expense";
  const content = (
    <div className="space-y-4">
      {items.length > 1 && (
        <div className="space-y-2">
          <label
            htmlFor="canvas-payment-occurrence"
            className="text-sm font-medium"
          >
            Payment to edit
          </label>
          <Select value={item._id} onValueChange={setChoice}>
            <SelectTrigger id="canvas-payment-occurrence">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {items.map((payment) => (
                <SelectItem key={payment._id} value={payment._id}>
                  {displayDate(payment.dueDate)} ·{" "}
                  {paymentAmount(payment.amountCents)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
      <CanvasPaymentForm
        key={item._id}
        item={item}
        onMore={() => setEditing(item)}
      />
    </div>
  );
  const dialogs = (
    <>
      {editing && (
        <PaymentEditor
          month={month}
          accounts={accounts}
          item={editing}
          onClose={() => setEditing(null)}
        />
      )}
    </>
  );
  return (
    <>
      <CanvasInspector
        title={title}
        description="Edit the selected payment on your canvas."
        onClose={onClose}
      >
        {content}
      </CanvasInspector>
      {dialogs}
    </>
  );
}
