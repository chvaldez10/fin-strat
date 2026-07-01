"use client";

import { calculateMoneyFlowForecast, formatMoney } from "../calculations";
import { formatYearMonth } from "../months";
import type { MoneyFlowDocument, YearMonth } from "../types";

type CashFlowTableProps = {
  document: MoneyFlowDocument;
  selectedMonth: YearMonth;
  selectedAccountId: string;
};

export function CashFlowTable({
  document,
  selectedMonth,
  selectedAccountId,
}: CashFlowTableProps) {
  const forecast = calculateMoneyFlowForecast(document, selectedAccountId);
  const selectedIndex = forecast.findIndex(
    (month) => month.month === selectedMonth
  );
  const selectedAccount =
    document.accounts.find((account) => account.id === selectedAccountId) ??
    document.accounts[0];
  const nodeById = new Map(selectedAccount?.nodes.map((node) => [node.id, node]));
  const directTransfers = selectedAccount
    ? selectedAccount.transfers.filter(
        (transfer) =>
          transfer.sourceNodeId === selectedAccount.centerNodeId ||
          transfer.targetNodeId === selectedAccount.centerNodeId
      )
    : [];
  const inflows = directTransfers.filter(
    (transfer) => transfer.targetNodeId === selectedAccount?.centerNodeId
  );
  const outflows = directTransfers.filter(
    (transfer) => transfer.sourceNodeId === selectedAccount?.centerNodeId
  );

  return (
    <div className="h-full w-full min-w-0 max-w-full overscroll-x-contain overflow-auto bg-muted/20 p-2 sm:p-3 md:p-5">
      <div className="inline-block min-w-full max-w-none overflow-hidden rounded-md border border-border bg-background align-top">
        <table className="w-full min-w-max border-collapse text-sm">
          <thead>
            <tr className="bg-muted/60">
              <th className="sticky left-0 z-20 min-w-36 border-b border-r border-border bg-muted px-2 py-3 text-left font-semibold sm:min-w-56 sm:px-4">
                {selectedAccount?.name ?? "Cash flow"}
              </th>
              {forecast.map((month) => (
                <th
                  key={month.month}
                  className={`min-w-28 border-b border-r border-border px-2 py-3 text-right font-semibold last:border-r-0 sm:min-w-36 sm:px-4 ${
                    month.month === selectedMonth ? "bg-accent" : ""
                  }`}
                >
                  {formatYearMonth(month.month, "short")}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <BalanceRow
              label="Opening balance"
              values={forecast.map((month) => month.startingBalanceCents)}
              selectedIndex={selectedIndex}
              emphasized
            />
            <SectionRow label="Cash in" monthCount={forecast.length} />
            {inflows.map((transfer) => (
              <AmountRow
                key={transfer.id}
                label={
                  transfer.label ||
                  nodeById.get(transfer.sourceNodeId)?.label ||
                  "Income"
                }
                values={forecast.map(
                  (month) => month.transferAmounts[transfer.id] ?? 0
                )}
                selectedIndex={selectedIndex}
                tone="positive"
              />
            ))}
            <BalanceRow
              label="Total cash in"
              values={forecast.map((month) => month.monthlyInflowCents)}
              selectedIndex={selectedIndex}
              tone="positive"
              emphasized
            />
            <SectionRow label="Cash out" monthCount={forecast.length} />
            {outflows.map((transfer) => (
              <AmountRow
                key={transfer.id}
                label={
                  transfer.label ||
                  nodeById.get(transfer.targetNodeId)?.label ||
                  "Expense"
                }
                values={forecast.map(
                  (month) => month.transferAmounts[transfer.id] ?? 0
                )}
                selectedIndex={selectedIndex}
                tone="negative"
              />
            ))}
            <BalanceRow
              label="Total cash out"
              values={forecast.map((month) => month.monthlyOutflowCents)}
              selectedIndex={selectedIndex}
              tone="negative"
              emphasized
            />
            <BalanceRow
              label="Ending balance"
              values={forecast.map((month) => month.projectedBalanceCents)}
              selectedIndex={selectedIndex}
              emphasized
              strong
            />
          </tbody>
        </table>
      </div>
    </div>
  );
}

function SectionRow({ label, monthCount }: { label: string; monthCount: number }) {
  return (
    <tr className="bg-muted/30">
      <th className="sticky left-0 z-10 border-b border-r border-border bg-muted/90 px-2 py-2 text-left text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground sm:px-4">
        {label}
      </th>
      <td colSpan={monthCount} className="border-b border-border" />
    </tr>
  );
}

function AmountRow({
  label,
  values,
  tone,
  selectedIndex,
}: {
  label: string;
  values: number[];
  tone: "positive" | "negative";
  selectedIndex: number;
}) {
  return (
    <BalanceRow
      label={label}
      values={values}
      tone={tone}
      prefix={tone === "negative" ? "-" : ""}
      selectedIndex={selectedIndex}
    />
  );
}

function BalanceRow({
  label,
  values,
  tone,
  prefix = "",
  emphasized = false,
  strong = false,
  selectedIndex,
}: {
  label: string;
  values: number[];
  tone?: "positive" | "negative";
  prefix?: string;
  emphasized?: boolean;
  strong?: boolean;
  selectedIndex: number;
}) {
  return (
    <tr className={strong ? "bg-foreground text-background" : undefined}>
      <th
        className={`sticky left-0 z-10 max-w-36 truncate border-b border-r border-border px-2 py-2.5 text-left sm:max-w-56 sm:px-4 ${
          strong ? "bg-foreground" : "bg-background"
        } ${emphasized ? "font-semibold" : "font-normal"}`}
      >
        {label}
      </th>
      {values.map((value, index) => (
        <td
          key={index}
          className={`border-b border-r border-border px-2 py-2.5 text-right tabular-nums last:border-r-0 sm:px-4 ${
            emphasized ? "font-semibold" : ""
          } ${
            !strong && tone === "positive"
              ? "text-emerald-700 dark:text-emerald-400"
              : ""
          } ${
            !strong && tone === "negative"
              ? "text-rose-700 dark:text-rose-400"
              : ""
          } ${!strong && index === selectedIndex ? "bg-accent/45" : ""}`}
        >
          {prefix}
          {formatMoney(value)}
        </td>
      ))}
    </tr>
  );
}
