"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { formatMoney } from "../../calculations";
import type { ActivityCategory } from "../activity";
import type { ActivityEntry } from "../activity-data";
import type { FinancialAccount, Payment } from "../types";
import { ActivityEntryEditor } from "./activity-entry-editor";
import { ActivityScheduledRemoval } from "./activity-scheduled-removal";
import { ActivitySelect } from "./activity-select";
import { CanvasInspector } from "../../components/canvas-inspector";
import { CanvasPaymentForm } from "./canvas-payment-form";
import { PaymentEditor } from "./payment-editor";
import { PlannerSheet } from "./planner-form";

export function ActivityIncomeInspector({
  month,
  received,
  scheduled,
  accounts,
  categories,
  canLog,
  presentation = "canvas",
  onClose,
  onLogScheduled,
}: Readonly<{
  month: string;
  received: ActivityEntry[];
  scheduled: Payment[];
  accounts: FinancialAccount[];
  categories: ActivityCategory[];
  canLog: boolean;
  presentation?: "canvas" | "sheet";
  onClose: () => void;
  onLogScheduled: (payment: Payment) => void;
}>) {
  const [choice, setChoice] = useState("");
  const [details, setDetails] = useState<Payment | null>(null);
  const [removal, setRemoval] = useState<Payment | null>(null);
  const Container = presentation === "canvas" ? CanvasInspector : PlannerSheet;
  const options = [
    ...received.map((entry) => ({
      id: entry._id,
      name: `Received · ${entry.description} · ${formatMoney(entry.amountCents)} · ${entry.date}`,
    })),
    ...scheduled.map((payment) => ({
      id: payment._id,
      name: `Scheduled · ${payment.name} · ${payment.amountCents === null ? "Amount unknown" : formatMoney(payment.amountCents)} · ${payment.dueDate}`,
    })),
  ];
  const id = options.some((option) => option.id === choice)
    ? choice
    : (options[0]?.id ?? "");
  const entry = received.find((item) => item._id === id);
  const payment = scheduled.find((item) => item._id === id);
  const controls = options.length > 1 && (
    <ActivitySelect
      label="Income to edit"
      value={id}
      options={options}
      onChange={setChoice}
    />
  );

  if (details)
    return (
      <PaymentEditor
        month={month}
        accounts={accounts}
        item={details}
        lockedKind
        onClose={() => setDetails(null)}
      />
    );

  if (payment)
    return (
      <>
        <Container
          title="Edit scheduled income"
          description={`Expected income · ${month}`}
          onClose={onClose}
        >
          <div className="space-y-4">
            {controls}
            <CanvasPaymentForm
              key={payment._id}
              item={payment}
              onMore={() => setDetails(payment)}
              onDelete={() => setRemoval(payment)}
            />
            {canLog && (
              <Button
                variant="outline"
                className="w-full"
                onClick={() => onLogScheduled(payment)}
              >
                Log as received
              </Button>
            )}
          </div>
        </Container>
        {removal && (
          <ActivityScheduledRemoval
            item={removal}
            onClose={() => setRemoval(null)}
            onRemoved={onClose}
          />
        )}
      </>
    );

  if (entry || canLog)
    return (
      <ActivityEntryEditor
        key={entry?._id ?? "new-income"}
        presentation={presentation}
        controls={controls}
        month={month}
        draft={{ kind: "income", entry }}
        accounts={accounts}
        categories={categories}
        scheduled={scheduled}
        onClose={onClose}
        onSaved={onClose}
      />
    );

  return (
    <Container title="Income received" description={month} onClose={onClose}>
      <p className="text-sm text-muted-foreground">
        You can log income after you receive it.
      </p>
    </Container>
  );
}
