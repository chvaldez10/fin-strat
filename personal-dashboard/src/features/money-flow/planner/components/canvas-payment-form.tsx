"use client";
import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import type { Payment, PaymentValues } from "../types";
import { useCanvasWriteContext } from "./planner-write-context";
import {
  Field,
  amountText,
  amountValue,
  FormError,
  usePlannerAction,
} from "./planner-form";

/** The focused canvas editor keeps secondary payment fields out of the way. */
function financialSnapshot(item: PaymentValues) {
  return JSON.stringify([
    item.name,
    item.amountCents,
    item.dueDate,
    item.kind,
    item.isSubscription,
    item.estimated,
    item.accountId,
    item.counterpartyId,
    item.notes,
    item.statementMonth,
    item.statementAmountCents,
  ]);
}
export function CanvasPaymentForm({
  item,
  onMore,
}: Readonly<{
  item: Payment;
  onMore: () => void;
}>) {
  const [name, setName] = useState(item.name),
    [amount, setAmount] = useState(amountText(item.amountCents)),
    [date, setDate] = useState(item.dueDate);
  const [baseline, setBaseline] = useState({
      revision: item.revision,
      financial: financialSnapshot(item),
    }),
    [saved, setSaved] = useState(false);
  const save = useMutation(api.plannerPayments.save),
    action = usePlannerAction(),
    canvas = useCanvasWriteContext();
  // Accept metadata-only revisions without overwriting a local financial draft.
  const revision =
    item.revision > baseline.revision &&
    financialSnapshot(item) === baseline.financial
      ? item.revision
      : baseline.revision;
  return (
    <form
      onChange={() => setSaved(false)}
      onSubmit={(event) => {
        event.preventDefault();
        void action.run(async () => {
          const values: PaymentValues = {
            name: name.trim(),
            amountCents: amountValue(amount),
            dueDate: date,
            kind: item.kind,
            isSubscription: item.isSubscription,
            estimated: item.estimated,
            accountId: item.accountId,
            counterpartyId: item.counterpartyId,
            notes: item.notes,
            statementMonth: item.statementMonth,
            statementAmountCents: item.statementAmountCents,
          };
          await save({
            id: item._id as Id<"moneyPlannerPayments">,
            expectedRevision: revision,
            canvas: canvas?.identity,
            values,
          });
          setBaseline({
            revision: revision + 1,
            financial: financialSnapshot(values),
          });
          setSaved(true);
        });
      }}
    >
      <fieldset disabled={action.busy} className="space-y-4">
        <legend className="sr-only">Selected element payment</legend>
        <Field label="Name">
          <Input
            aria-label="Element name"
            value={name}
            required
            maxLength={120}
            onChange={(e) => setName(e.target.value)}
          />
        </Field>
        <Field label="Amount (CAD)">
          <Input
            aria-label="Element amount (CAD)"
            inputMode="decimal"
            value={amount}
            placeholder="Not confirmed"
            onChange={(e) => setAmount(e.target.value)}
          />
        </Field>
        <Field label="Payment date">
          <DatePicker
            aria-label="Element payment date"
            className="w-full"
            value={date}
            onValueChange={(value) => {
              setDate(value);
              setSaved(false);
            }}
          />
        </Field>
        <FormError message={action.error} />
        <Button type="submit" className="w-full">
          {action.busy ? "Saving…" : "Save element"}
        </Button>
        {saved && (
          <output
            className="block text-sm text-muted-foreground"
            aria-live="polite"
          >
            Element saved.
          </output>
        )}
        <Button variant="ghost" className="w-full" onClick={onMore}>
          More details
        </Button>
      </fieldset>
    </form>
  );
}
