"use client";
import { usePaginatedQuery, useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { useUser } from "@/features/auth/use-user";

/** Shared metadata reads. This hook never subscribes to account graphs. */
export function useMoneyFlowPlan() {
  const user = useUser();
  const root = useQuery(api.moneyFlow.getCurrent, user ? {} : "skip");
  const { results: accounts, status } = usePaginatedQuery(
    api.moneyFlow.listAccounts,
    root ? { documentId: root._id } : "skip",
    { initialNumItems: 25 }
  );
  return {
    root: root ?? null,
    accounts,
    isLoading:
      !user || root === undefined || (!!root && status === "LoadingFirstPage"),
  };
}
