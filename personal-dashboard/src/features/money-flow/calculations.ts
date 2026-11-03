import { compareYearMonth, enumerateMonths } from "./months";
import {
  calendarDate,
  daysInCalendarMonth,
  formatDateOnly,
  parseDateOnly,
} from "../../lib/date-only";
import type {
  MoneyFlowDocument,
  MoneyFlowMonthResult,
  MoneyFlowTotals,
  MoneyFlowTransfer,
  YearMonth,
} from "./types";

export function calculateMoneyFlowForecast(
  document: MoneyFlowDocument,
  accountId = document.view.selectedAccountId
): MoneyFlowMonthResult[] {
  const account =
    document.accounts.find((item) => item.id === accountId) ??
    document.accounts[0];
  let openingBalanceCents = account?.openingBalanceCents ?? 0;

  return enumerateMonths(
    document.scenario.startMonth,
    document.scenario.forecastMonthCount
  ).map((month) => {
    const transferAmounts = Object.fromEntries(
      (account?.transfers ?? []).map((transfer) => [
        transfer.id,
        getTransferAmountForMonth(transfer, month),
      ])
    );
    const monthlyInflowCents = account
      ? sumTransfers(
          account.transfers.filter(
            (transfer) => transfer.targetNodeId === account.centerNodeId
          ),
          transferAmounts
        )
      : 0;
    const monthlyOutflowCents = account
      ? sumTransfers(
          account.transfers.filter(
            (transfer) => transfer.sourceNodeId === account.centerNodeId
          ),
          transferAmounts
        )
      : 0;
    const projectedBalanceCents =
      openingBalanceCents + monthlyInflowCents - monthlyOutflowCents;
    const result: MoneyFlowMonthResult = {
      month,
      startingBalanceCents: openingBalanceCents,
      monthlyInflowCents,
      monthlyOutflowCents,
      projectedBalanceCents,
      transferAmounts,
    };

    openingBalanceCents = projectedBalanceCents;
    return result;
  });
}

export function calculateMoneyFlowTotals(
  document: MoneyFlowDocument,
  month = document.view.selectedMonth,
  accountId = document.view.selectedAccountId
): MoneyFlowTotals {
  const forecast = calculateMoneyFlowForecast(document, accountId);
  return forecast.find((item) => item.month === month) ?? forecast[0];
}

export function getTransferAmountForMonth(
  transfer: MoneyFlowTransfer,
  month: YearMonth
) {
  if (!isTransferActiveForMonth(transfer, month)) {
    return 0;
  }

  const override = transfer.monthOverrides?.[month];
  return override ?? transfer.baseMonthlyAmountCents;
}

export function isTransferActiveForMonth(
  transfer: MoneyFlowTransfer,
  month: YearMonth
) {
  if (compareYearMonth(month, transfer.startMonth) < 0) {
    return false;
  }

  if (transfer.endMonth && compareYearMonth(month, transfer.endMonth) > 0) {
    return false;
  }

  if (transfer.startDate) {
    const paymentDate = getTransferPaymentDate(transfer, month);
    if (
      !paymentDate ||
      paymentDate < transfer.startDate ||
      (transfer.endDate && paymentDate > transfer.endDate)
    )
      return false;
  }

  return transfer.monthOverrides?.[month] !== null;
}

/** Monthly anchors clamp to the last valid day in shorter months. */
export function getTransferPaymentDate(
  transfer: MoneyFlowTransfer,
  month: YearMonth
) {
  const start = parseDateOnly(transfer.startDate);
  if (!start) return null;
  const [year, monthNumber] = month.split("-").map(Number);
  return formatDateOnly(
    calendarDate(
      year,
      monthNumber - 1,
      Math.min(start.getUTCDate(), daysInCalendarMonth(year, monthNumber - 1))
    )
  );
}

function sumTransfers(
  transfers: MoneyFlowTransfer[],
  transferAmounts: Record<string, number>
) {
  return transfers.reduce(
    (total, transfer) => total + (transferAmounts[transfer.id] ?? 0),
    0
  );
}

export function formatMoney(
  cents: number,
  currency: MoneyFlowDocument["currency"] = "CAD"
) {
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(cents / 100);
}
