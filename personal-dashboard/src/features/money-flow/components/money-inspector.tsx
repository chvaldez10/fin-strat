"use client";

import { useState } from "react";
import { CircleDollarSign, Save, X } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import type { MoneyCanvasNode } from "../canvas-types";
import { formatYearMonth } from "../months";
import { parseMoneyCents } from "../amounts";
import type {
  MoneyFlowAccountWorkspace,
  MoneyFlowTransfer,
  YearMonth,
} from "../types";
import {
  TransferScheduleFields,
  useTransferSchedule,
  type TransferScheduleValues,
} from "./transfer-schedule-fields";

export type SelectedMoneyElement = {
  type: "node";
  item: MoneyCanvasNode;
} | null;

export type TransferEditValues = TransferScheduleValues & {
  label: string;
  baseMonthlyAmountCents: number;
  monthOverrideCents: number | null;
};

export type MoneyNodeEditValues = {
  label: string;
  note: string;
  startingBalanceCents?: number;
  flow?: TransferEditValues & { transferId?: string };
};

type MoneyInspectorProps = {
  selected: SelectedMoneyElement;
  account: MoneyFlowAccountWorkspace;
  selectedMonth: YearMonth;
  isFirstMonth: boolean;
  onClose: () => void;
  onSaveNode: (id: string, values: MoneyNodeEditValues) => Promise<boolean>;
  onSaveTransfer: (
    nodeId: string,
    id: string,
    values: TransferEditValues
  ) => Promise<boolean>;
  onRemoveTransfer: (nodeId: string, transferId: string) => Promise<boolean>;
};

