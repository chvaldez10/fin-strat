"use client";

import { useId, useState, type ReactNode } from "react";
import { useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { DatePicker } from "@/components/ui/date-picker";
import { Input } from "@/components/ui/input";
import { daysInCalendarMonth } from "@/lib/date-only";
import { formatMoney } from "../../calculations";
import {
  ACTIVITY_LABELS,
  categoryKind,
  matchesScheduledActivity,
  type ActivityCategory,
  type ActivityKind,
} from "../activity";
import type { ActivityEntry, ImportedActivity } from "../activity-data";
import type { FinancialAccount, Payment } from "../types";
import { ActivityDeleteButton } from "./activity-delete-confirmation";
import { ActivityEntryRemoval } from "./activity-entry-removal";
import { ActivitySelect } from "./activity-select";
import { CanvasInspector } from "./canvas-inspector";
import {
  Field,
  FormError,
  PlannerSheet,
  amountText,
  amountValue,
  localToday,
  usePlannerAction,
} from "./planner-form";
import { useCanvasWriteContext } from "./planner-write-context";

export type ActivityDraft = {
  kind?: ActivityKind;
  accountId?: string;
  category?: ActivityCategory;
  entry?: ActivityEntry;
  planned?: Payment;
  imported?: ImportedActivity;
};

const kindOptions = Object.entries(ACTIVITY_LABELS).map(([id, name]) => ({
  id,
  name,
}));
function destinations(kind: ActivityKind | "") {
  return kind === "transfer" || kind === "cardPayment" || kind === "savings";
}
function sourceAccounts(accounts: FinancialAccount[], kind: ActivityKind | "") {
  return accounts.filter(
    (account) =>
      account.kind !== "credit" || kind === "expense" || kind === "refund"
  );
}
function importKinds(
  imported: ImportedActivity,
  account: FinancialAccount | undefined
): ActivityKind[] {
  if (imported.direction === "out")
    return account?.kind === "credit"
      ? ["expense"]
      : ["expense", "savings", "transfer", "cardPayment"];
  if (account?.kind === "credit") return ["refund", "cardPayment"];
  return account?.kind === "savings"
    ? ["income", "refund", "transfer", "savings"]
    : ["income", "refund", "transfer"];
}

export function ActivityEntryEditor({
  month,
  draft,
  accounts,
  categories,
  scheduled,
  presentation = "sheet",
  controls,
  onClose,
  onSaved,
}: Readonly<{
  month: string;
  draft: ActivityDraft;
  accounts: FinancialAccount[];
  categories: ActivityCategory[];
  scheduled: Payment[];
  presentation?: "sheet" | "canvas";
  controls?: ReactNode;
  onClose: () => void;
  onSaved: () => void;
}>) {
  const { entry, imported, planned } = draft;
  const today = localToday();
  const [year, monthNumber] = month.split("-").map(Number);
  const monthEnd = `${month}-${daysInCalendarMonth(year, monthNumber - 1)}`;
  const maxDate = today < monthEnd ? today : monthEnd;
  const importAccount = accounts.find(
    (account) => account.id === imported?.accountId
  );
  const [kind, setKind] = useState<ActivityKind | "">(
    entry?.kind ??
      planned?.kind ??
      draft.category?.kind ??
      draft.kind ??
      (imported ? "" : "expense")
  );
  const [date, setDate] = useState(
    entry?.date ?? imported?.date ?? (today.startsWith(month) ? today : "")
  );
  const [description, setDescription] = useState(
    entry?.description ?? imported?.description ?? planned?.name ?? ""
  );
  const [amount, setAmount] = useState(
    amountText(
      entry?.amountCents ??
        imported?.amountCents ??
        planned?.amountCents ??
        null
    )
  );
  const [accountId, setAccount] = useState(
    entry?.accountId ??
      planned?.accountId ??
      imported?.accountId ??
      draft.accountId ??
      sourceAccounts(accounts, kind)[0]?.id ??
      ""
  );
  const [destinationId, setDestination] = useState(
    entry?.destinationId ?? planned?.counterpartyId ?? ""
  );
  const [categoryId, setCategory] = useState(
    entry?.categoryId ??
      draft.category?.id ??
      (planned?.isSubscription ? "subscriptions" : "")
  );
  const [eTransfer, setETransfer] = useState(
    entry?.eTransfer ??
      /e[- ]?transfer|interac/i.test(imported?.description ?? "")
  );
  const [requestId] = useState(() => crypto.randomUUID());
  const [revision] = useState(entry?.revision ?? 0);
  const [confirmRemove, setConfirmRemove] = useState(false);
  const [planId, setPlanId] = useState<string>(
    entry?.planId ?? planned?._id ?? ""
  );
  const transferId = useId();
  const save = useMutation(api.plannerActivity.saveEntry);
  const action = usePlannerAction();
  const canvas = useCanvasWriteContext();
  const incomingMove = imported?.direction === "in" && destinations(kind);
  const linkedPlan = scheduled.find((payment) => payment._id === planId);
  const originalLink = !!entry?.planId && entry.planId === planId;
  const sourceLocked = Boolean(
    originalLink || linkedPlan?.accountId || (imported && !incomingMove)
  );
  const destinationLocked = Boolean(
    originalLink || linkedPlan?.counterpartyId || incomingMove
  );
  const availableSources = sourceAccounts(accounts, kind).filter(
    (account) => !incomingMove || account.id !== imported.accountId
  );
  const availableDestinations = accounts.filter((account) => {
    if (account.id === accountId) return false;
    if (kind === "cardPayment") return account.kind === "credit";
    if (kind === "savings") return account.kind === "savings";
    return account.kind !== "credit";
  });
  const categoriesForKind = kind
    ? categories.filter((item) => item.kind === categoryKind(kind))
    : [];
  const choices = imported
    ? kindOptions.filter((option) =>
        importKinds(imported, importAccount).includes(option.id as ActivityKind)
      )
    : kindOptions;
  const matchingPlans = kind
    ? scheduled.filter((payment) =>
        matchesScheduledActivity(payment, {
          kind,
          accountId,
          destinationId: destinationId || null,
        })
      )
    : [];
  const planOptions = [
    { id: "none", name: "No scheduled payment" },
    ...matchingPlans.map((payment) => ({
      id: payment._id,
      name: `${payment.name} · ${payment.dueDate}`,
    })),
  ];
  if (planId && !planOptions.some((option) => option.id === planId))
    planOptions.push({
      id: planId,
      name: linkedPlan?.name ?? "Linked scheduled payment",
    });

  function changeKind(next: ActivityKind) {
    setKind(next);
    const incoming = imported?.direction === "in" && destinations(next);
    const possible = sourceAccounts(accounts, next).filter(
      (account) => !incoming || account.id !== imported.accountId
    );
    setAccount(
      incoming
        ? (possible[0]?.id ?? "")
        : (imported?.accountId ??
            (possible.some((item) => item.id === accountId)
              ? accountId
              : (possible[0]?.id ?? "")))
    );
    setDestination(incoming ? imported.accountId : "");
    const nextCategoryKind = categoryKind(next);
    setCategory(
      categories.some(
        (item) => item.id === categoryId && item.kind === nextCategoryKind
      )
        ? categoryId
        : ""
    );
  }

  if (entry && confirmRemove) {
    return (
      <ActivityEntryRemoval
        entry={entry}
        revision={revision}
        presentation={presentation}
        onClose={() => setConfirmRemove(false)}
        onRemoved={onSaved}
      />
    );
  }

  const Container = presentation === "canvas" ? CanvasInspector : PlannerSheet;
  let title = entry ? "Edit transaction" : "Log activity";
  if (kind === "income") title = entry ? "Edit income" : "Log income";
  return (
    <Container
      title={title}
      description={
        imported
          ? "Choose what this posted transaction was for."
          : `Recorded activity · ${month}`
      }
      onClose={onClose}
      pending={action.busy}
    >
      <form
        onSubmit={(event) => {
          event.preventDefault();
          void action.run(async () => {
            const cents = amountValue(amount);
            if (!kind || !date || date > today || !cents || !accountId)
              throw new Error(
                "Choose a type, account, posted date and positive amount."
              );
            await save({
              canvas: canvas?.identity,
              month,
              requestId,
              id: entry?._id ?? null,
              expectedRevision: revision,
              planId: planId ? (planId as Id<"moneyPlannerPayments">) : null,
              importId: imported?._id ?? null,
              values: {
                kind,
                date,
                description,
                accountId,
                amountCents: cents,
                eTransfer,
                destinationId: destinations(kind)
                  ? destinationId || null
                  : null,
                categoryId: categoryKind(kind) ? categoryId || null : null,
              },
            });
          }, onSaved);
        }}
      >
        <fieldset className="space-y-4" disabled={action.busy}>
          <legend className="sr-only">Transaction details</legend>
          {controls}
          {entry && (
            <ActivityDeleteButton onClick={() => setConfirmRemove(true)}>
              Delete transaction…
            </ActivityDeleteButton>
          )}
          {imported && (
            <p className="rounded-lg bg-muted p-3 text-sm">
              {formatMoney(imported.amountCents)}{" "}
              {imported.direction === "out" ? "out of" : "into"}{" "}
              {importAccount?.name} on {imported.date}
            </p>
          )}
          {(presentation !== "canvas" || kind !== "income") && (
            <ActivitySelect
              label="Type"
              value={kind}
              options={choices}
              disabled={!!planId}
              onChange={(value) => changeKind(value as ActivityKind)}
            />
          )}
          <Field label="Description">
            <Input
              aria-label="Description"
              placeholder={
                kind === "income" ? "e.g. November pay" : "e.g. Church tithe"
              }
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              maxLength={160}
              required
            />
          </Field>
          <div
            className={
              presentation === "canvas"
                ? "grid gap-3"
                : "grid gap-3 sm:grid-cols-2"
            }
          >
            <Field label="Amount (CAD)">
              <Input
                aria-label="Amount (CAD)"
                className="h-11"
                inputMode="decimal"
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
                readOnly={!!imported}
                required
              />
            </Field>
            <Field label="Posted date">
              <DatePicker
                aria-label="Posted date"
                className="w-full"
                value={date}
                onValueChange={setDate}
                min={`${month}-01`}
                max={maxDate}
                disabled={!!imported || action.busy}
              />
            </Field>
          </div>
          {kind && (
            <ActivitySelect
              label={destinations(kind) ? "From account" : "Account"}
              value={accountId}
              onChange={(value) => {
                setAccount(value);
                if (value === destinationId) setDestination("");
              }}
              options={availableSources}
              disabled={sourceLocked || action.busy}
            />
          )}
          {destinations(kind) && (
            <ActivitySelect
              label="To account"
              value={destinationId}
              onChange={(value) =>
                setDestination(value === "external" ? "" : value)
              }
              options={
                kind === "savings" && !incomingMove
                  ? [
                      ...availableDestinations,
                      { id: "external", name: "Outside tracked accounts" },
                    ]
                  : availableDestinations
              }
              placeholder={
                kind === "savings"
                  ? "Outside tracked accounts"
                  : "Choose the receiving account"
              }
              disabled={destinationLocked || action.busy}
            />
          )}
          {categoriesForKind.length > 0 && (
            <ActivitySelect
              label="Category"
              value={categoryId}
              onChange={setCategory}
              options={categoriesForKind}
            />
          )}
          {planOptions.length > 1 && (
            <ActivitySelect
              label="Scheduled payment"
              value={planId || "none"}
              onChange={(value) => setPlanId(value === "none" ? "" : value)}
              options={planOptions}
            />
          )}
          <label
            htmlFor={transferId}
            className="flex min-h-11 items-center gap-2 text-sm"
          >
            <Checkbox
              id={transferId}
              checked={eTransfer}
              onCheckedChange={(checked) => setETransfer(checked === true)}
            />
            Interac e-transfer
          </label>
          <FormError message={action.error} />
          <Button
            type="submit"
            className="w-full"
            disabled={!kind || !accounts.length}
          >
            {action.busy ? "Saving…" : "Save transaction"}
          </Button>
        </fieldset>
      </form>
    </Container>
  );
}
