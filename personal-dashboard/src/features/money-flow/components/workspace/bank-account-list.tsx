"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowUpRight, Landmark, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/patterns/empty-state";
import { formatMoney } from "../../calculations";
import type { MoneyFlowAccountWorkspace } from "../../types";

type BankAccountSummary = Pick<
  MoneyFlowAccountWorkspace,
  "id" | "name" | "institution" | "accountType" | "openingBalanceCents"
>;

type BankAccountListProps = {
  accounts: BankAccountSummary[];
  onAddAccount: () => void;
  onLoadMore?: () => void;
  loadingMore?: boolean;
  children?: ReactNode;
};

export function BankAccountList({
  accounts,
  onAddAccount,
  onLoadMore,
  loadingMore = false,
  children,
}: Readonly<BankAccountListProps>) {
  const adding = !!children;
  return (
    <section
      className="h-[calc(100dvh-4rem)] min-w-0 space-y-8 overflow-y-auto bg-background p-4 sm:p-6"
      aria-labelledby="bank-accounts-title"
    >
      <header className="flex flex-wrap items-start justify-between gap-5">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
            Money Flow
          </p>
          <h1
            id="bank-accounts-title"
            className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl"
          >
            Bank accounts
          </h1>
          <p className="mt-2 max-w-xl text-sm text-muted-foreground">
            Choose a bank account to open its cash-flow workspace.
          </p>
        </div>
        {accounts.length > 0 && !adding && (
          <Button variant="outline" onClick={onAddAccount}>
            <Plus aria-hidden="true" />
            Add bank account
          </Button>
        )}
      </header>
      {adding && <div id="bank-account-create">{children}</div>}
      {accounts.length > 0 ? (
        <div className="space-y-4">
          <p className="text-xs font-medium text-muted-foreground">
            {accounts.length} bank{" "}
            {accounts.length === 1 ? "account" : "accounts"}
          </p>
          <ul
            className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3"
            aria-label="Your bank accounts"
          >
            {accounts.map((account) => (
              <li key={account.id} className="min-w-0">
                <Link
                  href={`/dashboard/watchlist/money-flow/${encodeURIComponent(account.id)}`}
                  aria-label={`Open workspace for ${account.name}`}
                  className="group flex h-full min-w-0 flex-col gap-6 rounded-xl border border-border bg-card p-5 text-card-foreground shadow-xs outline-none transition-[background-color,border-color,box-shadow] hover:border-foreground/20 hover:bg-accent/30 hover:shadow-sm focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                >
                  <div className="flex min-w-0 items-start gap-3">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-border bg-muted">
                      <Landmark
                        className="size-5 text-muted-foreground"
                        aria-hidden="true"
                      />
                    </span>
                    <div className="min-w-0 flex-1">
                      <h2 className="break-words text-base font-semibold">
                        {account.name}
                      </h2>
                      <p className="mt-1 break-words text-sm text-muted-foreground">
                        {account.institution}
                      </p>
                    </div>
                    <ArrowUpRight
                      className="size-4 shrink-0 text-muted-foreground transition-colors group-hover:text-foreground"
                      aria-hidden="true"
                    />
                  </div>
                  <div className="flex flex-wrap items-end justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-xs text-muted-foreground">
                        Opening balance
                      </p>
                      <p className="mt-1 break-words text-xl font-semibold tabular-nums">
                        {formatMoney(account.openingBalanceCents)}
                      </p>
                    </div>
                    <span className="rounded-full border border-border bg-muted/30 px-2.5 py-1 text-xs capitalize text-muted-foreground">
                      {account.accountType}
                    </span>
                  </div>
                  <div className="mt-auto flex items-center justify-between border-t border-border pt-3 text-xs text-muted-foreground">
                    <span>CAD</span>
                    <span className="font-medium text-foreground">
                      Open workspace
                    </span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
          {onLoadMore && (
            <Button
              variant="outline"
              disabled={loadingMore}
              onClick={onLoadMore}
            >
              {loadingMore ? "Loading accounts..." : "Load more accounts"}
            </Button>
          )}
        </div>
      ) : (
        !adding && (
          <EmptyState
            title="No bank accounts yet"
            description="Add your first bank account to start planning its income, expenses, and monthly balance."
            action={
              <Button onClick={onAddAccount}>
                <Plus aria-hidden="true" />
                Add your first bank account
              </Button>
            }
          />
        )
      )}
    </section>
  );
}
