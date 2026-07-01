import type { UserId } from "@/features/auth/types";
import { currentYearMonth } from "./months";
import {
  MONEY_FLOW_DOCUMENT_VERSION,
  type MoneyFlowAccountWorkspace,
  type MoneyFlowDocument,
  type YearMonth,
} from "./types";

export function createDemoMoneyFlowDocument(
  userId: UserId
): MoneyFlowDocument {
  const startMonth = currentYearMonth();

  return {
    id: `money-flow-monthly-baseline:${userId}`,
    userId,
    version: MONEY_FLOW_DOCUMENT_VERSION,
    currency: "CAD",
    scenario: {
      name: "Monthly baseline",
      startMonth,
      forecastMonthCount: 12,
    },
    accounts: createDemoAccountWorkspaces(startMonth),
    view: {
      selectedMonth: startMonth,
      selectedAccountId: "account-scotiabank",
      mode: "canvas",
    },
  };
}

export function createDemoAccountWorkspaces(
  startMonth: YearMonth
): MoneyFlowAccountWorkspace[] {
  return [createScotiabankWorkspace(startMonth), createCibcWorkspace(startMonth)];
}

export function createCibcWorkspace(
  startMonth: YearMonth
): MoneyFlowAccountWorkspace {
  return {
    id: "account-cibc",
    institution: "CIBC",
    name: "CIBC Chequing",
    accountType: "chequing",
    openingBalanceCents: 90000,
    centerNodeId: "cibc-chequing",
    viewport: { x: 70, y: 45, zoom: 0.9 },
    nodes: [
      {
        id: "cibc-income-side",
        kind: "income",
        label: "Side income",
        position: { x: 110, y: 160 },
      },
      {
        id: "cibc-transfer-in",
        kind: "income",
        label: "Transfer from Scotiabank",
        position: { x: 110, y: 340 },
      },
      {
        id: "cibc-chequing",
        kind: "chequing",
        label: "Chequing",
        position: { x: 510, y: 250 },
        note: "CIBC account workspace",
      },
      {
        id: "cibc-expense-utilities",
        kind: "expense",
        label: "Utilities",
        position: { x: 920, y: 160 },
      },
      {
        id: "cibc-expense-phone",
        kind: "expense",
        label: "Phone",
        position: { x: 920, y: 340 },
      },
    ],
    transfers: [
      {
        id: "cibc-flow-side",
        sourceNodeId: "cibc-income-side",
        targetNodeId: "cibc-chequing",
        baseMonthlyAmountCents: 65000,
        startMonth,
      },
      {
        id: "cibc-flow-transfer-in",
        linkedTransferId: "linked-scotia-cibc",
        counterpartyAccountId: "account-scotiabank",
        sourceNodeId: "cibc-transfer-in",
        targetNodeId: "cibc-chequing",
        baseMonthlyAmountCents: 40000,
        startMonth,
        label: "From Scotiabank",
      },
      {
        id: "cibc-flow-utilities",
        sourceNodeId: "cibc-chequing",
        targetNodeId: "cibc-expense-utilities",
        baseMonthlyAmountCents: 28000,
        startMonth,
      },
      {
        id: "cibc-flow-phone",
        sourceNodeId: "cibc-chequing",
        targetNodeId: "cibc-expense-phone",
        baseMonthlyAmountCents: 8500,
        startMonth,
      },
    ],
  };
}

function createScotiabankWorkspace(
  startMonth: YearMonth
): MoneyFlowAccountWorkspace {
  return {
    id: "account-scotiabank",
    institution: "Scotiabank",
    name: "Scotiabank Chequing",
    accountType: "chequing",
    openingBalanceCents: 185000,
    centerNodeId: "scotia-chequing",
    viewport: { x: 25, y: 25, zoom: 0.85 },
    nodes: [
      {
        id: "scotia-income-paycheque",
        kind: "income",
        label: "Paycheque",
        position: { x: 80, y: 100 },
        note: "Primary monthly take-home pay",
      },
      {
        id: "scotia-chequing",
        kind: "chequing",
        label: "Chequing",
        position: { x: 500, y: 240 },
        note: "Scotiabank account workspace",
      },
      {
        id: "scotia-expense-rent",
        kind: "expense",
        label: "Rent",
        position: { x: 920, y: 40 },
      },
      {
        id: "scotia-expense-groceries",
        kind: "expense",
        label: "Groceries",
        position: { x: 920, y: 220 },
      },
      {
        id: "scotia-transfer-cibc",
        kind: "expense",
        label: "Transfer to CIBC",
        position: { x: 920, y: 400 },
      },
      {
        id: "scotia-account-savings",
        kind: "account",
        label: "Savings goal",
        position: { x: 650, y: 540 },
      },
      {
        id: "scotia-note-buffer",
        kind: "note",
        label: "Keep one month buffered",
        position: { x: 160, y: 500 },
        note: "A reminder, not part of the calculation.",
      },
    ],
    transfers: [
      {
        id: "scotia-flow-paycheque",
        sourceNodeId: "scotia-income-paycheque",
        targetNodeId: "scotia-chequing",
        baseMonthlyAmountCents: 420000,
        startMonth,
      },
      {
        id: "scotia-flow-rent",
        sourceNodeId: "scotia-chequing",
        targetNodeId: "scotia-expense-rent",
        baseMonthlyAmountCents: 165000,
        startMonth,
      },
      {
        id: "scotia-flow-groceries",
        sourceNodeId: "scotia-chequing",
        targetNodeId: "scotia-expense-groceries",
        baseMonthlyAmountCents: 60000,
        startMonth,
      },
      {
        id: "scotia-flow-savings",
        sourceNodeId: "scotia-chequing",
        targetNodeId: "scotia-account-savings",
        baseMonthlyAmountCents: 70000,
        startMonth,
      },
      {
        id: "scotia-flow-transfer-cibc",
        linkedTransferId: "linked-scotia-cibc",
        counterpartyAccountId: "account-cibc",
        sourceNodeId: "scotia-chequing",
        targetNodeId: "scotia-transfer-cibc",
        baseMonthlyAmountCents: 40000,
        startMonth,
        label: "To CIBC",
      },
    ],
  };
}