export function MoneyInspector({
  selected,
  account,
  selectedMonth,
  isFirstMonth,
  onClose,
  onSaveNode,
  onSaveTransfer,
  onRemoveTransfer,
}: MoneyInspectorProps) {
  const isMobile = useIsMobile();

  if (!selected) {
    return null;
  }

  const node = selected.item;
  const title = {
    income: "Edit income",
    expense: "Edit expense",
    account: "Edit transfer destination",
    note: "Edit note",
    chequing: "Edit bank account",
  }[node.data.kind];
  const connected = account.transfers.filter(
    (transfer) =>
      transfer.sourceNodeId === node.id || transfer.targetNodeId === node.id
  );
  const hasFlow = ["income", "expense", "account"].includes(node.data.kind);
  const primary = hasFlow
    ? (connected.find((transfer) =>
        node.data.kind === "income"
          ? transfer.sourceNodeId === node.id &&
            transfer.targetNodeId === account.centerNodeId
          : transfer.sourceNodeId === account.centerNodeId &&
            transfer.targetNodeId === node.id
      ) ?? connected[0])
    : undefined;
  const additional = connected.filter(
    (transfer) => transfer.id !== primary?.id
  );
  const primaryOtherId = primary
    ? primary.sourceNodeId === node.id
      ? primary.targetNodeId
      : primary.sourceNodeId
    : undefined;
  const primaryOther = account.nodes.find(
    (item) => item.id === primaryOtherId
  )?.label;

  const content = (
    <div className="space-y-5">
      {primaryOther && (
        <p className="text-xs text-muted-foreground">
          {primary?.sourceNodeId === node.id ? "To" : "From"} {primaryOther}
        </p>
      )}
      <NodeInspector
        key={`${node.id}:${selectedMonth}`}
        node={node}
        startingBalanceCents={account.openingBalanceCents}
        isFirstMonth={isFirstMonth}
        primaryTransfer={primary}
        selectedMonth={selectedMonth}
        onSave={onSaveNode}
        onRemoveTransfer={(id) => onRemoveTransfer(node.id, id)}
      />
      {additional.map((transfer) => {
        const outgoing = transfer.sourceNodeId === node.id;
        const otherId = outgoing
          ? transfer.targetNodeId
          : transfer.sourceNodeId;
        const other =
          account.nodes.find((item) => item.id === otherId)?.label ??
          "Connected box";
        return (
          <details
            key={`${node.id}:${transfer.id}:${selectedMonth}`}
            className="rounded-md border border-border p-3"
          >
            <summary className="cursor-pointer text-sm font-medium">
              {outgoing ? "To" : "From"} {other}
            </summary>
            <div className="pt-4">
              <ElementTransferEditor
                transfer={transfer}
                selectedMonth={selectedMonth}
                onSave={(id, values) => onSaveTransfer(node.id, id, values)}
                onRemove={() => onRemoveTransfer(node.id, transfer.id)}
              />
            </div>
          </details>
        );
      })}
    </div>
  );

  if (isMobile) {
    return (
      <Sheet open onOpenChange={(open) => !open && onClose()}>
        <SheetContent
          side="bottom"
          data-testid="money-flow-inspector"
          className="max-h-[85dvh] overflow-y-auto pb-[env(safe-area-inset-bottom)]"
        >
          <SheetHeader>
            <SheetTitle>{title}</SheetTitle>
            <SheetDescription>
              Changes update the monthly scenario when saved.
            </SheetDescription>
          </SheetHeader>
          <div className="px-4 pb-5">{content}</div>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <aside
      aria-label="Money flow inspector"
      data-testid="money-flow-inspector"
      className="absolute inset-y-3 right-3 z-20 w-72 overflow-y-auto rounded-md border border-border bg-background shadow-md"
    >
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div>
          <p className="font-semibold">{title}</p>
          <p className="text-xs text-muted-foreground">
            Saved changes update totals.
          </p>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={onClose}
          aria-label="Close inspector"
        >
          <X />
        </Button>
      </div>
      <div className="p-4">{content}</div>
    </aside>
  );
}

function NodeInspector({
  node,
  startingBalanceCents,
  isFirstMonth,
  primaryTransfer,
  selectedMonth,
  onSave,
  onRemoveTransfer,
}: {
  node: MoneyCanvasNode;
  startingBalanceCents: number;
  isFirstMonth: boolean;
  primaryTransfer?: MoneyFlowTransfer;
  selectedMonth: YearMonth;
  onSave: MoneyInspectorProps["onSaveNode"];
  onRemoveTransfer: (id: string) => Promise<boolean>;
}) {
  const [label, setLabel] = useState(node.data.label);
  const save = useInspectorSave();
  const schedule = useTransferSchedule(primaryTransfer, selectedMonth);
  const hasFlow = ["income", "expense", "account"].includes(node.data.kind);
  const flowKind = node.data.kind === "account" ? "transfer" : node.data.kind;
  const [flowLabel, setFlowLabel] = useState(primaryTransfer?.label ?? "");
  const [note, setNote] = useState(node.data.note ?? "");
  const [startingBalance, setStartingBalance] = useState(
    (startingBalanceCents / 100).toString()
  );
  const [error, setError] = useState<string | null>(null);
  const [flowAmount, setFlowAmount] = useState(
    primaryTransfer
      ? (primaryTransfer.baseMonthlyAmountCents / 100).toString()
      : ""
  );
  const existingOverride = primaryTransfer?.monthOverrides?.[selectedMonth];
  const [flowOverride, setFlowOverride] = useState(
    typeof existingOverride === "number"
      ? (existingOverride / 100).toString()
      : ""
  );
  const [flowErrors, setFlowErrors] = useState<{
    amount?: string;
    override?: string;
  }>({});

  return (
    <form
      className="space-y-4"
      aria-busy={save.state === "saving"}
      onChange={save.reset}
      onSubmit={async (event) => {
        event.preventDefault();
        if (save.state === "saving") return;
        const parsedStartingBalance = parseMoneyCents(startingBalance, {
          allowNegative: true,
        });
        if (
          node.data.kind === "chequing" &&
          isFirstMonth &&
          parsedStartingBalance === null
        ) {
          setError(
            "Enter a valid starting balance with no more than two decimal places."
          );
          return;
        }
        setError(null);

        const parsedAmount = parseMoneyCents(flowAmount);
        const parsedOverride =
          flowOverride.trim() === "" ? null : parseMoneyCents(flowOverride);
        const nextFlowErrors: typeof flowErrors = {};
        if (hasFlow) {
          if (parsedAmount === null)
            nextFlowErrors.amount =
              "Enter a non-negative amount with no more than two decimal places.";
          if (flowOverride.trim() !== "" && parsedOverride === null)
            nextFlowErrors.override =
              "Enter a valid override or leave it empty to use the recurring amount.";
        }
        setFlowErrors(nextFlowErrors);
        const dates = hasFlow ? schedule.validate() : null;
        if (Object.keys(nextFlowErrors).length > 0 || (hasFlow && !dates))
          return;

        await save.submit(() =>
          onSave(node.id, {
            label: label.trim() || "Untitled",
            note: note.trim(),
            startingBalanceCents:
              node.data.kind === "chequing" &&
              isFirstMonth &&
              parsedStartingBalance !== null
                ? parsedStartingBalance
                : undefined,
            flow:
              hasFlow && parsedAmount !== null && dates
                ? {
                    ...dates,
                    transferId: primaryTransfer?.id,
                    label: flowLabel.trim(),
                    baseMonthlyAmountCents: parsedAmount,
                    monthOverrideCents: parsedOverride,
                  }
                : undefined,
          })
        );
      }}
    >
      <fieldset
        disabled={save.state === "saving"}
        className="min-w-0 space-y-4"
      >
        <legend className="sr-only">Box details</legend>
        <Field label="Label" htmlFor="node-label">
          <Input
            id="node-label"
            value={label}
            onChange={(event) => setLabel(event.target.value)}
          />
        </Field>
        {hasFlow ? (
          <>
            <Field
              label={`Recurring monthly ${flowKind} (CAD)`}
              htmlFor={`${flowKind}-amount`}
            >
              <Input
                id={`${flowKind}-amount`}
                inputMode="decimal"
                value={flowAmount}
                onChange={(event) => setFlowAmount(event.target.value)}
                placeholder="0.00"
                aria-invalid={flowErrors.amount ? true : undefined}
                aria-describedby={
                  flowErrors.amount ? `${flowKind}-amount-error` : undefined
                }
              />
              {flowErrors.amount && (
                <p
                  id={`${flowKind}-amount-error`}
                  role="alert"
                  className="text-sm text-destructive"
                >
                  {flowErrors.amount}
                </p>
              )}
            </Field>
            <Field
              label={`${formatYearMonth(selectedMonth)} override`}
              htmlFor={`${flowKind}-month-override`}
            >
              <Input
                id={`${flowKind}-month-override`}
                inputMode="decimal"
                value={flowOverride}
                onChange={(event) => setFlowOverride(event.target.value)}
                placeholder="Use recurring amount"
                aria-invalid={flowErrors.override ? true : undefined}
                aria-describedby={
                  flowErrors.override ? `${flowKind}-override-error` : undefined
                }
              />
              {flowErrors.override && (
                <p
                  id={`${flowKind}-override-error`}
                  role="alert"
                  className="text-sm text-destructive"
                >
                  {flowErrors.override}
                </p>
              )}
            </Field>
            <TransferScheduleFields
              schedule={schedule}
              idPrefix={flowKind}
              disabled={save.state === "saving"}
              onChange={save.reset}
            />
            <Field
              label="Flow label (optional)"
              htmlFor={`${flowKind}-flow-label`}
            >
              <Input
                id={`${flowKind}-flow-label`}
                value={flowLabel}
                onChange={(event) => setFlowLabel(event.target.value)}
                placeholder="Optional connection label"
                maxLength={120}
              />
            </Field>
          </>
        ) : null}
        {node.data.kind === "chequing" ? (
          <Field label="Starting balance" htmlFor="starting-balance">
            <div className="relative">
              <CircleDollarSign className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="starting-balance"
                inputMode="decimal"
                value={startingBalance}
                onChange={(event) => setStartingBalance(event.target.value)}
                disabled={!isFirstMonth}
                aria-invalid={error ? true : undefined}
                aria-describedby={error ? "starting-balance-error" : undefined}
                className="pl-9"
              />
            </div>
            {!isFirstMonth ? (
              <p className="text-xs text-muted-foreground">
                Carried forward from the previous month.
              </p>
            ) : null}
          </Field>
        ) : null}
        <Field label="Note" htmlFor="node-note">
          <textarea
            id="node-note"
            value={note}
            onChange={(event) => setNote(event.target.value)}
            className="min-h-28 w-full rounded-md border border-input bg-background px-3 py-2 text-base outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 md:text-sm"
            placeholder="Optional context"
          />
        </Field>
        {error ? (
          <p
            id="starting-balance-error"
            role="alert"
            className="text-sm text-destructive"
          >
            {error}
          </p>
        ) : null}
        <InspectorSave
          state={save.state}
          label={hasFlow ? `Save ${flowKind}` : "Save box"}
          confirmation={
            hasFlow
              ? `${flowKind[0].toUpperCase()}${flowKind.slice(1)} saved.`
              : "Box saved."
          }
        />
        {primaryTransfer && (
          <Button
            variant="outline"
            className="w-full"
            onClick={() =>
              void save.submit(() => onRemoveTransfer(primaryTransfer.id))
            }
          >
            Remove connection
          </Button>
        )}
      </fieldset>
    </form>
  );
}

function ElementTransferEditor({
  transfer,
  selectedMonth,
  onSave,
  onRemove,
}: {
  transfer: MoneyFlowTransfer;
  selectedMonth: YearMonth;
  onSave: (id: string, values: TransferEditValues) => Promise<boolean>;
  onRemove: () => Promise<boolean>;
}) {
  const [label, setLabel] = useState(transfer.label ?? "");
  const prefix = `connection-${transfer.id}`;
  const save = useInspectorSave();
  const schedule = useTransferSchedule(transfer, selectedMonth);
  const [baseAmount, setBaseAmount] = useState(
    (transfer.baseMonthlyAmountCents / 100).toString()
  );
  const existingOverride = transfer.monthOverrides?.[selectedMonth];
  const [monthOverride, setMonthOverride] = useState(
    typeof existingOverride === "number"
      ? (existingOverride / 100).toString()
      : ""
  );
  const [errors, setErrors] = useState<
    Partial<Record<"amount" | "override", string>>
  >({});

  return (
    <form
      className="space-y-4"
      aria-busy={save.state === "saving"}
      onChange={save.reset}
      onSubmit={async (event) => {
        event.preventDefault();
        if (save.state === "saving") return;
        const parsedBaseAmount = parseMoneyCents(baseAmount);
        const parsedOverride =
          monthOverride.trim() === "" ? null : parseMoneyCents(monthOverride);
        const nextErrors: typeof errors = {};
        if (parsedBaseAmount === null)
          nextErrors.amount =
            "Enter a non-negative amount with no more than two decimal places.";
        if (monthOverride.trim() !== "" && parsedOverride === null)
          nextErrors.override =
            "Enter a valid override or leave it empty to use the recurring amount.";
        const dates = schedule.validate();
        setErrors(nextErrors);
        if (
          Object.keys(nextErrors).length > 0 ||
          parsedBaseAmount === null ||
          !dates
        )
          return;

        await save.submit(() =>
          onSave(transfer.id, {
            label: label.trim(),
            baseMonthlyAmountCents: parsedBaseAmount,
            monthOverrideCents: parsedOverride,
            ...dates,
          })
        );
      }}
    >
      <fieldset
        disabled={save.state === "saving"}
        className="min-w-0 space-y-4"
      >
        <legend className="sr-only">Money flow details</legend>
        <Field label="Recurring monthly amount" htmlFor={`${prefix}-amount`}>
          <div className="relative">
            <CircleDollarSign className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id={`${prefix}-amount`}
              aria-invalid={errors.amount ? true : undefined}
              aria-describedby={
                errors.amount ? `${prefix}-amount-error` : undefined
              }
              inputMode="decimal"
              value={baseAmount}
              onChange={(event) => setBaseAmount(event.target.value)}
              className="pl-9"
            />
          </div>
        </Field>
        <Field
          label={`${formatYearMonth(selectedMonth)} override`}
          htmlFor={`${prefix}-month-override`}
        >
          <div className="relative">
            <CircleDollarSign className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id={`${prefix}-month-override`}
              aria-invalid={errors.override ? true : undefined}
              aria-describedby={
                errors.override ? `${prefix}-override-error` : undefined
              }
              inputMode="decimal"
              value={monthOverride}
              onChange={(event) => setMonthOverride(event.target.value)}
              className="pl-9"
              placeholder="Use recurring amount"
            />
          </div>
        </Field>
        <TransferScheduleFields
          schedule={schedule}
          idPrefix={prefix}
          disabled={save.state === "saving"}
          onChange={save.reset}
        />
        <Field label="Flow label (optional)" htmlFor={`${prefix}-label`}>
          <Input
            id={`${prefix}-label`}
            value={label}
            onChange={(event) => setLabel(event.target.value)}
            placeholder="Optional, e.g. automatic transfer"
          />
        </Field>
        <div aria-live="polite" className="space-y-1">
          {Object.entries(errors).map(([field, message]) => (
            <p
              key={field}
              id={`${prefix}-${field}-error`}
              className="text-sm text-destructive"
            >
              {message}
            </p>
          ))}
        </div>
        <InspectorSave
          state={save.state}
          label="Save connection"
          confirmation="Connection saved."
        />
        <Button
          variant="outline"
          className="w-full"
          onClick={() => void save.submit(onRemove)}
        >
          Remove connection
        </Button>
      </fieldset>
    </form>
  );
}

type InspectorSaveState = "idle" | "saving" | "saved" | "failed";

function useInspectorSave() {
  const [state, setState] = useState<InspectorSaveState>("idle");
  return {
    state,
    reset: () => setState("idle"),
    submit: async (commit: () => Promise<boolean>) => {
      setState("saving");
      try {
        setState((await commit()) ? "saved" : "failed");
      } catch {
        setState("failed");
      }
    },
  };
}

function InspectorSave({
  state,
  label,
  confirmation,
}: {
  state: InspectorSaveState;
  label: string;
  confirmation: string;
}) {
  return (
    <div className="space-y-2">
      <Button type="submit" className="w-full" disabled={state === "saving"}>
        <Save aria-hidden="true" />
        {state === "saving" ? "Saving…" : label}
      </Button>
      {state === "saved" && (
        <output
          className="block text-sm text-muted-foreground"
          aria-live="polite"
        >
          {confirmation}
        </output>
      )}
      {state === "failed" && (
        <p role="alert" className="text-sm text-destructive">
          Not saved. Your edits are still here. Try saving again, or resolve any
          conflict above.
        </p>
      )}
    </div>
  );
}

function Field({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <label htmlFor={htmlFor} className="text-sm font-medium">
        {label}
      </label>
      {children}
    </div>
  );
}
