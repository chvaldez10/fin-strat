"use client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { PAYMENT_KINDS } from "../recurrence";
import type { FinancialAccount, PaymentValues } from "../types";
import { Field, selectClass } from "./planner-form";

export function PaymentFields({
  value,
  onChange,
  amount,
  onAmountChange,
  accounts,
  schedule = false,
  lockedKind = false,
}: Readonly<{
  value: PaymentValues;
  onChange: (patch: Partial<PaymentValues>) => void;
  amount: string;
  onAmountChange: (value: string) => void;
  accounts: FinancialAccount[];
  schedule?: boolean;
  lockedKind?: boolean;
}>) {
  return (
    <>
      <Field label="Name">
        <Input
          aria-label="Name"
          value={value.name}
          onChange={(e) => onChange({ name: e.target.value })}
          required
          maxLength={120}
          placeholder="e.g. Mortgage, salary or YouTube"
        />
      </Field>
      <Field label="Type">
        <Select
          value={value.kind}
          disabled={lockedKind}
          onValueChange={(selected) =>
            onChange({
              kind: selected as PaymentValues["kind"],
              isSubscription: false,
              accountId: null,
              counterpartyId: null,
              statementMonth: null,
              statementAmountCents: null,
            })
          }
        >
          <SelectTrigger aria-label="Payment type">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(PAYMENT_KINDS)
              .filter(([kind]) => !schedule || kind !== "cardPayment")
              .map(([kind, label]) => (
                <SelectItem key={kind} value={kind}>
                  {label}
                </SelectItem>
              ))}
          </SelectContent>
        </Select>
      </Field>
      <Field label={schedule ? "Amount per payment (CAD)" : "Amount (CAD)"}>
        <Input
          aria-label={schedule ? "Amount per payment (CAD)" : "Amount (CAD)"}
          inputMode="decimal"
          placeholder="Not confirmed"
          value={amount}
          onChange={(e) => onAmountChange(e.target.value)}
        />
        <p className="text-xs text-muted-foreground">
          Leave blank if unknown. Zero means an intentional $0 amount.
        </p>
      </Field>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={value.estimated}
          onChange={(e) => onChange({ estimated: e.target.checked })}
        />
        This amount is an estimate
      </label>
      <Field
        label={
          value.kind === "income" ? "Received into" : "Paid from / charged to"
        }
      >
        <Select
          value={value.accountId ?? "none"}
          onValueChange={(selected) =>
            onChange({ accountId: selected === "none" ? null : selected })
          }
        >
          <SelectTrigger aria-label="Payment account">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Choose an account</SelectItem>
            {accounts
              .filter((a) => value.kind === "expense" || a.kind !== "credit")
              .map((a) => (
                <SelectItem key={a.id} value={a.id}>
                  {a.name}
                  {a.kind === "credit" ? " · credit card" : ""}
                </SelectItem>
              ))}
          </SelectContent>
        </Select>
      </Field>
      {(value.kind === "cardPayment" ||
        value.kind === "savings" ||
        value.kind === "transfer") && (
        <Field
          label={
            value.kind === "cardPayment"
              ? "Credit card being paid"
              : "Destination account"
          }
        >
          <Select
            value={value.counterpartyId ?? "none"}
            onValueChange={(selected) =>
              onChange({
                counterpartyId: selected === "none" ? null : selected,
              })
            }
          >
            <SelectTrigger aria-label="Destination account">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Choose an account</SelectItem>
              {accounts
                .filter((a) =>
                  value.kind === "cardPayment"
                    ? a.kind === "credit"
                    : a.kind !== "credit" && a.id !== value.accountId
                )
                .map((a) => (
                  <SelectItem key={a.id} value={a.id}>
                    {a.name}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </Field>
      )}
      {accounts.find((a) => a.id === value.accountId)?.kind === "credit" && (
        <p className="rounded-lg bg-muted p-3 text-xs text-muted-foreground">
          This charge is tracked here. Cash is allocated through the card's
          payment, so it is not counted twice.
        </p>
      )}
      {value.kind === "expense" && (
        <Field label="Category">
          <Select
            value={value.isSubscription ? "subscription" : "payment"}
            onValueChange={(selected) =>
              onChange({ isSubscription: selected === "subscription" })
            }
          >
            <SelectTrigger aria-label="Expense category">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="payment">
                {schedule ? "Recurring payment" : "Expense"}
              </SelectItem>
              <SelectItem value="subscription">
                Subscription or membership
              </SelectItem>
            </SelectContent>
          </Select>
        </Field>
      )}
      <Field label="Notes">
        <textarea
          aria-label="Notes"
          className={`${selectClass} min-h-20`}
          maxLength={2000}
          value={value.notes}
          onChange={(e) => onChange({ notes: e.target.value })}
        />
      </Field>
    </>
  );
}
export function emptyPayment(month: string): PaymentValues {
  return {
    name: "",
    kind: "expense",
    isSubscription: false,
    amountCents: null,
    estimated: false,
    accountId: null,
    counterpartyId: null,
    notes: "",
    dueDate: `${month}-01`,
    statementMonth: null,
    statementAmountCents: null,
  };
}
