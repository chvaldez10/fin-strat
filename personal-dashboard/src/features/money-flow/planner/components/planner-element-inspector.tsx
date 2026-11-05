"use client";
import { useState } from "react";
import { X } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import type { FinancialAccount, Payment } from "../types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { PaymentEditor } from "./payment-editor";
import { displayDate, paymentAmount } from "./payment-list";
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
  const mobile = useIsMobile();
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
      {mobile ? (
        <Sheet
          open
          onOpenChange={(open) => {
            if (!open) onClose();
          }}
        >
          <SheetContent
            side="bottom"
            data-testid="money-flow-inspector"
            className="max-h-[85dvh] overflow-y-auto pb-[env(safe-area-inset-bottom)]"
          >
            <SheetHeader>
              <SheetTitle>{title}</SheetTitle>
              <SheetDescription>
                Edit the selected payment on your canvas.
              </SheetDescription>
            </SheetHeader>
            <div className="px-4 pb-5">{content}</div>
          </SheetContent>
        </Sheet>
      ) : (
        <aside
          aria-label="Money flow inspector"
          data-testid="money-flow-inspector"
          className="absolute inset-y-4 right-4 z-20 w-80 overflow-y-auto overscroll-contain rounded-2xl border border-border/70 bg-card text-card-foreground shadow-xl shadow-black/5"
        >
          <header className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-card/95 px-5 py-4 backdrop-blur">
            <h2 className="font-semibold">{title}</h2>
            <Button
              size="icon"
              variant="ghost"
              aria-label="Close element editor"
              onClick={onClose}
            >
              <X aria-hidden="true" />
            </Button>
          </header>
          <div className="p-5">{content}</div>
        </aside>
      )}
      {dialogs}
    </>
  );
}
