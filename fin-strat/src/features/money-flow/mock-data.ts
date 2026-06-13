import {
  MONEY_FLOW_DOCUMENT_VERSION,
  type MoneyFlowDocument,
} from "./types";
import type { UserId } from "@/features/auth/types";

export function createDemoMoneyFlowDocument(
  userId: UserId
): MoneyFlowDocument {
  return {
    id: `money-flow-monthly-baseline:${userId}`,
    userId,
    version: MONEY_FLOW_DOCUMENT_VERSION,
    currency: "CAD",
    scenario: {
      name: "Monthly baseline",
      startingBalanceCents: 185000,
    },
    viewport: {
      x: 0,
      y: 0,
      zoom: 0.85,
    },
    nodes: [
      {
        id: "income-paycheque",
        kind: "income",
        label: "Paycheque",
        position: { x: 80, y: 80 },
        note: "Primary monthly take-home pay",
      },
      {
        id: "income-side",
        kind: "income",
        label: "Side income",
        position: { x: 80, y: 260 },
      },
      {
        id: "account-chequing",
        kind: "chequing",
        label: "Chequing",
        position: { x: 520, y: 220 },
        note: "The center of this monthly plan",
      },
      {
        id: "expense-rent",
        kind: "expense",
        label: "Rent",
        position: { x: 980, y: 40 },
      },
      {
        id: "expense-utilities",
        kind: "expense",
        label: "Utilities",
        position: { x: 980, y: 190 },
      },
      {
        id: "expense-groceries",
        kind: "expense",
        label: "Groceries",
        position: { x: 980, y: 340 },
      },
      {
        id: "account-savings",
        kind: "account",
        label: "Savings",
        position: { x: 520, y: 520 },
      },
      {
        id: "account-investing",
        kind: "account",
        label: "Investing",
        position: { x: 850, y: 520 },
      },
      {
        id: "note-buffer",
        kind: "note",
        label: "Keep one month buffered",
        position: { x: 250, y: 520 },
        note: "A reminder, not part of the calculation.",
      },
    ],
    transfers: [
      {
        id: "flow-paycheque",
        sourceNodeId: "income-paycheque",
        targetNodeId: "account-chequing",
        monthlyAmountCents: 420000,
      },
      {
        id: "flow-side",
        sourceNodeId: "income-side",
        targetNodeId: "account-chequing",
        monthlyAmountCents: 65000,
      },
      {
        id: "flow-rent",
        sourceNodeId: "account-chequing",
        targetNodeId: "expense-rent",
        monthlyAmountCents: 165000,
      },
      {
        id: "flow-utilities",
        sourceNodeId: "account-chequing",
        targetNodeId: "expense-utilities",
        monthlyAmountCents: 28000,
      },
      {
        id: "flow-groceries",
        sourceNodeId: "account-chequing",
        targetNodeId: "expense-groceries",
        monthlyAmountCents: 60000,
      },
      {
        id: "flow-savings",
        sourceNodeId: "account-chequing",
        targetNodeId: "account-savings",
        monthlyAmountCents: 70000,
      },
      {
        id: "flow-investing",
        sourceNodeId: "account-savings",
        targetNodeId: "account-investing",
        monthlyAmountCents: 25000,
        label: "Automatic transfer",
      },
    ],
  };
}
