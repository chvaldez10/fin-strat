import {
  ArrowDownLeft,
  ArrowUpRight,
  Landmark,
  WalletCards,
} from "lucide-react";
import { ELEMENT_CONNECTION_CONFIG } from "./element-connection-config";

export const ELEMENT_PRESENTATION = {
  chequing: {
    connection: ELEMENT_CONNECTION_CONFIG.colors.chequing,
    icon: WalletCards,
    label: "Bank account",
    accent: "bg-foreground/10 text-foreground",
    handle: "bg-foreground!",
    border: "border-border",
  },
  income: {
    connection: ELEMENT_CONNECTION_CONFIG.colors.income,
    icon: ArrowDownLeft,
    label: "Income",
    accent: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
    handle: "bg-emerald-500!",
    border: "border-emerald-500/25",
  },
  expense: {
    connection: ELEMENT_CONNECTION_CONFIG.colors.expense,
    icon: ArrowUpRight,
    label: "Expense",
    accent: "bg-rose-500/10 text-rose-700 dark:text-rose-400",
    handle: "bg-rose-500!",
    border: "border-rose-500/25",
  },
  account: {
    connection: ELEMENT_CONNECTION_CONFIG.colors.account,
    icon: Landmark,
    label: "Transfer",
    accent: "bg-sky-500/10 text-sky-700 dark:text-sky-400",
    handle: "bg-sky-500!",
    border: "border-sky-500/25",
  },
} as const;
