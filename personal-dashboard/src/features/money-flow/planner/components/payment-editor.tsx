"use client";
import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import { MonthPicker } from "@/components/ui/month-picker";
import { Input } from "@/components/ui/input";
import type { FinancialAccount, Payment, PaymentValues } from "../types";
import { editablePaymentValues } from "../payment-values";
import { PaymentFields, emptyPayment } from "./payment-fields";
import { useCanvasWriteContext } from "./planner-write-context";
import { PlannerSheet, usePlannerAction, FormError } from "./planner-form";
import { MoneyField as Field } from "../../components/money-field";
import { amountText, amountValue } from "../../amounts";

const paymentTitles = {
  income: "Add income",
  expense: "Add expense",
  savings: "Add savings",
  transfer: "Add transfer",
  cardPayment: "Add credit card payment",
} as const;

export function PaymentEditor({
  month,
  accounts,
  item,
  initial,
  onClose,
  lockedKind = false,
}: Readonly<{
  month: string;
  accounts: FinancialAccount[];
  item?: Payment;
  initial?: Partial<PaymentValues>;
  onClose: () => void;
  lockedKind?: boolean;
}>) {
  const [value, setValue] = useState<PaymentValues>(() => ({
    ...emptyPayment(month),
    ...(item ? editablePaymentValues(item) : undefined),
    ...initial,
  }));
  const [amount, setAmount] = useState(amountText(value.amountCents));
  const [statement, setStatement] = useState(
    amountText(value.statementAmountCents)
  );
  const save = useMutation(api.plannerPayments.save),
    action = usePlannerAction();
  const canvas = useCanvasWriteContext();
  const change = (patch: Partial<PaymentValues>) =>
    setValue((v) => ({ ...v, ...patch }));
  const saveLabel =
    value.kind === "cardPayment" ? "Save card payment" : "Save payment";
  return (
    <PlannerSheet
      title={item ? "Edit this payment" : paymentTitles[value.kind]}
      description="Changes apply to this payment. Use recurring payments to change the series."
      onClose={onClose}
      pending={action.busy}
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void action.run(
            () =>
              save({
                canvas: canvas?.identity,
                id: item ? (item._id as Id<"moneyPlannerPayments">) : null,
                expectedRevision: item?.revision ?? 0,
                values: {
                  name: value.name.trim(),
                  kind: value.kind,
                  isSubscription: value.isSubscription,
                  amountCents: amountValue(amount),
                  estimated: value.estimated,
                  accountId: value.accountId,
                  counterpartyId: value.counterpartyId,
                  notes: value.notes,
                  dueDate: value.dueDate,
                  statementMonth:
                    value.kind === "cardPayment"
                      ? (value.statementMonth ?? month)
                      : null,
                  statementAmountCents:
                    value.kind === "cardPayment"
                      ? amountValue(statement)
                      : null,
                },
              }),
            onClose
          );
        }}
      >
        <fieldset disabled={action.busy} className="space-y-5">
          <legend className="sr-only">Payment details</legend>
          <PaymentFields
            value={value}
            onChange={change}
            amount={amount}
            onAmountChange={setAmount}
            accounts={accounts}
            lockedKind={lockedKind}
          />
          <Field label="Due date">
            <DatePicker
              aria-label="Due date"
              className="w-full"
              value={value.dueDate}
              onValueChange={(dueDate) => change({ dueDate })}
            />
          </Field>
          {value.kind === "cardPayment" && (
            <>
              <Field label="Statement month">
                <MonthPicker
                  aria-label="Statement month"
                  value={value.statementMonth ?? month}
                  onValueChange={(statementMonth) => change({ statementMonth })}
                />
              </Field>
              <Field label="Statement balance (CAD)">
                <Input
                  aria-label="Statement balance (CAD)"
                  inputMode="decimal"
                  value={statement}
                  onChange={(e) => setStatement(e.target.value)}
                />
              </Field>
            </>
          )}
          <FormError message={action.error} />
          <Button type="submit" className="w-full">
            {action.busy ? "Saving…" : saveLabel}
          </Button>
        </fieldset>
      </form>
    </PlannerSheet>
  );
}
