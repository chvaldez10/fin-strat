"use client";
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
}: {
  value: PaymentValues;
  onChange: (patch: Partial<PaymentValues>) => void;
  amount: string;
  onAmountChange: (value: string) => void;
  accounts: FinancialAccount[];
  schedule?: boolean;
  lockedKind?: boolean;
}) {
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
        <select
          aria-label="Payment type"
          className={selectClass}
          value={value.kind}
          disabled={lockedKind}
          onChange={(e) =>
            onChange({
              kind: e.target.value as PaymentValues["kind"],
              isSubscription: false,
              accountId: null,
              counterpartyId: null,
              statementMonth: null,
              statementAmountCents: null,
            })
          }
        >
          {Object.entries(PAYMENT_KINDS)
            .filter(([kind]) => !schedule || kind !== "cardPayment")
            .map(([kind, label]) => (
              <option key={kind} value={kind}>
                {label}
              </option>
            ))}
        </select>
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
        <select
          aria-label="Payment account"
          value={value.accountId ?? ""}
          className={selectClass}
          onChange={(e) => onChange({ accountId: e.target.value || null })}
        >
          <option value="">Choose an account</option>
          {accounts
            .filter((a) => value.kind === "expense" || a.kind !== "credit")
            .map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
                {a.kind === "credit" ? " · credit card" : ""}
              </option>
            ))}
        </select>
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
          <select
            aria-label="Destination account"
            className={selectClass}
            value={value.counterpartyId ?? ""}
            onChange={(e) =>
              onChange({ counterpartyId: e.target.value || null })
            }
          >
            <option value="">Choose an account</option>
            {accounts
              .filter((a) =>
                value.kind === "cardPayment"
                  ? a.kind === "credit"
                  : a.kind !== "credit" && a.id !== value.accountId
              )
              .map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
          </select>
        </Field>
      )}
      {accounts.find((a) => a.id === value.accountId)?.kind === "credit" && (
        <p className="rounded-lg bg-muted p-3 text-xs text-muted-foreground">
          This charge is tracked here. Cash is allocated through the card's
          payment, so it is not counted twice.
        </p>
      )}
      {value.kind === "expense" && (
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={value.isSubscription}
            onChange={(e) => onChange({ isSubscription: e.target.checked })}
          />
          Subscription or membership
        </label>
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
