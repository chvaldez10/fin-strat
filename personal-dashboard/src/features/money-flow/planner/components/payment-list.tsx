"use client";
import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Check, Repeat2 } from "lucide-react";
import { formatMoney } from "../../calculations";
import type { FinancialAccount, Payment } from "../types";
import { PAYMENT_KINDS } from "../recurrence";
import {
  amountText,
  amountValue,
  usePlannerAction,
  FormError,
} from "./planner-form";

export function PaymentList({
  items,
  accounts,
  month,
  onEdit,
  onStatus,
}: {
  items: Payment[];
  accounts: FinancialAccount[];
  month: string;
  onEdit: (item: Payment) => void;
  onStatus: (item: Payment) => void;
}) {
  if (!items.length)
    return (
      <p className="p-6 text-sm text-muted-foreground">
        No payments in this group yet.
      </p>
    );
  return (
    <>
      <div className="divide-y divide-border md:hidden">
        {items.map((item) => (
          <article key={item._id} className="space-y-3 p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h3 className="font-medium">{item.name}</h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  {item.month < month
                    ? `Carried from ${item.month}`
                    : PAYMENT_KINDS[item.kind]}
                </p>
              </div>
              <span className="shrink-0 text-sm font-semibold tabular-nums">
                {paymentAmount(item.amountCents)}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Due {displayDate(item.dueDate)} ·{" "}
              {accounts.find((a) => a.id === item.accountId)?.name ??
                "Unassigned"}
              {item.estimated ? " · estimate" : ""}
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onStatus(item)}
              >
                {item.paidOn
                  ? `Paid ${displayDate(item.paidOn)}`
                  : item.status === "skipped"
                    ? "Skipped"
                    : "Mark paid"}
              </Button>
              <Button variant="ghost" size="sm" onClick={() => onEdit(item)}>
                Edit payment
              </Button>
            </div>
          </article>
        ))}
      </div>
      <div className="hidden max-w-full overflow-x-auto md:block">
        <table className="w-full min-w-[760px] text-sm">
          <caption className="sr-only">
            Monthly payments with editable amounts and payment dates
          </caption>
          <thead className="border-y border-border bg-muted/30 text-xs text-muted-foreground">
            <tr>
              {[
                "Payment",
                "Amount (CAD)",
                "Due",
                "Account",
                "Status",
                "Actions",
              ].map((label) => (
                <th
                  key={label}
                  scope="col"
                  className="px-4 py-3 text-left font-medium"
                >
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {items.map((item) => (
              <PaymentRow
                key={item._id}
                item={item}
                accounts={accounts}
                month={month}
                onEdit={onEdit}
                onStatus={onStatus}
              />
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
function PaymentRow({
  item,
  accounts,
  month,
  onEdit,
  onStatus,
}: {
  item: Payment;
  accounts: FinancialAccount[];
  month: string;
  onEdit: (item: Payment) => void;
  onStatus: (item: Payment) => void;
}) {
  const [draft, setDraft] = useState<{ text: string; revision: number } | null>(
      null
    ),
    action = usePlannerAction(),
    save = useMutation(api.plannerPayments.save);
  const account = accounts.find((a) => a.id === item.accountId),
    cardCharge = account?.kind === "credit";
  const amount = draft?.text ?? amountText(item.amountCents);
  return (
    <tr
      className={
        item.status === "skipped" ? "text-muted-foreground opacity-70" : ""
      }
    >
      <th scope="row" className="max-w-64 px-4 py-4 text-left font-medium">
        <button
          className="block max-w-64 truncate text-left underline-offset-4 hover:underline focus-visible:outline-ring"
          onClick={() => onEdit(item)}
        >
          {item.name}
        </button>
        <span className="mt-1 flex items-center gap-1.5 text-xs font-normal text-muted-foreground">
          {item.seriesId && <Repeat2 className="size-3" aria-hidden="true" />}
          {item.month < month
            ? `Carried from ${item.month}`
            : PAYMENT_KINDS[item.kind]}
          {item.estimated ? " · estimate" : ""}
          {cardCharge ? " · paid via card" : ""}
        </span>
      </th>
      <td className="px-4 py-3">
        <form
          className="flex items-center gap-1"
          onSubmit={(e) => {
            e.preventDefault();
            if (!draft) return;
            void action.run(
              () =>
                save({
                  id: item._id as Id<"moneyPlannerPayments">,
                  expectedRevision: draft.revision,
                  values: {
                    name: item.name,
                    kind: item.kind,
                    isSubscription: item.isSubscription,
                    amountCents: amountValue(draft.text),
                    estimated: item.estimated,
                    accountId: item.accountId,
                    counterpartyId: item.counterpartyId,
                    notes: item.notes,
                    dueDate: item.dueDate,
                    statementMonth: item.statementMonth,
                    statementAmountCents: item.statementAmountCents,
                  },
                }),
              () => setDraft(null)
            );
          }}
        >
          <Input
            aria-label={`Amount for ${item.name}`}
            className="h-9 w-28 tabular-nums"
            inputMode="decimal"
            placeholder="Unknown"
            value={amount}
            disabled={action.busy}
            onChange={(e) =>
              setDraft({
                text: e.target.value,
                revision: draft?.revision ?? item.revision,
              })
            }
          />
          {draft && (
            <Button
              type="submit"
              size="icon-sm"
              variant="ghost"
              disabled={action.busy}
              aria-label={`Save amount for ${item.name}`}
            >
              <Check aria-hidden="true" />
            </Button>
          )}
        </form>
        <FormError message={action.error} />
      </td>
      <td className="whitespace-nowrap px-4 py-3 text-xs">
        {displayDate(item.dueDate)}
      </td>
      <td className="max-w-40 px-4 py-3 text-xs text-muted-foreground">
        {account?.name ?? "Unassigned"}
      </td>
      <td className="px-4 py-3">
        <button
          onClick={() => onStatus(item)}
          className={`whitespace-nowrap rounded-full border px-2.5 py-1 text-xs outline-none focus-visible:ring-2 focus-visible:ring-ring ${item.status === "paid" ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400" : "border-border"}`}
        >
          {item.status === "paid"
            ? `Paid ${displayDate(item.paidOn!)}`
            : item.status === "skipped"
              ? "Skipped"
              : "Not paid"}
        </button>
      </td>
      <td className="px-4 py-3">
        <Button variant="ghost" size="sm" onClick={() => onEdit(item)}>
          Edit
        </Button>
        {item.status === "pending" && (
          <Button variant="outline" size="sm" onClick={() => onStatus(item)}>
            Mark paid
          </Button>
        )}
      </td>
    </tr>
  );
}
export function displayDate(value: string) {
  return new Intl.DateTimeFormat("en-CA", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${value}T00:00:00Z`));
}
export function paymentAmount(value: number | null) {
  return value === null ? "Not confirmed" : formatMoney(value);
}
