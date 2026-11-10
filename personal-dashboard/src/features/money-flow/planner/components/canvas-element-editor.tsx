"use client";

import { useState } from "react";
import type { Id } from "@convex/_generated/dataModel";
import type { FinancialAccount, PaymentKind } from "../types";
import { AccountEditor } from "./account-editor";
import { PaymentEditor } from "./payment-editor";
import { PlannerSheet } from "./planner-form";

/** Canvas actions carry the selected bank and payment type into the editor. */
export function CanvasElementEditor({
  kind,
  month,
  sourceAccountId,
  accounts,
  onClose,
}: Readonly<{
  kind: PaymentKind;
  month: string;
  sourceAccountId: string;
  accounts: FinancialAccount[];
  onClose: () => void;
}>) {
  const [createdCardId, setCreatedCardId] =
    useState<Id<"moneyPlannerAccounts"> | null>(null);
  const cards = accounts.filter((account) => account.kind === "credit");
  const onlyCard = cards.length === 1 ? cards[0] : undefined;
  const card = createdCardId
    ? cards.find((account) => account._id === createdCardId)
    : onlyCard;

  if (kind === "cardPayment" && cards.length === 0 && !createdCardId) {
    return (
      <AccountEditor
        month={month}
        fixedKind="credit"
        onSaved={setCreatedCardId}
        onClose={onClose}
      />
    );
  }
  // The mutation returns a database ID; wait for the live query to supply the
  // card's domain ID before mounting a form with its initial selection.
  if (createdCardId && !card) {
    return (
      <PlannerSheet
        title="Preparing card payment"
        description="Your credit account was saved. Loading it into the payment editor."
        onClose={onClose}
      >
        <output className="text-sm text-muted-foreground">
          Loading credit account…
        </output>
      </PlannerSheet>
    );
  }
  const cardPayment = kind === "cardPayment";
  return (
    <PaymentEditor
      month={month}
      accounts={accounts}
      lockedKind={kind !== "savings" && kind !== "transfer"}
      initial={{
        kind,
        accountId: sourceAccountId,
        counterpartyId: cardPayment ? (card?.id ?? null) : null,
        statementMonth: cardPayment ? month : null,
        name: cardPayment && card ? `${card.name} payment` : "",
      }}
      onClose={onClose}
    />
  );
}
