"use client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import type { PlannerData } from "../use-planner";
import type { FinancialAccount, Frequency, PaymentValues } from "../types";
import { FREQUENCIES } from "../recurrence";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DatePicker } from "@/components/ui/date-picker";
import { PaymentFields, emptyPayment } from "./payment-fields";
import {
  PlannerSheet,
  Field,
  usePlannerAction,
  amountText,
  amountValue,
  FormError,
} from "./planner-form";

export function ScheduleEditor({
  month,
  accounts,
  item,
  subscription = false,
  expenseOnly = false,
  income = false,
  onClose,
}: {
  month: string;
  accounts: FinancialAccount[];
  item?: PlannerData["schedules"][number];
  subscription?: boolean;
  expenseOnly?: boolean;
  income?: boolean;
  onClose: () => void;
}) {
  const [value, setValue] = useState<PaymentValues>(() => ({
    ...emptyPayment(month),
    kind: income ? "income" : "expense",
    isSubscription: subscription,
    ...item,
    dueDate: item?.startDate ?? `${month}-01`,
  }));
  const [amount, setAmount] = useState(amountText(value.amountCents)),
    [frequency, setFrequency] = useState<Frequency>(
      item?.frequency ?? "monthly"
    );
  const [startDate, setStart] = useState(item?.startDate ?? `${month}-01`),
    [endDate, setEnd] = useState(item?.endDate ?? "");
  const [secondDay, setSecond] = useState(String(item?.secondDay ?? 15)),
    [effective, setEffective] = useState(
      item && item.effectiveFrom > `${month}-01`
        ? item.effectiveFrom
        : `${month}-01`
    );
  const [status, setStatus] = useState<"active" | "paused" | "cancelled">(
    item?.status ?? "active"
  );
  const save = useMutation(api.plannerSchedules.save),
    action = usePlannerAction();
  return (
    <PlannerSheet
      title={`${item ? "Edit" : "Add"} ${value.isSubscription ? "subscription" : value.kind === "income" ? "salary schedule" : value.kind === "expense" ? "recurring payment" : "schedule"}`}
      description="Choose an amount per payment and its scheduled dates. Reviewed history is preserved."
      onClose={onClose}
      pending={action.busy}
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void action.run(
            () =>
              save({
                id: item ? (item._id as Id<"moneyPlannerSeries">) : null,
                expectedRevision: item?.revision ?? 0,
                month,
                effectiveFrom: item ? effective : startDate,
                values: {
                  name: value.name.trim(),
                  kind: value.kind,
                  isSubscription: value.isSubscription,
                  amountCents: amountValue(amount),
                  estimated: value.estimated,
                  accountId: value.accountId,
                  counterpartyId: value.counterpartyId,
                  notes: value.notes,
                  frequency,
                  startDate,
                  endDate: endDate || null,
                  secondDay:
                    frequency === "twiceMonthly" ? Number(secondDay) : null,
                  status,
                },
              }),
            onClose
          );
        }}
      >
        <fieldset disabled={action.busy} className="space-y-5">
          <legend className="sr-only">Recurring payment details</legend>
          <PaymentFields
            value={value}
            onChange={(patch) => setValue((v) => ({ ...v, ...patch }))}
            amount={amount}
            onAmountChange={setAmount}
            accounts={accounts}
            schedule
            lockedKind={subscription || expenseOnly}
          />
          <Field label="Repeats">
            <Select
              value={frequency}
              onValueChange={(selected) => setFrequency(selected as Frequency)}
            >
              <SelectTrigger aria-label="Repeats">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(FREQUENCIES).map(([key, label]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="First payment / anchor date">
            <DatePicker
              aria-label="First payment date"
              className="w-full"
              value={startDate}
              onValueChange={setStart}
            />
          </Field>
          {frequency === "twiceMonthly" && (
            <Field label="Second day of each month">
              <Input
                aria-label="Second day of each month"
                type="number"
                min={1}
                max={31}
                value={secondDay}
                onChange={(e) => setSecond(e.target.value)}
              />
            </Field>
          )}
          <Field label="Ends (optional)">
            <DatePicker
              aria-label="End date"
              className="w-full"
              value={endDate}
              min={startDate}
              clearable
              placeholder="No end date"
              onValueChange={setEnd}
            />
          </Field>
          {item && (
            <>
              <Field label="Apply changes from">
                <DatePicker
                  aria-label="Apply changes from"
                  className="w-full"
                  value={effective}
                  min={item.effectiveFrom}
                  onValueChange={setEffective}
                />
              </Field>
              <Field label="Status">
                <Select
                  value={status}
                  onValueChange={(selected) =>
                    setStatus(selected as typeof status)
                  }
                >
                  <SelectTrigger aria-label="Recurring status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="paused">Paused</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
            </>
          )}
          <FormError message={action.error} />
          <Button type="submit" className="w-full">
            {action.busy
              ? "Saving…"
              : value.isSubscription
                ? "Save subscription"
                : "Save schedule"}
          </Button>
        </fieldset>
      </form>
    </PlannerSheet>
  );
}
