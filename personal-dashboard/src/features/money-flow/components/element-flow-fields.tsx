"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { amountText, parseMoneyCents } from "../amounts";
import { formatYearMonth } from "../months";
import type { MoneyFlowTransfer, YearMonth } from "../types";
import type { ElementTransferValues } from "./element-editor-types";
import { MoneyField as ElementField } from "./money-field";
import {
  ElementScheduleFields,
  useElementSchedule,
} from "./element-schedule-fields";

export function useElementFlow(
  transfer: MoneyFlowTransfer | undefined,
  month: YearMonth
) {
  const schedule = useElementSchedule(transfer, month);
  const [amount, setAmount] = useState(
    amountText(transfer?.baseMonthlyAmountCents ?? null)
  );
  const existingOverride = transfer?.monthOverrides?.[month];
  const [override, setOverride] = useState(
    typeof existingOverride === "number" ? amountText(existingOverride) : ""
  );
  const [label, setLabel] = useState(transfer?.label ?? "");
  const [errors, setErrors] = useState<{ amount?: string; override?: string }>(
    {}
  );
  return {
    amount,
    setAmount,
    override,
    setOverride,
    label,
    setLabel,
    schedule,
    errors,
    validate: (): ElementTransferValues | null => {
      const cents = parseMoneyCents(amount);
      const overrideCents = override.trim() ? parseMoneyCents(override) : null;
      const next: typeof errors = {};
      if (cents === null)
        next.amount =
          "Enter a non-negative amount with no more than two decimal places.";
      if (override.trim() && overrideCents === null)
        next.override =
          "Enter a valid override or leave it empty to use the recurring amount.";
      const dates = schedule.validate();
      setErrors(next);
      return cents === null || Object.keys(next).length || !dates
        ? null
        : {
            ...dates,
            label: label.trim(),
            baseMonthlyAmountCents: cents,
            monthOverrideCents: overrideCents,
          };
    },
  };
}

export function ElementFlowFields({
  flow,
  idPrefix,
  amountLabel,
  month,
  disabled,
  onChange,
}: Readonly<{
  flow: ReturnType<typeof useElementFlow>;
  idPrefix: string;
  amountLabel: string;
  month: YearMonth;
  disabled: boolean;
  onChange: () => void;
}>) {
  return (
    <>
      <ElementField label={amountLabel} htmlFor={`${idPrefix}-amount`}>
        <Input
          id={`${idPrefix}-amount`}
          inputMode="decimal"
          value={flow.amount}
          onChange={(event) => flow.setAmount(event.target.value)}
          placeholder="0.00"
          aria-invalid={flow.errors.amount ? true : undefined}
          aria-describedby={
            flow.errors.amount ? `${idPrefix}-amount-error` : undefined
          }
        />
        {flow.errors.amount && (
          <p
            id={`${idPrefix}-amount-error`}
            role="alert"
            className="text-sm text-destructive"
          >
            {flow.errors.amount}
          </p>
        )}
      </ElementField>
      <ElementField
        label={`${formatYearMonth(month)} override`}
        htmlFor={`${idPrefix}-month-override`}
      >
        <Input
          id={`${idPrefix}-month-override`}
          inputMode="decimal"
          value={flow.override}
          onChange={(event) => flow.setOverride(event.target.value)}
          placeholder="Use recurring amount"
          aria-invalid={flow.errors.override ? true : undefined}
          aria-describedby={
            flow.errors.override ? `${idPrefix}-override-error` : undefined
          }
        />
        {flow.errors.override && (
          <p
            id={`${idPrefix}-override-error`}
            role="alert"
            className="text-sm text-destructive"
          >
            {flow.errors.override}
          </p>
        )}
      </ElementField>
      <ElementScheduleFields
        schedule={flow.schedule}
        idPrefix={idPrefix}
        disabled={disabled}
        onChange={onChange}
      />
      <ElementField
        label="Flow label (optional)"
        htmlFor={`${idPrefix}-flow-label`}
      >
        <Input
          id={`${idPrefix}-flow-label`}
          value={flow.label}
          onChange={(event) => flow.setLabel(event.target.value)}
          placeholder="Optional connection label"
          maxLength={120}
        />
      </ElementField>
    </>
  );
}
