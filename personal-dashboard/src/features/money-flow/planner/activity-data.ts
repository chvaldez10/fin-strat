import type { FunctionReturnType } from "convex/server";
import type { api } from "@convex/_generated/api";

export type ActivityData = FunctionReturnType<
  typeof api.plannerActivity.getMonth
>;
export type ActivityEntry = ActivityData["entries"][number];
export type ImportedActivity = ActivityData["pending"][number];

export type ActivityFilter = {
  type?:
    | "income"
    | "spending"
    | "expenses"
    | "savings"
    | "transfer"
    | "cardPayment"
    | "outflow";
  categoryId?: string | null;
  billId?: string;
  subscriptionId?: string;
  accountId?: string;
  direction?: "in" | "out";
};
