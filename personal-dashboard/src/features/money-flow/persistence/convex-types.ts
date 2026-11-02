import type { FunctionReturnType } from "convex/server";
import type { api } from "@convex/_generated/api";

/** Client contracts derived from the validated backend API. */
export type MoneyFlowPlan = NonNullable<
  FunctionReturnType<typeof api.moneyFlow.getCurrent>
>;
export type MoneyFlowAccountSummary = FunctionReturnType<
  typeof api.moneyFlow.listAccounts
>["page"][number];
export type MoneyFlowWorkspaceSnapshot = FunctionReturnType<
  typeof api.moneyFlow.getWorkspace
>;
