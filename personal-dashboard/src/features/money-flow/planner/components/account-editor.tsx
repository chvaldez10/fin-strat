"use client";
import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { AccountKind, FinancialAccount } from "../types";
import {
  PlannerSheet,
  Field,
  amountText,
  amountValue,
  usePlannerAction,
  FormError,
  selectClass,
} from "./planner-form";

export function AccountEditor({
  item,
  month,
  onClose,
}: {
  item?: FinancialAccount;
  month: string;
  onClose: () => void;
}) {
  const [name, setName] = useState(item?.name ?? ""),
    [institution, setInstitution] = useState(item?.institution ?? ""),
    [kind, setKind] = useState<AccountKind>(item?.kind ?? "chequing"),
    [balance, setBalance] = useState(amountText(item?.balanceCents ?? 0));
  const save = useMutation(api.plannerAccounts.save),
    action = usePlannerAction();
  return (
    <PlannerSheet
      title={item ? "Update account" : "Add account"}
      description="Track bank cash and credit balances separately. Balances are entered manually."
      onClose={onClose}
      pending={action.busy}
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void action.run(
            () =>
              save({
                id: item ? (item._id as Id<"moneyPlannerAccounts">) : null,
                expectedRevision: item?.revision ?? 0,
                name,
                institution,
                kind,
                balanceCents: amountValue(balance, kind !== "credit") ?? 0,
                month,
              }),
            onClose
          );
        }}
      >
        <fieldset disabled={action.busy} className="space-y-5">
          <legend className="sr-only">Account details</legend>
          <Field label="Account name">
            <Input
              aria-label="Account name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Costco card or Scotia Visa"
              maxLength={120}
              required
            />
          </Field>
          <Field label="Institution">
            <Input
              aria-label="Institution"
              value={institution}
              onChange={(e) => setInstitution(e.target.value)}
              maxLength={120}
            />
          </Field>
          <Field label="Account type">
            <select
              aria-label="Account type"
              disabled={!!item}
              className={selectClass}
              value={kind}
              onChange={(e) => setKind(e.target.value as AccountKind)}
            >
              <option value="chequing">Chequing</option>
              <option value="savings">Savings</option>
              <option value="credit">Credit card</option>
            </select>
          </Field>
          <Field
            label={
              kind === "credit"
                ? "Current amount owed (CAD)"
                : "Current balance (CAD)"
            }
          >
            <Input
              aria-label="Account balance (CAD)"
              inputMode="decimal"
              value={balance}
              onChange={(e) => setBalance(e.target.value)}
              required
            />
          </Field>
          <p className="text-xs text-muted-foreground">
            Saving confirms this manual balance as of today. Recording a paid
            date later does not automatically update it.
          </p>
          <FormError message={action.error} />
          <Button type="submit" className="w-full">
            {action.busy ? "Saving…" : "Save account"}
          </Button>
        </fieldset>
      </form>
    </PlannerSheet>
  );
}
