import { ChevronDown, Plus, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatMoney } from "../../calculations";
import type { ActivityFilter } from "../activity-data";
import type { ActivityWorkspaceData } from "../activity-workspace-data";
import type { FinancialAccount } from "../types";

export function ActivitySummary({
  workspace,
  account,
  canLog,
  hasAccounts,
  onLogExpense,
  onLogIncome,
  onLogSavings,
  onActivity,
  onReview,
  onImport,
  onScheduled,
  onPlan,
  onAccount,
  onUpdateAccount,
}: Readonly<{
  workspace: ActivityWorkspaceData;
  account?: FinancialAccount;
  canLog: boolean;
  hasAccounts: boolean;
  onLogExpense: () => void;
  onLogIncome: () => void;
  onLogSavings: () => void;
  onActivity: (filter?: ActivityFilter) => void;
  onReview: () => void;
  onImport: () => void;
  onScheduled: () => void;
  onPlan: () => void;
  onAccount: () => void;
  onUpdateAccount: () => void;
}>) {
  const { totals, moneyOut, activity, cardPaymentsTotal } = workspace;
  const credit = account?.kind === "credit";
  const stats: { label: string; amount: number; filter: ActivityFilter }[] = [
    {
      label: "Total spent",
      amount: totals.spent,
      filter: { type: "spending" },
    },
    {
      label: credit ? "Payments received" : "Card payments",
      amount: cardPaymentsTotal,
      filter: { type: "cardPayment" },
    },
    account && !credit
      ? {
          label: "Money out",
          amount: moneyOut,
          filter: { type: "outflow", accountId: account.id },
        }
      : {
          label: "Income received",
          amount: totals.income,
          filter: { type: "income" },
        },
  ];
  return (
    <section
      className="shrink-0 border-b border-border bg-background"
      aria-label="Monthly activity"
    >
      {hasAccounts && (
        <div
          className={`grid divide-x divide-border border-b ${credit ? "grid-cols-2" : "grid-cols-3"}`}
        >
          {stats
            .filter(({ label }) => !credit || label !== "Income received")
            .map((item) => (
              <button
                key={item.label}
                type="button"
                onClick={() => onActivity(item.filter)}
                className="min-w-0 px-3 py-3 text-left hover:bg-muted/50 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring sm:px-6"
              >
                <span className="block text-xs text-muted-foreground">
                  {item.label}
                </span>
                <span className="block wrap-anywhere text-lg font-semibold tabular-nums sm:text-2xl">
                  {formatMoney(item.amount)}
                </span>
              </button>
            ))}
        </div>
      )}
      <div className="flex flex-wrap items-center gap-2 px-4 py-2 sm:px-6">
        {hasAccounts && (
          <>
            <Button size="sm" disabled={!canLog} onClick={onLogExpense}>
              <Plus aria-hidden="true" /> Log expense
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={!canLog}
              onClick={onImport}
            >
              <Upload aria-hidden="true" /> Import statement
            </Button>
          </>
        )}
        <Button
          size="sm"
          variant={hasAccounts ? "outline" : "default"}
          onClick={onAccount}
        >
          <Plus aria-hidden="true" /> Add account
        </Button>
        {hasAccounts && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" variant="ghost">
                More <ChevronDown aria-hidden="true" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem onSelect={() => onActivity()}>
                All transactions
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={onReview}>
                Review imports
              </DropdownMenuItem>
              <DropdownMenuItem
                disabled={!canLog || credit}
                onSelect={onLogIncome}
              >
                Log income
              </DropdownMenuItem>
              <DropdownMenuItem
                disabled={!canLog || credit}
                onSelect={onLogSavings}
              >
                Log savings
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={onScheduled}>
                Upcoming payments
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={onPlan}>
                Monthly amounts
              </DropdownMenuItem>
              {account && (
                <DropdownMenuItem onSelect={onUpdateAccount}>
                  Update account balance
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
        {activity.pending.length > 0 && (
          <Button size="sm" variant="secondary" onClick={onReview}>
            Review {activity.pending.length}{" "}
            {activity.pending.length === 1 ? "import" : "imports"}
          </Button>
        )}
      </div>
    </section>
  );
}
