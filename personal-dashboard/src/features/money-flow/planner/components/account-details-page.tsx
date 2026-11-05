"use client";
import { useState } from "react";
import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { Button } from "@/components/ui/button";
import { MonthPicker } from "@/components/ui/month-picker";
import { formatMoney } from "../../calculations";
import { addMonths } from "../../months";
import { usePlanner } from "../use-planner";
import type { FinancialAccount, Payment } from "../types";
import { PlannerShell, PlannerLoading, MONEY_PATH } from "./planner-shell";
import { AccountEditor } from "./account-editor";
import { PaymentEditor } from "./payment-editor";
import { PaymentStatusEditor } from "./payment-status-editor";
import { PaymentList } from "./payment-list";

export function AccountDetailsPage({ accountId }: { accountId: string }) {
  const planner = usePlanner(),
    { data, month } = planner;
  const account = data?.accounts.find((item) => item.id === accountId);
  const [editing, setEditing] = useState(false),
    [payment, setPayment] = useState<Payment | "new" | null>(null),
    [status, setStatus] = useState<Payment | null>(null);
  const rows = useQuery(
    api.plannerAccounts.statements,
    account?.kind === "credit" ? { accountId } : "skip"
  );
  return (
    <PlannerShell
      page="accounts"
      title={account?.name ?? "Account details"}
      description="Review monthly payments and keep your manually recorded balance up to date."
      actions={
        <>
          <Button variant="outline" asChild>
            <Link href={`${MONEY_PATH}/accounts`}>All accounts</Link>
          </Button>
          {account && (
            <Button onClick={() => setEditing(true)}>Update balance</Button>
          )}
        </>
      }
    >
      {!data?.ready ? (
        <PlannerLoading error={planner.error} onRetry={planner.retry} />
      ) : !account ? (
        <p>Account unavailable. Choose an account from the list.</p>
      ) : (
        <>
          <div className="flex flex-wrap items-center justify-between gap-5 rounded-2xl border border-border p-6">
            <div>
              <p className="text-sm text-muted-foreground">
                {account.kind === "credit"
                  ? "Current amount owed"
                  : "Recorded bank balance"}
              </p>
              <p className="mt-2 text-4xl font-semibold tracking-tight tabular-nums">
                {formatMoney(account.balanceCents)}
              </p>
              <p className="mt-3 text-xs text-muted-foreground">
                {account.balanceUpdatedAt
                  ? `Manually updated ${new Date(account.balanceUpdatedAt).toLocaleDateString("en-CA")}`
                  : "Imported opening balance; not yet confirmed."}
              </p>
            </div>
            {account.legacyAccountId && (
              <Button variant="outline" asChild>
                <Link
                  href={`${MONEY_PATH}/${encodeURIComponent(account.legacyAccountId)}`}
                >
                  Open monthly canvas
                </Link>
              </Button>
            )}
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <MonthPicker
              aria-label="Account month"
              value={month}
              onValueChange={planner.setMonth}
            />
            {account.kind === "credit" && (
              <Button onClick={() => setPayment("new")}>
                Add monthly statement
              </Button>
            )}
          </div>
          <section className="overflow-hidden rounded-2xl border border-border">
            <div className="p-5">
              <h2 className="font-semibold">
                {account.kind === "credit"
                  ? "Statement payments"
                  : "Payments this month"}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {account.kind === "credit"
                  ? "Statement months, due dates and Paid on dates refer to the same records in your planner. Up to 25 recent statements are shown."
                  : "Includes recurring bills, savings and credit-card payments from this account."}
              </p>
            </div>
            {account.kind === "credit" ? (
              <CreditStatements
                rows={rows}
                accounts={data.accounts}
                month={month}
                onEdit={setPayment}
                onStatus={setStatus}
              />
            ) : (
              <PaymentList
                items={data.entries.filter(
                  (item) => item.accountId === accountId
                )}
                accounts={data.accounts}
                month={month}
                onEdit={setPayment}
                onStatus={setStatus}
              />
            )}
          </section>
          {editing && (
            <AccountEditor
              item={account}
              month={month}
              onClose={() => setEditing(false)}
            />
          )}
          {payment && (
            <PaymentEditor
              month={month}
              accounts={data.accounts}
              item={payment === "new" ? undefined : payment}
              initial={
                payment === "new"
                  ? {
                      kind: "cardPayment",
                      name: `${account.name} payment`,
                      counterpartyId: account.id,
                      statementMonth: month,
                      dueDate: `${addMonths(month as `${number}-${number}`, 1)}-01`,
                    }
                  : undefined
              }
              onClose={() => setPayment(null)}
            />
          )}
          {status && (
            <PaymentStatusEditor
              item={status}
              onClose={() => setStatus(null)}
            />
          )}
        </>
      )}
    </PlannerShell>
  );
}
function CreditStatements({
  rows,
  accounts,
  month,
  onEdit,
  onStatus,
}: {
  rows: Payment[] | undefined;
  accounts: FinancialAccount[];
  month: string;
  onEdit: (payment: Payment) => void;
  onStatus: (payment: Payment) => void;
}) {
  if (!rows)
    return (
      <p className="p-5 text-sm text-muted-foreground">Loading statements…</p>
    );
  return (
    <>
      {rows.map((item) => (
        <div key={item._id} className="border-t border-border">
          <div className="flex flex-wrap justify-between gap-2 px-5 py-3 text-sm">
            <p className="font-medium">
              Statement {item.statementMonth ?? item.month}
            </p>
            <p className="text-muted-foreground">
              Statement balance:{" "}
              {item.statementAmountCents === null
                ? "Not entered"
                : formatMoney(item.statementAmountCents)}
            </p>
          </div>
          <PaymentList
            items={[item]}
            accounts={accounts}
            month={month}
            onEdit={onEdit}
            onStatus={onStatus}
          />
        </div>
      ))}
      {!rows.length && (
        <p className="p-5 text-sm text-muted-foreground">
          Add a statement to record its amount, due date and when you paid it.
        </p>
      )}
    </>
  );
}
