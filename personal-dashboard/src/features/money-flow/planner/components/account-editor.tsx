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
} from "./planner-form";

export function AccountEditor({
  item,
  month,
  onClose,
  fixedKind,
  onSaved,
}: Readonly<{
  item?: FinancialAccount;
  month: string;
  onClose: () => void;
  /** Restrict a focused creation flow to one account type. */
  fixedKind?: AccountKind;
  /** When supplied, the consumer handles the next view after a successful save. */
  onSaved?: (id: Id<"moneyPlannerAccounts">) => void;
}>) {
  const [name, setName] = useState(item?.name ?? ""),
    [institution, setInstitution] = useState(item?.institution ?? ""),
    [kind, setKind] = useState<AccountKind>(
      item?.kind ?? fixedKind ?? "chequing"
    ),
    [balance, setBalance] = useState(amountText(item?.balanceCents ?? 0));
  const save = useMutation(api.plannerAccounts.save),
    action = usePlannerAction();
  const creationTitle =
    fixedKind === "credit" ? "Add credit card" : "Add account";
  return (
    <PlannerSheet
      title={item ? "Update account" : creationTitle}
      description="Track bank cash and credit balances separately. Balances are entered manually."
      onClose={onClose}
      pending={action.busy}
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void action.run(async () => {
            const id = await save({
              id: item ? (item._id as Id<"moneyPlannerAccounts">) : null,
              expectedRevision: item?.revision ?? 0,
              name,
              institution,
              kind,
              balanceCents: amountValue(balance, kind !== "credit") ?? 0,
              month,
            });
            if (onSaved) onSaved(id);
            else onClose();
          });
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
            <Select
              disabled={!!item || !!fixedKind}
              value={kind}
              onValueChange={(selected) => setKind(selected as AccountKind)}
            >
              <SelectTrigger aria-label="Account type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="chequing">Chequing</SelectItem>
                <SelectItem value="savings">Savings</SelectItem>
                <SelectItem value="credit">Credit card</SelectItem>
              </SelectContent>
            </Select>
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
            Saving confirms this manual balance as of today. Scheduled payments
            do not automatically update it.
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
