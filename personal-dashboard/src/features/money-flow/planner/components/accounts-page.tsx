"use client";
import { useState } from "react";
import Link from "next/link";
import { ArrowUpRight, CreditCard, Landmark, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/patterns/empty-state";
import { formatMoney } from "../../calculations";
import { usePlanner } from "../use-planner";
import { PlannerShell, PlannerLoading, MONEY_PATH } from "./planner-shell";
import { AccountEditor } from "./account-editor";
import { monthLink } from "../use-planner-month";

export function AccountsPage() {
  const planner = usePlanner(),
    [adding, setAdding] = useState(false);
  const { data, month } = planner;
  return (
    <PlannerShell
      title="Your accounts"
      description="Bank cash and credit balances, with one place to check payment dates."
      actions={
        <Button onClick={() => setAdding(true)} disabled={!data?.ready}>
          <Plus aria-hidden="true" />
          Add account
        </Button>
      }
    >
      {!data?.ready ? (
        <PlannerLoading error={planner.error} onRetry={planner.retry} />
      ) : (
        <>
          {["bank", "credit"].map((group) => {
            const accounts = data.accounts.filter((account) =>
              group === "credit"
                ? account.kind === "credit"
                : account.kind !== "credit"
            );
            return (
              <section key={group} className="space-y-4">
                <div>
                  <h2 className="text-lg font-semibold">
                    {group === "credit" ? "Credit cards" : "Bank accounts"}
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {group === "credit"
                      ? "Balances owed are kept separate from available cash."
                      : "Open an account to see its monthly payments and canvas."}
                  </p>
                </div>
                {accounts.length ? (
                  <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    {accounts.map((account) => (
                      <Link
                        key={account.id}
                        href={monthLink(
                          `${MONEY_PATH}/accounts/${encodeURIComponent(account.id)}`,
                          month
                        )}
                        className="rounded-2xl border border-border bg-card p-5 outline-none transition-colors hover:border-foreground/25 focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <span className="flex size-11 items-center justify-center rounded-xl bg-muted">
                            {group === "credit" ? (
                              <CreditCard
                                className="size-5"
                                aria-hidden="true"
                              />
                            ) : (
                              <Landmark className="size-5" aria-hidden="true" />
                            )}
                          </span>
                          <ArrowUpRight
                            className="size-4 text-muted-foreground"
                            aria-hidden="true"
                          />
                        </div>
                        <h3 className="mt-5 font-semibold">{account.name}</h3>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {account.institution || account.kind}
                        </p>
                        <p className="mt-5 text-xs text-muted-foreground">
                          {group === "credit"
                            ? "Current amount owed"
                            : "Recorded balance"}
                        </p>
                        <p className="mt-1 text-2xl font-semibold tabular-nums">
                          {formatMoney(account.balanceCents)}
                        </p>
                        <p className="mt-3 text-xs text-muted-foreground">
                          {account.balanceUpdatedAt
                            ? `Manually updated ${new Date(account.balanceUpdatedAt).toLocaleDateString("en-CA")}`
                            : "Imported opening balance · not verified"}
                        </p>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <EmptyState
                    title={
                      group === "credit"
                        ? "Add your credit cards"
                        : "Add your first bank account"
                    }
                    description={
                      group === "credit"
                        ? "Track Costco and Scotia Visa here, then add their statement payments to your month."
                        : "Choose where income arrives and bills are paid."
                    }
                    action={
                      <Button variant="outline" onClick={() => setAdding(true)}>
                        Add account
                      </Button>
                    }
                  />
                )}
              </section>
            );
          })}
          {adding && (
            <AccountEditor month={month} onClose={() => setAdding(false)} />
          )}
        </>
      )}
    </PlannerShell>
  );
}
